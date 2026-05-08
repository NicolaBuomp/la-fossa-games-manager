create table if not exists public.participation_requests (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete restrict,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  privacy_accepted boolean not null default false,
  whatsapp_accepted boolean not null default false,
  rules_accepted boolean not null default false,
  status text not null default 'nuova' check (status in ('nuova', 'in_gestione', 'contattata', 'archiviata')),
  updated_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint participation_requests_email_check check (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$'),
  constraint participation_requests_consents_check check (privacy_accepted and whatsapp_accepted and rules_accepted)
);

drop trigger if exists participation_requests_updated_at on public.participation_requests;
create trigger participation_requests_updated_at
  before update on public.participation_requests
  for each row execute function public.set_updated_at();

alter table public.participation_requests enable row level security;

drop policy if exists "tournaments_public_read_available" on public.tournaments;
drop policy if exists "participation_requests_public_insert" on public.participation_requests;
drop policy if exists "participation_requests_admin_read" on public.participation_requests;
drop policy if exists "participation_requests_admin_update" on public.participation_requests;
drop policy if exists "participation_requests_admin_delete" on public.participation_requests;

create policy "tournaments_public_read_available" on public.tournaments
  for select using (code is not null);

create policy "participation_requests_public_insert" on public.participation_requests
  for insert with check (privacy_accepted and whatsapp_accepted and rules_accepted);

create policy "participation_requests_admin_read" on public.participation_requests
  for select using (public.is_admin());

create policy "participation_requests_admin_update" on public.participation_requests
  for update using (public.is_admin()) with check (public.is_admin());

create policy "participation_requests_admin_delete" on public.participation_requests
  for delete using (public.is_admin());

create index if not exists participation_requests_tournament_idx on public.participation_requests(tournament_id);
create index if not exists participation_requests_status_idx on public.participation_requests(status);
create index if not exists participation_requests_created_idx on public.participation_requests(created_at desc);

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
