begin;

-- Participation requests: allow active staff/admin members to read and update.
drop policy if exists participation_requests_admin_read on public.participation_requests;
drop policy if exists participation_requests_admin_update on public.participation_requests;

create policy participation_requests_member_read
on public.participation_requests
for select
using (public.is_active_member());

create policy participation_requests_member_update
on public.participation_requests
for update
using (public.is_active_member())
with check (public.is_active_member());

-- Notes: allow active staff/admin members to read and insert notes.
drop policy if exists participation_request_notes_admin_read on public.participation_request_notes;
drop policy if exists participation_request_notes_admin_insert on public.participation_request_notes;

create policy participation_request_notes_member_read
on public.participation_request_notes
for select
using (public.is_active_member());

create policy participation_request_notes_member_insert
on public.participation_request_notes
for insert
with check (public.is_active_member());

commit;
