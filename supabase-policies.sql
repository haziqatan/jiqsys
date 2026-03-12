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

drop policy if exists "dev_full_access_team_members" on public.team_members;
create policy "dev_full_access_team_members"
on public.team_members
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "dev_full_access_statuses" on public.statuses;
create policy "dev_full_access_statuses"
on public.statuses
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "dev_full_access_modules" on public.modules;
create policy "dev_full_access_modules"
on public.modules
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "dev_full_access_tickets" on public.tickets;
create policy "dev_full_access_tickets"
on public.tickets
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "dev_full_access_ticket_modules" on public.ticket_modules;
create policy "dev_full_access_ticket_modules"
on public.ticket_modules
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "dev_full_access_ticket_activity" on public.ticket_activity;
create policy "dev_full_access_ticket_activity"
on public.ticket_activity
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "dev_full_access_module_notes" on public.module_notes;
create policy "dev_full_access_module_notes"
on public.module_notes
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "dev_full_access_test_groups" on public.test_groups;
create policy "dev_full_access_test_groups"
on public.test_groups
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "dev_full_access_test_cases" on public.test_cases;
create policy "dev_full_access_test_cases"
on public.test_cases
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "dev_full_access_ticket_test_group_links" on public.ticket_test_group_links;
create policy "dev_full_access_ticket_test_group_links"
on public.ticket_test_group_links
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "dev_full_access_ticket_test_case_checks" on public.ticket_test_case_checks;
create policy "dev_full_access_ticket_test_case_checks"
on public.ticket_test_case_checks
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "dev_full_access_ticket_references" on public.ticket_references;
create policy "dev_full_access_ticket_references"
on public.ticket_references
for all
to anon, authenticated
using (true)
with check (true);
