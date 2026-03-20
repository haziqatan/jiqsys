begin;

alter table public.profiles
  add column if not exists active_workspace_id uuid references public.workspaces(id) on delete set null;

alter table public.workspaces
  add column if not exists kind text not null default 'private';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'workspaces_kind_check'
      and conrelid = 'public.workspaces'::regclass
  ) then
    alter table public.workspaces
      add constraint workspaces_kind_check
      check (kind in ('private', 'shared'));
  end if;
end $$;

create table if not exists public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  invited_email text not null,
  invited_by_user_id uuid references auth.users(id) on delete set null,
  role text not null check (role in ('owner', 'member')),
  can_create_tickets boolean not null default false,
  can_edit_tickets boolean not null default false,
  can_delete_tickets boolean not null default false,
  can_create_features boolean not null default false,
  can_edit_features boolean not null default false,
  can_delete_features boolean not null default false,
  can_manage_team boolean not null default false,
  can_manage_statuses boolean not null default false,
  can_manage_settings boolean not null default false,
  can_manage_members boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  accepted_at timestamptz,
  accepted_user_id uuid references auth.users(id) on delete set null
);

create unique index if not exists workspace_invitations_pending_email_key
on public.workspace_invitations (workspace_id, (lower(invited_email)))
where status = 'pending';

create unique index if not exists workspaces_private_owner_unique
on public.workspaces (owner_user_id)
where kind = 'private' and owner_user_id is not null;

drop trigger if exists set_workspace_invitations_updated_at on public.workspace_invitations;
create trigger set_workspace_invitations_updated_at
before update on public.workspace_invitations
for each row execute function public.set_updated_at();

