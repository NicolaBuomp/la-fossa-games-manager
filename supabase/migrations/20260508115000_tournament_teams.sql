create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  code text unique,
  name text not null,
  sport text not null default 'calcio' check (sport in ('calcio', 'pallavolo', 'altro')),
  fee numeric(10,2) not null default 0,
  date date,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tournament_teams (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  name text not null,
  captain_name text,
  captain_contact text,
  vice_captain_name text,
  vice_captain_contact text,
  fee numeric(10,2) not null default 0,
  paid boolean not null default false,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_participants (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.tournament_teams(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  contact text,
  gender text not null default 'uomo' check (gender in ('uomo', 'donna')),
  registered boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists tournaments_updated_at on public.tournaments;
create trigger tournaments_updated_at before update on public.tournaments for each row execute function public.set_updated_at();
drop trigger if exists tournament_teams_updated_at on public.tournament_teams;
create trigger tournament_teams_updated_at before update on public.tournament_teams for each row execute function public.set_updated_at();
drop trigger if exists team_participants_updated_at on public.team_participants;
create trigger team_participants_updated_at before update on public.team_participants for each row execute function public.set_updated_at();

drop trigger if exists tournaments_created_by on public.tournaments;
create trigger tournaments_created_by before insert on public.tournaments for each row execute function public.set_created_by();
drop trigger if exists tournament_teams_created_by on public.tournament_teams;
create trigger tournament_teams_created_by before insert on public.tournament_teams for each row execute function public.set_created_by();

alter table public.tournaments enable row level security;
alter table public.tournament_teams enable row level security;
alter table public.team_participants enable row level security;

drop policy if exists "tournaments_member_read" on public.tournaments;
drop policy if exists "tournaments_member_insert" on public.tournaments;
drop policy if exists "tournaments_member_update" on public.tournaments;
drop policy if exists "tournaments_admin_delete" on public.tournaments;
drop policy if exists "tournament_teams_member_read" on public.tournament_teams;
drop policy if exists "tournament_teams_member_insert" on public.tournament_teams;
drop policy if exists "tournament_teams_member_update" on public.tournament_teams;
drop policy if exists "tournament_teams_admin_delete" on public.tournament_teams;
drop policy if exists "team_participants_member_read" on public.team_participants;
drop policy if exists "team_participants_member_insert" on public.team_participants;
drop policy if exists "team_participants_member_update" on public.team_participants;
drop policy if exists "team_participants_admin_delete" on public.team_participants;

create policy "tournaments_member_read" on public.tournaments
  for select using (public.is_active_member());
create policy "tournaments_member_insert" on public.tournaments
  for insert with check (public.is_active_member());
create policy "tournaments_member_update" on public.tournaments
  for update using (public.is_active_member()) with check (public.is_active_member());
create policy "tournaments_admin_delete" on public.tournaments
  for delete using (public.is_admin());

create policy "tournament_teams_member_read" on public.tournament_teams
  for select using (public.is_active_member());
create policy "tournament_teams_member_insert" on public.tournament_teams
  for insert with check (public.is_active_member());
create policy "tournament_teams_member_update" on public.tournament_teams
  for update using (public.is_active_member()) with check (public.is_active_member());
create policy "tournament_teams_admin_delete" on public.tournament_teams
  for delete using (public.is_admin());

create policy "team_participants_member_read" on public.team_participants
  for select using (public.is_active_member());
create policy "team_participants_member_insert" on public.team_participants
  for insert with check (public.is_active_member());
create policy "team_participants_member_update" on public.team_participants
  for update using (public.is_active_member()) with check (public.is_active_member());
create policy "team_participants_admin_delete" on public.team_participants
  for delete using (public.is_admin());

create index if not exists tournaments_date_idx on public.tournaments(date desc);
create index if not exists tournament_teams_tournament_idx on public.tournament_teams(tournament_id);
create index if not exists tournament_teams_paid_idx on public.tournament_teams(paid);
create index if not exists team_participants_team_idx on public.team_participants(team_id);
