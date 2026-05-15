do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'tournament_matches'
  ) then
    alter publication supabase_realtime add table public.tournament_matches;
  end if;

  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'tournament_standings'
  ) then
    alter publication supabase_realtime add table public.tournament_standings;
  end if;
end $$;

alter view public.public_tournament_matches set (security_invoker = true);
alter view public.public_tournament_standings set (security_invoker = true);
