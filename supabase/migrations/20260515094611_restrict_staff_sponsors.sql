create index if not exists sponsors_responsible_user_id_idx
on public.sponsors (responsible_user_id);

drop policy if exists sponsors_member_insert on public.sponsors;
drop policy if exists sponsors_member_read on public.sponsors;
drop policy if exists sponsors_member_update on public.sponsors;

create policy sponsors_member_insert
on public.sponsors
for insert
with check (
  public.is_admin()
  or (
    public.is_active_member()
    and (
      responsible_user_id = auth.uid()
      or created_by = auth.uid()
    )
  )
);

create policy sponsors_member_read
on public.sponsors
for select
using (
  public.is_admin()
  or (
    public.is_active_member()
    and (
      responsible_user_id = auth.uid()
      or created_by = auth.uid()
    )
  )
);

create policy sponsors_member_update
on public.sponsors
for update
using (
  public.is_admin()
  or (
    public.is_active_member()
    and (
      responsible_user_id = auth.uid()
      or created_by = auth.uid()
    )
  )
)
with check (
  public.is_admin()
  or (
    public.is_active_member()
    and (
      responsible_user_id = auth.uid()
      or (
        created_by = auth.uid()
        and (responsible_user_id is null or responsible_user_id = auth.uid())
      )
    )
  )
);
