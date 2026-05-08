create or replace function public.user_display_names(user_ids uuid[])
returns table(id uuid, display_name text)
language sql
security definer
set search_path = public
stable
as $$
  select
    profiles.id,
    coalesce(nullif(trim(profiles.full_name), ''), nullif(trim(profiles.email), ''), profiles.id::text) as display_name
  from public.profiles
  where profiles.id = any(user_ids)
    and public.is_active_member();
$$;
