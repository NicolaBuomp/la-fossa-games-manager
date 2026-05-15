alter table public.tournaments
  add column if not exists status text not null default 'registrations_open',
  add column if not exists public_status text not null default 'hidden',
  add column if not exists published_at timestamp with time zone;

alter table public.tournaments
  drop constraint if exists tournaments_status_check,
  add constraint tournaments_status_check
    check (status in (
      'draft',
      'registrations_open',
      'registrations_closed',
      'groups_generated',
      'in_progress',
      'completed',
      'archived'
    )),
  drop constraint if exists tournaments_public_status_check,
  add constraint tournaments_public_status_check
    check (public_status in (
      'hidden',
      'registrations_open',
      'published',
      'results_published'
    ));

update public.tournaments
set public_status = 'registrations_open'
where code is not null
  and public_status = 'hidden';

update public.tournaments
set published_at = coalesce(published_at, now())
where public_status in ('published', 'results_published');

drop policy if exists tournaments_public_read_available on public.tournaments;
create policy tournaments_public_read_available
on public.tournaments
for select
using (
  code is not null
  and public_status in ('registrations_open', 'published', 'results_published')
);

drop policy if exists tournament_groups_select_public on public.tournament_groups;
create policy tournament_groups_select_public
on public.tournament_groups
for select
using (
  exists (
    select 1
    from public.tournaments t
    where t.id = tournament_groups.tournament_id
      and t.public_status in ('published', 'results_published')
  )
);

drop policy if exists tournament_group_teams_select_public on public.tournament_group_teams;
create policy tournament_group_teams_select_public
on public.tournament_group_teams
for select
using (
  exists (
    select 1
    from public.tournament_groups g
    join public.tournaments t on t.id = g.tournament_id
    where g.id = tournament_group_teams.group_id
      and t.public_status in ('published', 'results_published')
  )
);

drop policy if exists tournament_matches_select_public on public.tournament_matches;
create policy tournament_matches_select_public
on public.tournament_matches
for select
using (
  exists (
    select 1
    from public.tournaments t
    where t.id = tournament_matches.tournament_id
      and t.public_status in ('published', 'results_published')
  )
);

drop policy if exists tournament_standings_select_public on public.tournament_standings;
create policy tournament_standings_select_public
on public.tournament_standings
for select
using (
  exists (
    select 1
    from public.tournaments t
    where t.id = tournament_standings.tournament_id
      and t.public_status = 'results_published'
  )
);

create or replace view public.public_tournament_matches as
select
  m.id,
  m.tournament_id,
  t.name as tournament_name,
  g.name as group_name,
  m.round_label,
  home.name as home_team_name,
  away.name as away_team_name,
  m.home_score,
  m.away_score,
  m.status,
  m.starts_at,
  m.ends_at,
  m.field_label
from public.tournament_matches m
join public.tournaments t on t.id = m.tournament_id
left join public.tournament_groups g on g.id = m.group_id
join public.tournament_teams home on home.id = m.home_team_id
join public.tournament_teams away on away.id = m.away_team_id
where t.public_status in ('published', 'results_published');

create or replace view public.public_tournament_standings as
select
  s.id,
  s.tournament_id,
  t.name as tournament_name,
  g.name as group_name,
  team.name as team_name,
  s.played,
  s.wins,
  s.draws,
  s.losses,
  s.goals_for,
  s.goals_against,
  s.goal_diff,
  s.points,
  s.rank
from public.tournament_standings s
join public.tournaments t on t.id = s.tournament_id
join public.tournament_groups g on g.id = s.group_id
join public.tournament_teams team on team.id = s.team_id
where t.public_status = 'results_published';
