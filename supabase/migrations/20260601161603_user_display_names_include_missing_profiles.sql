create or replace function public.user_display_names(user_ids uuid[])
returns table(id uuid, display_name text)
language sql
stable
security definer
set search_path to 'public'
as $$
	with requested_ids as (
		select distinct requested_id as id
		from unnest(coalesce(user_ids, '{}'::uuid[])) as requested_id
		where requested_id is not null
	)
	select
		requested_ids.id,
		coalesce(
			nullif(trim(profiles.full_name), ''),
			nullif(trim(profiles.email), ''),
			requested_ids.id::text
		) as display_name
	from requested_ids
	left join public.profiles on profiles.id = requested_ids.id
	where public.is_active_member();
$$;
