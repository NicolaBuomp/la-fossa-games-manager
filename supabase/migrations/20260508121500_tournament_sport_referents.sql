alter table public.tournaments
  add column if not exists sport text not null default 'calcio';

alter table public.tournaments
  drop constraint if exists tournaments_sport_check;

alter table public.tournaments
  add constraint tournaments_sport_check check (sport in ('calcio', 'pallavolo', 'altro'));

alter table public.tournament_teams
  add column if not exists captain_name text,
  add column if not exists captain_contact text,
  add column if not exists vice_captain_name text,
  add column if not exists vice_captain_contact text;

alter table public.team_participants
  add column if not exists gender text not null default 'uomo',
  add column if not exists registered boolean not null default false;

alter table public.team_participants
  drop constraint if exists team_participants_gender_check;

alter table public.team_participants
  add constraint team_participants_gender_check check (gender in ('uomo', 'donna'));
