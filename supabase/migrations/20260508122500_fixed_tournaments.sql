alter table public.tournaments
  add column if not exists code text;

drop index if exists public.tournaments_code_uidx;

create unique index if not exists tournaments_code_uidx on public.tournaments(code);

alter table public.tournaments
  drop constraint if exists tournaments_sport_check;

alter table public.tournaments
  add constraint tournaments_sport_check check (sport in ('calcio', 'pallavolo', 'altro'));

update public.tournaments set code = 'calcio-a-5', sport = 'calcio' where code is null and name = 'Calcio a 5';
update public.tournaments set code = 'calcio-a-5-under-14', sport = 'calcio' where code is null and name = 'Calcio a 5 Under 14';
update public.tournaments set code = 'pallavolo', sport = 'pallavolo' where code is null and name = 'Pallavolo';
update public.tournaments set code = 'briscola', sport = 'altro' where code is null and name = 'Briscola';
update public.tournaments set code = 'fifa', sport = 'altro' where code is null and name = 'Fifa';
update public.tournaments set code = 'ping-pong', sport = 'altro' where code is null and name = 'Ping Pong';
update public.tournaments set code = 'calcio-balilla', sport = 'altro' where code is null and name = 'Calcio Balilla';

insert into public.tournaments (code, name, sport, fee)
values
  ('calcio-a-5', 'Calcio a 5', 'calcio', 0),
  ('calcio-a-5-under-14', 'Calcio a 5 Under 14', 'calcio', 0),
  ('pallavolo', 'Pallavolo', 'pallavolo', 0),
  ('briscola', 'Briscola', 'altro', 0),
  ('fifa', 'Fifa', 'altro', 0),
  ('ping-pong', 'Ping Pong', 'altro', 0),
  ('calcio-balilla', 'Calcio Balilla', 'altro', 0)
on conflict (code) do nothing;
