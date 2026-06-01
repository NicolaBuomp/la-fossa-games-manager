with first_insert as (
	select team_id, changed_by
	from (
		select
			record_id as team_id,
			changed_by,
			row_number() over (
				partition by record_id
				order by changed_at asc
			) as rn
		from public.audit_logs
		where table_name = 'tournament_teams'
			and action = 'insert'
			and changed_by is not null
	) ranked
	where rn = 1
),
last_change as (
	select team_id, changed_by
	from (
		select
			record_id as team_id,
			changed_by,
			row_number() over (
				partition by record_id
				order by changed_at desc
			) as rn
		from public.audit_logs
		where table_name = 'tournament_teams'
			and action in ('insert', 'update')
			and changed_by is not null
	) ranked
	where rn = 1
)
update public.tournament_teams as tt
set
	created_by = coalesce(tt.created_by, fi.changed_by, lc.changed_by),
	updated_by = coalesce(tt.updated_by, lc.changed_by, fi.changed_by)
from first_insert fi
full join last_change lc on lc.team_id = fi.team_id
where tt.id = coalesce(fi.team_id, lc.team_id)
	and (tt.created_by is null or tt.updated_by is null)
	and coalesce(fi.changed_by, lc.changed_by) is not null;
