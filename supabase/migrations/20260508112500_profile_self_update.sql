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

grant execute on function public.update_own_profile_name(text) to authenticated;

notify pgrst, 'reload schema';
