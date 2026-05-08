alter table public.expenses add column if not exists updated_by uuid references auth.users(id);
alter table public.incomes add column if not exists updated_by uuid references auth.users(id);
alter table public.sponsors add column if not exists updated_by uuid references auth.users(id);
alter table public.registrations add column if not exists updated_by uuid references auth.users(id);
alter table public.tournaments add column if not exists updated_by uuid references auth.users(id);
alter table public.tournament_teams add column if not exists updated_by uuid references auth.users(id);
alter table public.team_participants add column if not exists created_by uuid references auth.users(id);
alter table public.team_participants add column if not exists updated_by uuid references auth.users(id);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  table_name text not null,
  record_id uuid not null,
  action text not null check (action in ('insert', 'update', 'delete')),
  changed_by uuid references auth.users(id),
  changed_by_name text,
  changed_at timestamptz not null default now(),
  old_data jsonb,
  new_data jsonb
);

create or replace function public.current_actor_name()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    nullif(trim(full_name), ''),
    nullif(trim(email), ''),
    auth.uid()::text,
    'Sistema'
  )
  from public.profiles
  where id = auth.uid()
  union all
  select coalesce(auth.uid()::text, 'Sistema')
  limit 1;
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
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
  if new.updated_by is null then
    new.updated_by = auth.uid();
  end if;
  return new;
end;
$$;

create or replace function public.record_audit_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id uuid := auth.uid();
begin
  insert into public.audit_logs (
    table_name,
    record_id,
    action,
    changed_by,
    changed_by_name,
    old_data,
    new_data
  )
  values (
    TG_TABLE_NAME,
    coalesce(new.id, old.id),
    lower(TG_OP),
    actor_id,
    public.current_actor_name(),
    case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(new) else null end
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists team_participants_created_by on public.team_participants;
create trigger team_participants_created_by before insert on public.team_participants for each row execute function public.set_created_by();

drop trigger if exists expenses_audit_log on public.expenses;
create trigger expenses_audit_log after insert or update or delete on public.expenses for each row execute function public.record_audit_log();
drop trigger if exists incomes_audit_log on public.incomes;
create trigger incomes_audit_log after insert or update or delete on public.incomes for each row execute function public.record_audit_log();
drop trigger if exists sponsors_audit_log on public.sponsors;
create trigger sponsors_audit_log after insert or update or delete on public.sponsors for each row execute function public.record_audit_log();
drop trigger if exists registrations_audit_log on public.registrations;
create trigger registrations_audit_log after insert or update or delete on public.registrations for each row execute function public.record_audit_log();
drop trigger if exists tournaments_audit_log on public.tournaments;
create trigger tournaments_audit_log after insert or update or delete on public.tournaments for each row execute function public.record_audit_log();
drop trigger if exists tournament_teams_audit_log on public.tournament_teams;
create trigger tournament_teams_audit_log after insert or update or delete on public.tournament_teams for each row execute function public.record_audit_log();
drop trigger if exists team_participants_audit_log on public.team_participants;
create trigger team_participants_audit_log after insert or update or delete on public.team_participants for each row execute function public.record_audit_log();

alter table public.audit_logs enable row level security;

drop policy if exists "audit_logs_member_read" on public.audit_logs;
create policy "audit_logs_member_read" on public.audit_logs
  for select using (public.is_active_member());

create index if not exists audit_logs_changed_at_idx on public.audit_logs(changed_at desc);
create index if not exists audit_logs_table_record_idx on public.audit_logs(table_name, record_id);
