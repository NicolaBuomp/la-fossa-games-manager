create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'staff' check (role in ('staff', 'admin')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  description text not null,
  category text not null,
  amount numeric(10,2) not null,
  paid_by text,
  payment_method text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.incomes (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  source text not null,
  category text not null,
  amount numeric(10,2) not null,
  received_by text,
  payment_method text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sponsors (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  contact_info text,
  type text not null default 'cash' check (type in ('cash', 'in_natura')),
  value numeric(10,2) not null default 0,
  status text not null default 'contattato' check (status in ('contattato', 'in_trattativa', 'confermato', 'pagato')),
  deliverables text,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tournament text not null,
  contact text,
  fee numeric(10,2) not null default 0,
  paid boolean not null default false,
  registration_date date not null default current_date,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
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

create or replace function public.set_created_by()
returns trigger
language plpgsql
as $$
begin
  if new.created_by is null then
    new.created_by = auth.uid();
  end if;
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    coalesce(nullif(new.raw_user_meta_data ->> 'role', ''), 'staff')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop trigger if exists expenses_updated_at on public.expenses;
create trigger expenses_updated_at before update on public.expenses for each row execute function public.set_updated_at();
drop trigger if exists incomes_updated_at on public.incomes;
create trigger incomes_updated_at before update on public.incomes for each row execute function public.set_updated_at();
drop trigger if exists sponsors_updated_at on public.sponsors;
create trigger sponsors_updated_at before update on public.sponsors for each row execute function public.set_updated_at();
drop trigger if exists registrations_updated_at on public.registrations;
create trigger registrations_updated_at before update on public.registrations for each row execute function public.set_updated_at();

drop trigger if exists expenses_created_by on public.expenses;
create trigger expenses_created_by before insert on public.expenses for each row execute function public.set_created_by();
drop trigger if exists incomes_created_by on public.incomes;
create trigger incomes_created_by before insert on public.incomes for each row execute function public.set_created_by();
drop trigger if exists sponsors_created_by on public.sponsors;
create trigger sponsors_created_by before insert on public.sponsors for each row execute function public.set_created_by();
drop trigger if exists registrations_created_by on public.registrations;
create trigger registrations_created_by before insert on public.registrations for each row execute function public.set_created_by();

create or replace function public.is_active_member()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and active = true
      and role in ('staff', 'admin')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and active = true
      and role = 'admin'
  );
$$;

create or replace function public.update_own_profile_name(profile_full_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set full_name = nullif(trim(profile_full_name), '')
  where id = auth.uid();
end;
$$;

alter table public.profiles enable row level security;
alter table public.expenses enable row level security;
alter table public.incomes enable row level security;
alter table public.sponsors enable row level security;
alter table public.registrations enable row level security;

drop policy if exists "profiles_self_read" on public.profiles;
drop policy if exists "profiles_admin_insert" on public.profiles;
drop policy if exists "profiles_admin_update" on public.profiles;
drop policy if exists "profiles_admin_delete" on public.profiles;
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
drop policy if exists "registrations_member_read" on public.registrations;
drop policy if exists "registrations_member_insert" on public.registrations;
drop policy if exists "registrations_member_update" on public.registrations;
drop policy if exists "registrations_admin_delete" on public.registrations;

create policy "profiles_self_read" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_admin_insert" on public.profiles
  for insert with check (public.is_admin());
create policy "profiles_admin_update" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());
create policy "profiles_admin_delete" on public.profiles
  for delete using (public.is_admin());

create policy "expenses_member_read" on public.expenses
  for select using (public.is_active_member());
create policy "expenses_member_insert" on public.expenses
  for insert with check (public.is_active_member());
create policy "expenses_member_update" on public.expenses
  for update using (public.is_active_member()) with check (public.is_active_member());
create policy "expenses_admin_delete" on public.expenses
  for delete using (public.is_admin());

create policy "incomes_member_read" on public.incomes
  for select using (public.is_active_member());
create policy "incomes_member_insert" on public.incomes
  for insert with check (public.is_active_member());
create policy "incomes_member_update" on public.incomes
  for update using (public.is_active_member()) with check (public.is_active_member());
create policy "incomes_admin_delete" on public.incomes
  for delete using (public.is_admin());

create policy "sponsors_member_read" on public.sponsors
  for select using (public.is_active_member());
create policy "sponsors_member_insert" on public.sponsors
  for insert with check (public.is_active_member());
create policy "sponsors_member_update" on public.sponsors
  for update using (public.is_active_member()) with check (public.is_active_member());
create policy "sponsors_admin_delete" on public.sponsors
  for delete using (public.is_admin());

create policy "registrations_member_read" on public.registrations
  for select using (public.is_active_member());
create policy "registrations_member_insert" on public.registrations
  for insert with check (public.is_active_member());
create policy "registrations_member_update" on public.registrations
  for update using (public.is_active_member()) with check (public.is_active_member());
create policy "registrations_admin_delete" on public.registrations
  for delete using (public.is_admin());

create index if not exists expenses_date_idx on public.expenses(date desc);
create index if not exists incomes_date_idx on public.incomes(date desc);
create index if not exists sponsors_status_idx on public.sponsors(status);
create index if not exists registrations_paid_idx on public.registrations(paid);
