create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users(id) on delete set null,
  full_name text not null,
  role_title text,
  email text unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.statuses (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null unique,
  color text not null,
  sort_order integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  module_key text not null unique,
  name text not null,
  page_slug text not null unique,
  description text,
  sort_order integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_no text not null unique,
  title text not null,
  description text,
  status_id uuid not null references public.statuses(id) on delete restrict,
  priority text not null check (priority in ('Critical', 'High', 'Normal', 'Low')),
  assignee_id uuid references public.team_members(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  start_date date,
  due_date date,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ticket_modules (
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (ticket_id, module_id)
);

create table if not exists public.ticket_activity (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  actor_member_id uuid references public.team_members(id) on delete set null,
  action_type text not null,
  message text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.module_notes (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null unique references public.modules(id) on delete cascade,
  notes_html text,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.test_groups (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.test_cases (
  id uuid primary key default gen_random_uuid(),
  test_group_id uuid not null references public.test_groups(id) on delete cascade,
  label text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ticket_test_group_links (
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  test_group_id uuid not null references public.test_groups(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (ticket_id, test_group_id)
);

create table if not exists public.ticket_test_case_checks (
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  test_case_id uuid not null references public.test_cases(id) on delete cascade,
  is_checked boolean not null default true,
  checked_by uuid references auth.users(id) on delete set null,
  checked_at timestamptz not null default now(),
  primary key (ticket_id, test_case_id)
);

create table if not exists public.ticket_references (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets(id) on delete cascade,
  ref_type text,
  ref_value text not null,
  label text,
  url text,
  created_at timestamptz not null default now()
);

create index if not exists idx_tickets_status_id on public.tickets(status_id);
create index if not exists idx_tickets_assignee_id on public.tickets(assignee_id);
create index if not exists idx_tickets_deleted_at on public.tickets(deleted_at);
create index if not exists idx_ticket_activity_ticket_id on public.ticket_activity(ticket_id);
create index if not exists idx_test_groups_module_id on public.test_groups(module_id);
create index if not exists idx_test_cases_group_id on public.test_cases(test_group_id);

drop trigger if exists set_team_members_updated_at on public.team_members;
create trigger set_team_members_updated_at
before update on public.team_members
for each row execute function public.set_updated_at();

drop trigger if exists set_statuses_updated_at on public.statuses;
create trigger set_statuses_updated_at
before update on public.statuses
for each row execute function public.set_updated_at();

drop trigger if exists set_modules_updated_at on public.modules;
create trigger set_modules_updated_at
before update on public.modules
for each row execute function public.set_updated_at();

drop trigger if exists set_tickets_updated_at on public.tickets;
create trigger set_tickets_updated_at
before update on public.tickets
for each row execute function public.set_updated_at();

drop trigger if exists set_module_notes_updated_at on public.module_notes;
create trigger set_module_notes_updated_at
before update on public.module_notes
for each row execute function public.set_updated_at();

drop trigger if exists set_test_groups_updated_at on public.test_groups;
create trigger set_test_groups_updated_at
before update on public.test_groups
for each row execute function public.set_updated_at();

drop trigger if exists set_test_cases_updated_at on public.test_cases;
create trigger set_test_cases_updated_at
before update on public.test_cases
for each row execute function public.set_updated_at();

insert into public.statuses (code, name, color, sort_order)
values
  ('backlog', 'Backlog', '#aaa9a3', 1),
  ('todo', 'To Do', '#6f6e69', 2),
  ('in_progress', 'In Progress', '#f5c800', 3),
  ('in_review', 'In Review', '#3b72d9', 4),
  ('done', 'Done', '#2d9a6b', 5),
  ('blocked', 'Blocked', '#d94f3d', 6)
on conflict (code) do update
set
  name = excluded.name,
  color = excluded.color,
  sort_order = excluded.sort_order,
  is_active = true;

insert into public.modules (module_key, name, page_slug, description, sort_order)
values
  ('Digital Form', 'Digital Form', 'digital-form', 'Submit, route, and monitor operational requests through structured approval workflows.', 1),
  ('PROMiS', 'PROMiS Dashboard', 'promis', 'Executive summaries, performance overviews, and cross-departmental reporting.', 2),
  ('Ops', 'Executive Dashboard', 'ops', 'High-level KPI views, cross-module summaries, and leadership reporting.', 3),
  ('Project Mgmt', 'Project Management', 'feat-pm', 'Plan, track, and deliver projects with milestones, timelines, and cross-team visibility.', 4),
  ('Master Data', 'Master Data', 'feat-md', 'Centralised reference data management for assets, locations, vendors, and categories.', 5),
  ('Mobile App', 'Mobile App', 'feat-mob', 'iOS and Android companion app for field staff to submit, track, and act on requests.', 6),
  ('RBAC', 'RBAC / Access Control', 'feat-rbac', 'Role-based permission management controlling what each user can view, edit, or approve.', 7),
  ('Landing Page', 'Landing Page', 'feat-lp', 'Public-facing entry point and product showcase.', 8),
  ('Version Control', 'Version Control', 'feat-vc', 'Track changes, manage releases, and maintain a full audit trail across the platform.', 9),
  ('Backend', 'Backend Integration', 'feat-be', 'APIs, webhooks, and service connectors linking the platform to external systems and data sources.', 10),
  ('Testing', 'Testing / QA', 'feat-qa', 'Test case management, bug reporting, and quality assurance tracking across releases.', 11),
  ('Onboarding', 'Onboarding', 'feat-ob', 'Guided user setup flows, walkthroughs, and onboarding checklists for new users.', 12),
  ('Fox Settings', 'Settings', 'feat-settings', 'Platform-level configuration, preferences, and system settings.', 13),
  ('Fox Trash', 'Trash', 'feat-trash', 'Soft-delete management, data recovery, and retention policy configuration.', 14)
on conflict (module_key) do update
set
  name = excluded.name,
  page_slug = excluded.page_slug,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = true;
