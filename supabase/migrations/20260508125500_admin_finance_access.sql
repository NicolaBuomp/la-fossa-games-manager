drop policy if exists "expenses_member_read" on public.expenses;
drop policy if exists "expenses_member_insert" on public.expenses;
drop policy if exists "expenses_member_update" on public.expenses;
drop policy if exists "expenses_admin_delete" on public.expenses;
drop policy if exists "incomes_member_read" on public.incomes;
drop policy if exists "incomes_member_insert" on public.incomes;
drop policy if exists "incomes_member_update" on public.incomes;
drop policy if exists "incomes_admin_delete" on public.incomes;
drop policy if exists "sponsors_member_read" on public.sponsors;
drop policy if exists "sponsors_member_insert" on public.sponsors;
drop policy if exists "sponsors_member_update" on public.sponsors;
drop policy if exists "sponsors_admin_delete" on public.sponsors;
drop policy if exists "audit_logs_member_read" on public.audit_logs;

create policy "expenses_admin_read" on public.expenses
  for select using (public.is_admin());
create policy "expenses_admin_insert" on public.expenses
  for insert with check (public.is_admin());
create policy "expenses_admin_update" on public.expenses
  for update using (public.is_admin()) with check (public.is_admin());
create policy "expenses_admin_delete" on public.expenses
  for delete using (public.is_admin());

create policy "incomes_admin_read" on public.incomes
  for select using (public.is_admin());
create policy "incomes_admin_insert" on public.incomes
  for insert with check (public.is_admin());
create policy "incomes_admin_update" on public.incomes
  for update using (public.is_admin()) with check (public.is_admin());
create policy "incomes_admin_delete" on public.incomes
  for delete using (public.is_admin());

create policy "sponsors_admin_read" on public.sponsors
  for select using (public.is_admin());
create policy "sponsors_admin_insert" on public.sponsors
  for insert with check (public.is_admin());
create policy "sponsors_admin_update" on public.sponsors
  for update using (public.is_admin()) with check (public.is_admin());
create policy "sponsors_admin_delete" on public.sponsors
  for delete using (public.is_admin());

create policy "audit_logs_admin_read" on public.audit_logs
  for select using (public.is_admin());
