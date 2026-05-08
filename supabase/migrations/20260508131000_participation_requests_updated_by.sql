alter table public.participation_requests
  add column if not exists updated_by uuid references auth.users(id);

create table if not exists public.participation_request_notes (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.participation_requests(id) on delete cascade,
  note text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.participation_request_notes enable row level security;

drop policy if exists "participation_request_notes_admin_read" on public.participation_request_notes;
drop policy if exists "participation_request_notes_admin_insert" on public.participation_request_notes;
drop policy if exists "participation_request_notes_admin_delete" on public.participation_request_notes;

create policy "participation_request_notes_admin_read" on public.participation_request_notes
  for select using (public.is_admin());

create policy "participation_request_notes_admin_insert" on public.participation_request_notes
  for insert with check (public.is_admin());

create policy "participation_request_notes_admin_delete" on public.participation_request_notes
  for delete using (public.is_admin());

create index if not exists participation_request_notes_request_idx on public.participation_request_notes(request_id, created_at desc);
