begin;

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_bootstrap_owners (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  created_at timestamptz not null default now(),
  primary key (workspace_id, email)
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','member')),
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_workspaces_updated_at on public.workspaces;
create trigger set_workspaces_updated_at
before update on public.workspaces
for each row execute function public.set_updated_at();

drop trigger if exists set_workspace_members_updated_at on public.workspace_members;
create trigger set_workspace_members_updated_at
before update on public.workspace_members
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    lower(coalesce(new.email, '')),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', split_part(coalesce(new.email, ''), '@', 1))
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = excluded.full_name,
      updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

insert into public.workspaces (name)
select 'Jiqsys Workspace'
where not exists (select 1 from public.workspaces);

insert into public.workspace_bootstrap_owners (workspace_id, email)
select id, 'haziqhub@gmail.com'
from public.workspaces
where not exists (
  select 1
  from public.workspace_bootstrap_owners
  where email = 'haziqhub@gmail.com'
);

create or replace function public.current_workspace_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select wm.workspace_id
  from public.workspace_members wm
  where wm.user_id = auth.uid()
  order by wm.created_at asc
  limit 1
$$;

create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
  )
$$;

create or replace function public.is_workspace_owner(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
      and wm.role = 'owner'
  )
$$;

create or replace function public.workspace_can(target_workspace_id uuid, permission_name text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
      and (
        wm.role = 'owner'
        or case permission_name
          when 'can_create_tickets' then wm.can_create_tickets
          when 'can_edit_tickets' then wm.can_edit_tickets
          when 'can_delete_tickets' then wm.can_delete_tickets
          when 'can_create_features' then wm.can_create_features
          when 'can_edit_features' then wm.can_edit_features
          when 'can_delete_features' then wm.can_delete_features
          when 'can_manage_team' then wm.can_manage_team
          when 'can_manage_statuses' then wm.can_manage_statuses
          when 'can_manage_settings' then wm.can_manage_settings
          when 'can_manage_members' then wm.can_manage_members
          else false
        end
      )
  )
$$;

create or replace function public.bootstrap_workspace_owner()
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  target_workspace_id uuid;
begin
  if current_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select wbo.workspace_id
  into target_workspace_id
  from public.workspace_bootstrap_owners wbo
  where lower(wbo.email) = current_email
  order by wbo.created_at asc
  limit 1;

  if target_workspace_id is null then
    raise exception 'No bootstrap workspace configured for this email';
  end if;

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
    target_workspace_id,
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

  update public.workspaces
  set owner_user_id = current_user_id,
      updated_at = now()
  where id = target_workspace_id
    and (owner_user_id is null or owner_user_id = current_user_id);

  return target_workspace_id;
end;
$$;

grant execute on function public.bootstrap_workspace_owner() to authenticated;

alter table public.statuses add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.modules add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.tickets add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.team_members add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.module_notes add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.test_groups add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.test_cases add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;
alter table public.app_settings add column if not exists workspace_id uuid references public.workspaces(id) on delete cascade;

update public.statuses set workspace_id = (select id from public.workspaces limit 1) where workspace_id is null;
update public.modules set workspace_id = (select id from public.workspaces limit 1) where workspace_id is null;
update public.tickets set workspace_id = (select id from public.workspaces limit 1) where workspace_id is null;
update public.team_members set workspace_id = (select id from public.workspaces limit 1) where workspace_id is null;
update public.module_notes mn
set workspace_id = m.workspace_id
from public.modules m
where mn.module_id = m.id
  and mn.workspace_id is null;
update public.test_groups tg
set workspace_id = m.workspace_id
from public.modules m
where tg.module_id = m.id
  and tg.workspace_id is null;
update public.test_cases tc
set workspace_id = tg.workspace_id
from public.test_groups tg
where tc.test_group_id = tg.id
  and tc.workspace_id is null;
update public.app_settings set workspace_id = (select id from public.workspaces limit 1) where workspace_id is null;

