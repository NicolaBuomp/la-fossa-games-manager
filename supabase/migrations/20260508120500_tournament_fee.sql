alter table public.tournaments
  add column if not exists fee numeric(10,2) not null default 0;
