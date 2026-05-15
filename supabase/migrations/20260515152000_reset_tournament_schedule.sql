create or replace function public.reset_tournament_schedule(p_tournament_id uuid)
returns table (
  groups_deleted integer,
  matches_deleted integer,
  standings_deleted integer,
  group_teams_deleted integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_groups_deleted integer := 0;
  v_matches_deleted integer := 0;
  v_standings_deleted integer := 0;
  v_group_teams_deleted integer := 0;
begin
  if not public.is_admin() then
    raise exception 'Solo gli admin possono resettare gironi e calendario.';
  end if;

  delete from public.tournament_matches
  where tournament_id = p_tournament_id;
  get diagnostics v_matches_deleted = row_count;

  delete from public.tournament_standings
  where tournament_id = p_tournament_id;
  get diagnostics v_standings_deleted = row_count;

  delete from public.tournament_group_teams
  where group_id in (
    select id
    from public.tournament_groups
    where tournament_id = p_tournament_id
  );
  get diagnostics v_group_teams_deleted = row_count;

  delete from public.tournament_groups
  where tournament_id = p_tournament_id;
  get diagnostics v_groups_deleted = row_count;

  update public.tournaments
  set
    status = case
      when status in ('groups_generated', 'in_progress') then 'registrations_closed'
      else status
    end,
    public_status = case
      when public_status in ('published', 'results_published') then 'registrations_open'
      else public_status
    end,
    published_at = case
      when public_status in ('published', 'results_published') then null
      else published_at
    end
  where id = p_tournament_id;

  return query
  select
    v_groups_deleted,
    v_matches_deleted,
    v_standings_deleted,
    v_group_teams_deleted;
end;
$$;

revoke all on function public.reset_tournament_schedule(uuid) from public;
grant execute on function public.reset_tournament_schedule(uuid) to authenticated;