create or replace function public.format_workspace_name(input_full_name text)
returns text
language sql
immutable
as $$
  select case
    when nullif(trim(coalesce(input_full_name, '')), '') is null then 'My Workspace'
    else trim(input_full_name) || '''s Workspace'
  end
$$;

create or replace function public.current_workspace_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select p.active_workspace_id
      from public.profiles p
      where p.id = auth.uid()
        and p.active_workspace_id is not null
        and exists (
          select 1
          from public.workspace_members wm
          where wm.user_id = auth.uid()
            and wm.workspace_id = p.active_workspace_id
        )
    ),
    (
      select wm.workspace_id
      from public.workspace_members wm
      where wm.user_id = auth.uid()
      order by wm.created_at asc
      limit 1
    )
  )
$$;

create or replace function public.is_active_workspace(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target_workspace_id is not null
    and target_workspace_id = public.current_workspace_id()
    and public.is_workspace_member(target_workspace_id)
$$;

create or replace function public.ensure_private_workspace()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  profile_name text;
  profile_active_workspace_id uuid;
  private_workspace_id uuid;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select
    coalesce(nullif(trim(full_name), ''), split_part(current_email, '@', 1), 'Jiqsys User'),
    active_workspace_id
  into profile_name, profile_active_workspace_id
  from public.profiles
  where id = current_user_id;

  select w.id
  into private_workspace_id
  from public.workspaces w
  where w.owner_user_id = current_user_id
    and w.kind = 'private'
  order by w.created_at asc
  limit 1;

  if private_workspace_id is null then
  select wm.workspace_id
  into private_workspace_id
  from public.workspace_members wm
  join public.workspaces w on w.id = wm.workspace_id
  where wm.user_id = current_user_id
    and wm.role = 'owner'
    and w.kind = 'private'
  order by wm.created_at asc
  limit 1;
  end if;

  if private_workspace_id is null then
    select wbo.workspace_id
    into private_workspace_id
    from public.workspace_bootstrap_owners wbo
    where lower(wbo.email) = current_email
    order by wbo.created_at asc
    limit 1;

    if private_workspace_id is null then
      insert into public.workspaces (name, owner_user_id, kind)
      values (public.format_workspace_name(profile_name), current_user_id, 'private')
      on conflict do nothing
      returning id into private_workspace_id;

      if private_workspace_id is null then
        select w.id
        into private_workspace_id
        from public.workspaces w
        where w.owner_user_id = current_user_id
          and w.kind = 'private'
        order by w.created_at asc
        limit 1;
      end if;
    end if;
  end if;

  update public.workspaces
  set
    name = public.format_workspace_name(profile_name),
    owner_user_id = current_user_id,
    kind = 'private',
    updated_at = now()
  where id = private_workspace_id;

  insert into public.workspace_members (
    workspace_id,
    user_id,
    role,
    can_create_tickets,
    can_edit_tickets,
    can_delete_tickets,
    can_create_features,
    can_edit_features,
    can_delete_features,
    can_manage_team,
    can_manage_statuses,
    can_manage_settings,
    can_manage_members
  )
  values (
    private_workspace_id,
    current_user_id,
    'owner',
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true,
    true
  )
  on conflict (workspace_id, user_id) do update
  set
    role = 'owner',
    can_create_tickets = true,
    can_edit_tickets = true,
    can_delete_tickets = true,
    can_create_features = true,
    can_edit_features = true,
    can_delete_features = true,
    can_manage_team = true,
    can_manage_statuses = true,
    can_manage_settings = true,
    can_manage_members = true,
    updated_at = now();

  if profile_active_workspace_id is null
    or not exists (
      select 1
      from public.workspace_members wm
      where wm.user_id = current_user_id
        and wm.workspace_id = profile_active_workspace_id
    )
  then
    update public.profiles
    set active_workspace_id = private_workspace_id
    where id = current_user_id;
  end if;

  return private_workspace_id;
end;
$$;

create or replace function public.accept_workspace_invitations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  invitation_row public.workspace_invitations%rowtype;
  accepted_count integer := 0;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  for invitation_row in
    select *
    from public.workspace_invitations
    where lower(invited_email) = current_email
      and status = 'pending'
    order by created_at asc
  loop
    insert into public.workspace_members (
      workspace_id,
      user_id,
      role,
      can_create_tickets,
      can_edit_tickets,
      can_delete_tickets,
      can_create_features,
      can_edit_features,
      can_delete_features,
      can_manage_team,
      can_manage_statuses,
      can_manage_settings,
      can_manage_members
    )
    values (
      invitation_row.workspace_id,
      current_user_id,
      invitation_row.role,
      invitation_row.can_create_tickets,
      invitation_row.can_edit_tickets,
      invitation_row.can_delete_tickets,
      invitation_row.can_create_features,
      invitation_row.can_edit_features,
      invitation_row.can_delete_features,
      invitation_row.can_manage_team,
      invitation_row.can_manage_statuses,
      invitation_row.can_manage_settings,
      invitation_row.can_manage_members
    )
    on conflict (workspace_id, user_id) do nothing;

    update public.workspace_invitations
    set
      status = 'accepted',
      accepted_at = now(),
      accepted_user_id = current_user_id,
      updated_at = now()
    where id = invitation_row.id;

    update public.workspaces
    set kind = 'shared', updated_at = now()
    where id = invitation_row.workspace_id
      and kind <> 'shared';

    accepted_count := accepted_count + 1;
  end loop;

  return accepted_count;
end;
$$;

create or replace function public.set_active_workspace(target_workspace_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if not public.is_workspace_member(target_workspace_id) then
    raise exception 'You are not a member of that workspace';
  end if;

  update public.profiles
  set active_workspace_id = target_workspace_id
  where id = auth.uid();

  return target_workspace_id;
end;
$$;

create or replace function public.create_workspace_invitation(
  invited_email_input text,
  invited_role_input text default 'member',
  can_create_tickets_input boolean default false,
  can_edit_tickets_input boolean default false,
  can_delete_tickets_input boolean default false,
  can_create_features_input boolean default false,
  can_edit_features_input boolean default false,
  can_delete_features_input boolean default false,
  can_manage_team_input boolean default false,
  can_manage_statuses_input boolean default false,
  can_manage_settings_input boolean default false,
  can_manage_members_input boolean default false
)
returns table (
  invitation_id uuid,
  invited_email_value text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  target_workspace_id uuid := public.current_workspace_id();
  normalized_email text := lower(trim(coalesce(invited_email_input, '')));
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  if target_workspace_id is null then
    raise exception 'No active workspace found';
  end if;

  if not public.workspace_can(target_workspace_id, 'can_manage_members') then
    raise exception 'You do not have permission to manage members in this workspace';
  end if;

  if normalized_email = '' then
    raise exception 'Invitation email is required';
  end if;

  if normalized_email = current_email then
    raise exception 'You are already part of this workspace';
  end if;

  update public.workspaces
  set kind = 'shared', updated_at = now()
  where id = target_workspace_id
    and kind <> 'shared';

  update public.workspace_invitations
  set
    invited_by_user_id = current_user_id,
    role = invited_role_input,
    can_create_tickets = case when invited_role_input = 'owner' then true else can_create_tickets_input end,
    can_edit_tickets = case when invited_role_input = 'owner' then true else can_edit_tickets_input end,
    can_delete_tickets = case when invited_role_input = 'owner' then true else can_delete_tickets_input end,
    can_create_features = case when invited_role_input = 'owner' then true else can_create_features_input end,
    can_edit_features = case when invited_role_input = 'owner' then true else can_edit_features_input end,
    can_delete_features = case when invited_role_input = 'owner' then true else can_delete_features_input end,
    can_manage_team = case when invited_role_input = 'owner' then true else can_manage_team_input end,
    can_manage_statuses = case when invited_role_input = 'owner' then true else can_manage_statuses_input end,
    can_manage_settings = case when invited_role_input = 'owner' then true else can_manage_settings_input end,
    can_manage_members = case when invited_role_input = 'owner' then true else can_manage_members_input end,
    status = 'pending',
    accepted_at = null,
    accepted_user_id = null,
    updated_at = now()
  where workspace_id = target_workspace_id
    and lower(invited_email) = normalized_email
    and status = 'pending';

  if not found then
    insert into public.workspace_invitations (
      workspace_id,
      invited_email,
      invited_by_user_id,
      role,
      can_create_tickets,
      can_edit_tickets,
      can_delete_tickets,
      can_create_features,
      can_edit_features,
      can_delete_features,
      can_manage_team,
      can_manage_statuses,
      can_manage_settings,
      can_manage_members,
      status
    )
    values (
      target_workspace_id,
      normalized_email,
      current_user_id,
      invited_role_input,
      case when invited_role_input = 'owner' then true else can_create_tickets_input end,
      case when invited_role_input = 'owner' then true else can_edit_tickets_input end,
      case when invited_role_input = 'owner' then true else can_delete_tickets_input end,
      case when invited_role_input = 'owner' then true else can_create_features_input end,
      case when invited_role_input = 'owner' then true else can_edit_features_input end,
      case when invited_role_input = 'owner' then true else can_delete_features_input end,
      case when invited_role_input = 'owner' then true else can_manage_team_input end,
      case when invited_role_input = 'owner' then true else can_manage_statuses_input end,
      case when invited_role_input = 'owner' then true else can_manage_settings_input end,
      case when invited_role_input = 'owner' then true else can_manage_members_input end,
      'pending'
    );
  end if;

  return query
  select wi.id as invitation_id, wi.invited_email as invited_email_value
  from public.workspace_invitations wi
  where wi.workspace_id = target_workspace_id
    and lower(wi.invited_email) = normalized_email
    and wi.status = 'pending'
  order by wi.created_at desc
  limit 1;
end;
$$;

create or replace function public.revoke_workspace_invitation(invitation_id_input uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invitation_workspace_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select workspace_id
  into invitation_workspace_id
  from public.workspace_invitations
  where id = invitation_id_input;

  if invitation_workspace_id is null then
    raise exception 'Invitation not found';
  end if;

  if not public.workspace_can(invitation_workspace_id, 'can_manage_members') then
    raise exception 'You do not have permission to manage invitations in this workspace';
  end if;

  update public.workspace_invitations
  set status = 'revoked', updated_at = now()
  where id = invitation_id_input;

  return invitation_id_input;
end;
$$;

grant execute on function public.ensure_private_workspace() to authenticated;
grant execute on function public.accept_workspace_invitations() to authenticated;
grant execute on function public.set_active_workspace(uuid) to authenticated;
grant execute on function public.create_workspace_invitation(text, text, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean, boolean) to authenticated;
grant execute on function public.revoke_workspace_invitation(uuid) to authenticated;

alter table public.workspace_invitations enable row level security;

drop policy if exists "workspace_invitations_select_manager" on public.workspace_invitations;
create policy "workspace_invitations_select_manager"
on public.workspace_invitations
for select
to authenticated
using (
  public.is_active_workspace(workspace_id)
  and public.workspace_can(workspace_id, 'can_manage_members')
);

drop policy if exists "statuses_select_member" on public.statuses;
create policy "statuses_select_member"
on public.statuses
for select
to authenticated
using (public.is_active_workspace(workspace_id));

drop policy if exists "statuses_insert_manager" on public.statuses;
create policy "statuses_insert_manager"
on public.statuses
for insert
to authenticated
with check (
  public.is_active_workspace(workspace_id)
  and public.workspace_can(workspace_id, 'can_manage_statuses')
);

drop policy if exists "statuses_update_manager" on public.statuses;
create policy "statuses_update_manager"
on public.statuses
for update
to authenticated
using (
  public.is_active_workspace(workspace_id)
  and public.workspace_can(workspace_id, 'can_manage_statuses')
)
with check (
  public.is_active_workspace(workspace_id)
  and public.workspace_can(workspace_id, 'can_manage_statuses')
);

drop policy if exists "modules_select_member" on public.modules;
create policy "modules_select_member"
on public.modules
for select
to authenticated
using (public.is_active_workspace(workspace_id));

drop policy if exists "modules_insert_creator" on public.modules;
create policy "modules_insert_creator"
on public.modules
for insert
to authenticated
with check (
  public.is_active_workspace(workspace_id)
  and public.workspace_can(workspace_id, 'can_create_features')
);

drop policy if exists "modules_update_editor" on public.modules;
create policy "modules_update_editor"
on public.modules
for update
to authenticated
using (
  public.is_active_workspace(workspace_id)
  and public.workspace_can(workspace_id, 'can_edit_features')
)
with check (
  public.is_active_workspace(workspace_id)
  and public.workspace_can(workspace_id, 'can_edit_features')
);

drop policy if exists "modules_delete_deleter" on public.modules;
create policy "modules_delete_deleter"
on public.modules
for delete
to authenticated
using (
  public.is_active_workspace(workspace_id)
  and public.workspace_can(workspace_id, 'can_delete_features')
);

drop policy if exists "tickets_select_member" on public.tickets;
create policy "tickets_select_member"
on public.tickets
for select
to authenticated
using (public.is_active_workspace(workspace_id));

drop policy if exists "tickets_insert_creator" on public.tickets;
create policy "tickets_insert_creator"
on public.tickets
for insert
to authenticated
with check (
  public.is_active_workspace(workspace_id)
  and public.workspace_can(workspace_id, 'can_create_tickets')
);

drop policy if exists "tickets_update_editor" on public.tickets;
create policy "tickets_update_editor"
on public.tickets
for update
to authenticated
using (
  public.is_active_workspace(workspace_id)
  and public.workspace_can(workspace_id, 'can_edit_tickets')
)
with check (
  public.is_active_workspace(workspace_id)
  and public.workspace_can(workspace_id, 'can_edit_tickets')
);

drop policy if exists "tickets_delete_deleter" on public.tickets;
create policy "tickets_delete_deleter"
on public.tickets
for delete
to authenticated
using (
  public.is_active_workspace(workspace_id)
  and public.workspace_can(workspace_id, 'can_delete_tickets')
);

drop policy if exists "team_members_select_member" on public.team_members;
create policy "team_members_select_member"
on public.team_members
for select
to authenticated
using (public.is_active_workspace(workspace_id));

drop policy if exists "team_members_insert_manager" on public.team_members;
create policy "team_members_insert_manager"
on public.team_members
for insert
to authenticated
with check (
  public.is_active_workspace(workspace_id)
  and public.workspace_can(workspace_id, 'can_manage_team')
);

drop policy if exists "team_members_update_manager" on public.team_members;
create policy "team_members_update_manager"
on public.team_members
for update
to authenticated
using (
  public.is_active_workspace(workspace_id)
  and public.workspace_can(workspace_id, 'can_manage_team')
)
with check (
  public.is_active_workspace(workspace_id)
  and public.workspace_can(workspace_id, 'can_manage_team')
);

drop policy if exists "team_members_delete_manager" on public.team_members;
create policy "team_members_delete_manager"
on public.team_members
for delete
to authenticated
using (
  public.is_active_workspace(workspace_id)
  and public.workspace_can(workspace_id, 'can_manage_team')
);

drop policy if exists "module_notes_select_member" on public.module_notes;
create policy "module_notes_select_member"
on public.module_notes
for select
to authenticated
using (public.is_active_workspace(workspace_id));

drop policy if exists "module_notes_insert_editor" on public.module_notes;
create policy "module_notes_insert_editor"
on public.module_notes
for insert
to authenticated
with check (
  public.is_active_workspace(workspace_id)
  and public.workspace_can(workspace_id, 'can_edit_features')
);

drop policy if exists "module_notes_update_editor" on public.module_notes;
create policy "module_notes_update_editor"
on public.module_notes
for update
to authenticated
using (
  public.is_active_workspace(workspace_id)
  and public.workspace_can(workspace_id, 'can_edit_features')
)
with check (
  public.is_active_workspace(workspace_id)
  and public.workspace_can(workspace_id, 'can_edit_features')
);

drop policy if exists "test_groups_select_member" on public.test_groups;
create policy "test_groups_select_member"
on public.test_groups
for select
to authenticated
using (public.is_active_workspace(workspace_id));

drop policy if exists "test_groups_insert_editor" on public.test_groups;
create policy "test_groups_insert_editor"
on public.test_groups
for insert
to authenticated
with check (
  public.is_active_workspace(workspace_id)
  and public.workspace_can(workspace_id, 'can_edit_features')
);

drop policy if exists "test_groups_update_editor" on public.test_groups;
create policy "test_groups_update_editor"
on public.test_groups
for update
to authenticated
using (
  public.is_active_workspace(workspace_id)
  and public.workspace_can(workspace_id, 'can_edit_features')
)
with check (
  public.is_active_workspace(workspace_id)
  and public.workspace_can(workspace_id, 'can_edit_features')
);

drop policy if exists "test_groups_delete_editor" on public.test_groups;
create policy "test_groups_delete_editor"
on public.test_groups
for delete
to authenticated
using (
  public.is_active_workspace(workspace_id)
  and public.workspace_can(workspace_id, 'can_edit_features')
);

drop policy if exists "test_cases_select_member" on public.test_cases;
create policy "test_cases_select_member"
on public.test_cases
for select
to authenticated
using (public.is_active_workspace(workspace_id));

drop policy if exists "test_cases_insert_editor" on public.test_cases;
create policy "test_cases_insert_editor"
on public.test_cases
for insert
to authenticated
with check (
  public.is_active_workspace(workspace_id)
  and public.workspace_can(workspace_id, 'can_edit_features')
);

drop policy if exists "test_cases_update_editor" on public.test_cases;
create policy "test_cases_update_editor"
on public.test_cases
for update
to authenticated
using (
  public.is_active_workspace(workspace_id)
  and public.workspace_can(workspace_id, 'can_edit_features')
)
with check (
  public.is_active_workspace(workspace_id)
  and public.workspace_can(workspace_id, 'can_edit_features')
);

drop policy if exists "test_cases_delete_editor" on public.test_cases;
create policy "test_cases_delete_editor"
on public.test_cases
for delete
to authenticated
using (
  public.is_active_workspace(workspace_id)
  and public.workspace_can(workspace_id, 'can_edit_features')
);

drop policy if exists "app_settings_select_member" on public.app_settings;
create policy "app_settings_select_member"
on public.app_settings
for select
to authenticated
using (public.is_active_workspace(workspace_id));

drop policy if exists "app_settings_insert_manager" on public.app_settings;
create policy "app_settings_insert_manager"
on public.app_settings
for insert
to authenticated
with check (
  public.is_active_workspace(workspace_id)
  and public.workspace_can(workspace_id, 'can_manage_settings')
);

drop policy if exists "app_settings_update_manager" on public.app_settings;
create policy "app_settings_update_manager"
on public.app_settings
for update
to authenticated
using (
  public.is_active_workspace(workspace_id)
  and public.workspace_can(workspace_id, 'can_manage_settings')
)
with check (
  public.is_active_workspace(workspace_id)
  and public.workspace_can(workspace_id, 'can_manage_settings')
);

drop policy if exists "ticket_modules_select_member" on public.ticket_modules;
create policy "ticket_modules_select_member"
on public.ticket_modules
for select
to authenticated
using (
  exists (
    select 1
    from public.tickets t
    where t.id = ticket_modules.ticket_id
      and public.is_active_workspace(t.workspace_id)
  )
);

drop policy if exists "ticket_modules_write_editor" on public.ticket_modules;
create policy "ticket_modules_write_editor"
on public.ticket_modules
for all
to authenticated
using (
  exists (
    select 1
    from public.tickets t
    where t.id = ticket_modules.ticket_id
      and public.is_active_workspace(t.workspace_id)
      and public.workspace_can(t.workspace_id, 'can_edit_tickets')
  )
)
with check (
  exists (
    select 1
    from public.tickets t
    where t.id = ticket_modules.ticket_id
      and public.is_active_workspace(t.workspace_id)
      and public.workspace_can(t.workspace_id, 'can_edit_tickets')
  )
);

drop policy if exists "ticket_activity_select_member" on public.ticket_activity;
create policy "ticket_activity_select_member"
on public.ticket_activity
for select
to authenticated
using (
  exists (
    select 1
    from public.tickets t
    where t.id = ticket_activity.ticket_id
      and public.is_active_workspace(t.workspace_id)
  )
);

drop policy if exists "ticket_activity_write_editor" on public.ticket_activity;
create policy "ticket_activity_write_editor"
on public.ticket_activity
for all
to authenticated
using (
  exists (
    select 1
    from public.tickets t
    where t.id = ticket_activity.ticket_id
      and public.is_active_workspace(t.workspace_id)
      and public.workspace_can(t.workspace_id, 'can_edit_tickets')
  )
)
with check (
  exists (
    select 1
    from public.tickets t
    where t.id = ticket_activity.ticket_id
      and public.is_active_workspace(t.workspace_id)
      and public.workspace_can(t.workspace_id, 'can_edit_tickets')
  )
);

drop policy if exists "ticket_references_select_member" on public.ticket_references;
create policy "ticket_references_select_member"
on public.ticket_references
for select
to authenticated
using (
  exists (
    select 1
    from public.tickets t
    where t.id = ticket_references.ticket_id
      and public.is_active_workspace(t.workspace_id)
  )
);

drop policy if exists "ticket_references_write_editor" on public.ticket_references;
create policy "ticket_references_write_editor"
on public.ticket_references
for all
to authenticated
using (
  exists (
    select 1
    from public.tickets t
    where t.id = ticket_references.ticket_id
      and public.is_active_workspace(t.workspace_id)
      and public.workspace_can(t.workspace_id, 'can_edit_tickets')
  )
)
with check (
  exists (
    select 1
    from public.tickets t
    where t.id = ticket_references.ticket_id
      and public.is_active_workspace(t.workspace_id)
      and public.workspace_can(t.workspace_id, 'can_edit_tickets')
  )
);

drop policy if exists "ticket_test_group_links_select_member" on public.ticket_test_group_links;
create policy "ticket_test_group_links_select_member"
on public.ticket_test_group_links
for select
to authenticated
using (
  exists (
    select 1
    from public.tickets t
    where t.id = ticket_test_group_links.ticket_id
      and public.is_active_workspace(t.workspace_id)
  )
);

drop policy if exists "ticket_test_group_links_write_editor" on public.ticket_test_group_links;
create policy "ticket_test_group_links_write_editor"
on public.ticket_test_group_links
for all
to authenticated
using (
  exists (
    select 1
    from public.tickets t
    where t.id = ticket_test_group_links.ticket_id
      and public.is_active_workspace(t.workspace_id)
      and public.workspace_can(t.workspace_id, 'can_edit_tickets')
  )
)
with check (
  exists (
    select 1
    from public.tickets t
    where t.id = ticket_test_group_links.ticket_id
      and public.is_active_workspace(t.workspace_id)
      and public.workspace_can(t.workspace_id, 'can_edit_tickets')
  )
);

drop policy if exists "ticket_test_case_checks_select_member" on public.ticket_test_case_checks;
create policy "ticket_test_case_checks_select_member"
on public.ticket_test_case_checks
for select
to authenticated
using (
  exists (
    select 1
    from public.test_cases tc
    where tc.id = ticket_test_case_checks.test_case_id
      and public.is_active_workspace(tc.workspace_id)
  )
);

drop policy if exists "ticket_test_case_checks_write_editor" on public.ticket_test_case_checks;
create policy "ticket_test_case_checks_write_editor"
on public.ticket_test_case_checks
for all
to authenticated
using (
  exists (
    select 1
    from public.tickets t
    join public.test_cases tc on tc.id = ticket_test_case_checks.test_case_id
    where t.id = ticket_test_case_checks.ticket_id
      and tc.id = ticket_test_case_checks.test_case_id
      and public.is_active_workspace(t.workspace_id)
      and t.workspace_id = tc.workspace_id
      and public.workspace_can(t.workspace_id, 'can_edit_tickets')
  )
)
with check (
  exists (
    select 1
    from public.tickets t
    join public.test_cases tc on tc.id = ticket_test_case_checks.test_case_id
    where t.id = ticket_test_case_checks.ticket_id
      and tc.id = ticket_test_case_checks.test_case_id
      and public.is_active_workspace(t.workspace_id)
      and t.workspace_id = tc.workspace_id
      and public.workspace_can(t.workspace_id, 'can_edit_tickets')
  )
);

commit;