alter table public.statuses alter column workspace_id set default public.current_workspace_id();
alter table public.modules alter column workspace_id set default public.current_workspace_id();
alter table public.tickets alter column workspace_id set default public.current_workspace_id();
alter table public.team_members alter column workspace_id set default public.current_workspace_id();
alter table public.module_notes alter column workspace_id set default public.current_workspace_id();
alter table public.test_groups alter column workspace_id set default public.current_workspace_id();
alter table public.test_cases alter column workspace_id set default public.current_workspace_id();
alter table public.app_settings alter column workspace_id set default public.current_workspace_id();

alter table public.statuses alter column workspace_id set not null;
alter table public.modules alter column workspace_id set not null;
alter table public.tickets alter column workspace_id set not null;
alter table public.team_members alter column workspace_id set not null;
alter table public.module_notes alter column workspace_id set not null;
alter table public.test_groups alter column workspace_id set not null;
alter table public.test_cases alter column workspace_id set not null;
alter table public.app_settings alter column workspace_id set not null;

alter table public.app_settings drop constraint if exists app_settings_setting_key_key;
drop index if exists public.app_settings_setting_key_key;
create unique index if not exists app_settings_workspace_setting_key_key on public.app_settings (workspace_id, setting_key);

alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_bootstrap_owners enable row level security;
alter table public.workspace_members enable row level security;
alter table public.team_members enable row level security;
alter table public.statuses enable row level security;
alter table public.modules enable row level security;
alter table public.tickets enable row level security;
alter table public.ticket_modules enable row level security;
alter table public.ticket_activity enable row level security;
alter table public.module_notes enable row level security;
alter table public.test_groups enable row level security;
alter table public.test_cases enable row level security;
alter table public.ticket_test_group_links enable row level security;
alter table public.ticket_test_case_checks enable row level security;
alter table public.ticket_references enable row level security;
alter table public.app_settings enable row level security;

drop policy if exists "profiles_select_self_or_workspace" on public.profiles;
create policy "profiles_select_self_or_workspace"
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.workspace_members mine
    join public.workspace_members theirs
      on theirs.workspace_id = mine.workspace_id
    where mine.user_id = auth.uid()
      and theirs.user_id = profiles.id
  )
);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "workspaces_select_member" on public.workspaces;
create policy "workspaces_select_member"
on public.workspaces
for select
to authenticated
using (public.is_workspace_member(id));

drop policy if exists "workspaces_update_owner" on public.workspaces;
create policy "workspaces_update_owner"
on public.workspaces
for update
to authenticated
using (public.is_workspace_owner(id))
with check (public.is_workspace_owner(id));

