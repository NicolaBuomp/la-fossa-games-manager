alter table public.sponsors
  add column if not exists category text not null default 'bronzo',
  add column if not exists promised_amount numeric(10,2) not null default 0,
  add column if not exists received_amount numeric(10,2) not null default 0,
  add column if not exists payment_method text,
  add column if not exists responsible_user_id uuid references public.profiles(id);

update public.sponsors
set
  promised_amount = coalesce(nullif(promised_amount, 0), value, 0),
  received_amount = case
    when status = 'pagato' then coalesce(nullif(received_amount, 0), value, 0)
    else received_amount
  end,
  payment_method = coalesce(payment_method, type)
where true;

alter table public.sponsors
  drop constraint if exists sponsors_category_check,
  add constraint sponsors_category_check
    check (category = any (array['bronzo'::text, 'silver'::text, 'gold'::text])),
  drop constraint if exists sponsors_amounts_non_negative_check,
  add constraint sponsors_amounts_non_negative_check
    check (promised_amount >= 0 and received_amount >= 0);

alter table public.expenses
  add column if not exists status text not null default 'pagata';

alter table public.expenses
  drop constraint if exists expenses_status_check,
  add constraint expenses_status_check
    check (status = any (array['pagata'::text, 'da_rimborsare'::text, 'rimborsata'::text]));

drop policy if exists expenses_admin_insert on public.expenses;
drop policy if exists expenses_admin_read on public.expenses;
drop policy if exists expenses_admin_update on public.expenses;
drop policy if exists expenses_member_insert on public.expenses;
drop policy if exists expenses_member_read on public.expenses;
drop policy if exists expenses_member_update on public.expenses;

create policy expenses_member_insert
on public.expenses
for insert
with check (public.is_active_member());

create policy expenses_member_read
on public.expenses
for select
using (public.is_active_member());

create policy expenses_member_update
on public.expenses
for update
using (public.is_active_member())
with check (public.is_active_member());

drop policy if exists sponsors_admin_insert on public.sponsors;
drop policy if exists sponsors_admin_read on public.sponsors;
drop policy if exists sponsors_admin_update on public.sponsors;
drop policy if exists sponsors_member_insert on public.sponsors;
drop policy if exists sponsors_member_read on public.sponsors;
drop policy if exists sponsors_member_update on public.sponsors;

create policy sponsors_member_insert
on public.sponsors
for insert
with check (public.is_active_member());

create policy sponsors_member_read
on public.sponsors
for select
using (public.is_active_member());

create policy sponsors_member_update
on public.sponsors
for update
using (public.is_active_member())
with check (public.is_active_member());