drop policy if exists "workspace_bootstrap_owner_lookup" on public.workspace_bootstrap_owners;
create policy "workspace_bootstrap_owner_lookup"
on public.workspace_bootstrap_owners
for select
to authenticated
using (lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')));

drop policy if exists "workspace_members_select_member" on public.workspace_members;
create policy "workspace_members_select_member"
on public.workspace_members
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "workspace_members_insert_owner" on public.workspace_members;
create policy "workspace_members_insert_owner"
on public.workspace_members
for insert
to authenticated
with check (
  public.is_workspace_owner(workspace_id)
  or (
    role = 'owner'
    and user_id = auth.uid()
    and lower(coalesce(auth.jwt() ->> 'email', '')) = 'haziqhub@gmail.com'
    and exists (
      select 1
      from public.workspace_bootstrap_owners wbo
      where wbo.workspace_id = workspace_members.workspace_id
        and lower(wbo.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    )
  )
);

drop policy if exists "workspace_members_update_owner" on public.workspace_members;
create policy "workspace_members_update_owner"
on public.workspace_members
for update
to authenticated
using (public.is_workspace_owner(workspace_id))
with check (public.is_workspace_owner(workspace_id));

drop policy if exists "workspace_members_delete_owner" on public.workspace_members;
create policy "workspace_members_delete_owner"
on public.workspace_members
for delete
to authenticated
using (public.is_workspace_owner(workspace_id));

drop policy if exists "team_members_select_member" on public.team_members;
create policy "team_members_select_member"
on public.team_members
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "team_members_insert_manager" on public.team_members;
create policy "team_members_insert_manager"
on public.team_members
for insert
to authenticated
with check (public.workspace_can(workspace_id, 'can_manage_team'));

drop policy if exists "team_members_update_manager" on public.team_members;
create policy "team_members_update_manager"
on public.team_members
for update
to authenticated
using (public.workspace_can(workspace_id, 'can_manage_team'))
with check (public.workspace_can(workspace_id, 'can_manage_team'));

drop policy if exists "team_members_delete_manager" on public.team_members;
create policy "team_members_delete_manager"
on public.team_members
for delete
to authenticated
using (public.workspace_can(workspace_id, 'can_manage_team'));

drop policy if exists "statuses_select_member" on public.statuses;
create policy "statuses_select_member"
on public.statuses
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "statuses_insert_manager" on public.statuses;
create policy "statuses_insert_manager"
on public.statuses
for insert
to authenticated
with check (public.workspace_can(workspace_id, 'can_manage_statuses'));

drop policy if exists "statuses_update_manager" on public.statuses;
create policy "statuses_update_manager"
on public.statuses
for update
to authenticated
using (public.workspace_can(workspace_id, 'can_manage_statuses'))
with check (public.workspace_can(workspace_id, 'can_manage_statuses'));

drop policy if exists "modules_select_member" on public.modules;
create policy "modules_select_member"
on public.modules
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "modules_insert_creator" on public.modules;
create policy "modules_insert_creator"
on public.modules
for insert
to authenticated
with check (public.workspace_can(workspace_id, 'can_create_features'));

drop policy if exists "modules_update_editor" on public.modules;
create policy "modules_update_editor"
on public.modules
for update
to authenticated
using (public.workspace_can(workspace_id, 'can_edit_features'))
with check (public.workspace_can(workspace_id, 'can_edit_features'));

drop policy if exists "modules_delete_deleter" on public.modules;
create policy "modules_delete_deleter"
on public.modules
for delete
to authenticated
using (public.workspace_can(workspace_id, 'can_delete_features'));

drop policy if exists "tickets_select_member" on public.tickets;
create policy "tickets_select_member"
on public.tickets
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "tickets_insert_creator" on public.tickets;
create policy "tickets_insert_creator"
on public.tickets
for insert
to authenticated
with check (public.workspace_can(workspace_id, 'can_create_tickets'));

drop policy if exists "tickets_update_editor" on public.tickets;
create policy "tickets_update_editor"
on public.tickets
for update
to authenticated
using (public.workspace_can(workspace_id, 'can_edit_tickets'))
with check (public.workspace_can(workspace_id, 'can_edit_tickets'));

drop policy if exists "tickets_delete_deleter" on public.tickets;
create policy "tickets_delete_deleter"
on public.tickets
for delete
to authenticated
using (public.workspace_can(workspace_id, 'can_delete_tickets'));

drop policy if exists "module_notes_select_member" on public.module_notes;
create policy "module_notes_select_member"
on public.module_notes
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "module_notes_insert_editor" on public.module_notes;
create policy "module_notes_insert_editor"
on public.module_notes
for insert
to authenticated
with check (public.workspace_can(workspace_id, 'can_edit_features'));

drop policy if exists "module_notes_update_editor" on public.module_notes;
create policy "module_notes_update_editor"
on public.module_notes
for update
to authenticated
using (public.workspace_can(workspace_id, 'can_edit_features'))
with check (public.workspace_can(workspace_id, 'can_edit_features'));

drop policy if exists "test_groups_select_member" on public.test_groups;
create policy "test_groups_select_member"
on public.test_groups
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "test_groups_insert_editor" on public.test_groups;
create policy "test_groups_insert_editor"
on public.test_groups
for insert
to authenticated
with check (public.workspace_can(workspace_id, 'can_edit_features'));

drop policy if exists "test_groups_update_editor" on public.test_groups;
create policy "test_groups_update_editor"
on public.test_groups
for update
to authenticated
using (public.workspace_can(workspace_id, 'can_edit_features'))
with check (public.workspace_can(workspace_id, 'can_edit_features'));

drop policy if exists "test_groups_delete_editor" on public.test_groups;
create policy "test_groups_delete_editor"
on public.test_groups
for delete
to authenticated
using (public.workspace_can(workspace_id, 'can_edit_features'));

drop policy if exists "test_cases_select_member" on public.test_cases;
create policy "test_cases_select_member"
on public.test_cases
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "test_cases_insert_editor" on public.test_cases;
create policy "test_cases_insert_editor"
on public.test_cases
for insert
to authenticated
with check (public.workspace_can(workspace_id, 'can_edit_features'));

drop policy if exists "test_cases_update_editor" on public.test_cases;
create policy "test_cases_update_editor"
on public.test_cases
for update
to authenticated
using (public.workspace_can(workspace_id, 'can_edit_features'))
with check (public.workspace_can(workspace_id, 'can_edit_features'));

drop policy if exists "test_cases_delete_editor" on public.test_cases;
create policy "test_cases_delete_editor"
on public.test_cases
for delete
to authenticated
using (public.workspace_can(workspace_id, 'can_edit_features'));

drop policy if exists "app_settings_select_member" on public.app_settings;
create policy "app_settings_select_member"
on public.app_settings
for select
to authenticated
using (public.is_workspace_member(workspace_id));

drop policy if exists "app_settings_insert_manager" on public.app_settings;
create policy "app_settings_insert_manager"
on public.app_settings
for insert
to authenticated
with check (public.workspace_can(workspace_id, 'can_manage_settings'));

drop policy if exists "app_settings_update_manager" on public.app_settings;
create policy "app_settings_update_manager"
on public.app_settings
for update
to authenticated
using (public.workspace_can(workspace_id, 'can_manage_settings'))
with check (public.workspace_can(workspace_id, 'can_manage_settings'));

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
      and public.is_workspace_member(t.workspace_id)
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
      and public.workspace_can(t.workspace_id, 'can_edit_tickets')
  )
)
with check (
  exists (
    select 1
    from public.tickets t
    join public.modules m on m.id = ticket_modules.module_id
    where t.id = ticket_modules.ticket_id
      and t.workspace_id = m.workspace_id
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
      and public.is_workspace_member(t.workspace_id)
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
      and public.workspace_can(t.workspace_id, 'can_edit_tickets')
  )
)
with check (
  exists (
    select 1
    from public.tickets t
    where t.id = ticket_activity.ticket_id
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
      and public.is_workspace_member(t.workspace_id)
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
      and public.workspace_can(t.workspace_id, 'can_edit_tickets')
  )
)
with check (
  exists (
    select 1
    from public.tickets t
    where t.id = ticket_references.ticket_id
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
      and public.is_workspace_member(t.workspace_id)
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
      and public.workspace_can(t.workspace_id, 'can_edit_tickets')
  )
)
with check (
  exists (
    select 1
    from public.tickets t
    join public.test_groups tg on tg.id = ticket_test_group_links.test_group_id
    where t.id = ticket_test_group_links.ticket_id
      and tg.workspace_id = t.workspace_id
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
    from public.tickets t
    where t.id = ticket_test_case_checks.ticket_id
      and public.is_workspace_member(t.workspace_id)
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
    where t.id = ticket_test_case_checks.ticket_id
      and public.workspace_can(t.workspace_id, 'can_edit_tickets')
  )
)
with check (
  exists (
    select 1
    from public.tickets t
    join public.test_cases tc on tc.id = ticket_test_case_checks.test_case_id
    where t.id = ticket_test_case_checks.ticket_id
      and tc.workspace_id = t.workspace_id
      and public.workspace_can(t.workspace_id, 'can_edit_tickets')
  )
);

commit;
