-- La Fossa Games development seed.
-- Use only on development databases.
--
-- Login utenti di sviluppo:
--   admin / admin@lafossagames.local / AdminDev2026!
--   staff / staff@lafossagames.local / StaffDev2026!

create extension if not exists pgcrypto with schema extensions;

do $$
declare
  v_admin_id uuid := '00000000-0000-4000-8000-000000000001';
  v_staff_id uuid := '00000000-0000-4000-8000-000000000002';
begin
  insert into auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    email_change_token_current,
    phone_change,
    phone_change_token,
    reauthentication_token,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    is_sso_user,
    is_anonymous
  )
  values
    (
      '00000000-0000-0000-0000-000000000000',
      v_admin_id,
      'authenticated',
      'authenticated',
      'admin@lafossagames.local',
      extensions.crypt('AdminDev2026!', extensions.gen_salt('bf')),
      now(),
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"username":"admin","full_name":"Admin La Fossa","role":"admin"}'::jsonb,
      null,
      now(),
      now(),
      false,
      false
    ),
    (
      '00000000-0000-0000-0000-000000000000',
      v_staff_id,
      'authenticated',
      'authenticated',
      'staff@lafossagames.local',
      extensions.crypt('StaffDev2026!', extensions.gen_salt('bf')),
      now(),
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"username":"staff","full_name":"Staff La Fossa","role":"staff"}'::jsonb,
      null,
      now(),
      now(),
      false,
      false
    )
  on conflict (id) do update
  set
    email = excluded.email,
    encrypted_password = excluded.encrypted_password,
    email_confirmed_at = excluded.email_confirmed_at,
    raw_app_meta_data = excluded.raw_app_meta_data,
    raw_user_meta_data = excluded.raw_user_meta_data,
    updated_at = now();

  insert into auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
  )
  values
    (
      '00000000-0000-4000-9000-000000000001',
      v_admin_id::text,
      v_admin_id,
      jsonb_build_object(
        'sub', v_admin_id::text,
        'email', 'admin@lafossagames.local',
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      now(),
      now(),
      now()
    ),
    (
      '00000000-0000-4000-9000-000000000002',
      v_staff_id::text,
      v_staff_id,
      jsonb_build_object(
        'sub', v_staff_id::text,
        'email', 'staff@lafossagames.local',
        'email_verified', true,
        'phone_verified', false
      ),
      'email',
      now(),
      now(),
      now()
    )
  on conflict (provider_id, provider) do update
  set
    user_id = excluded.user_id,
    identity_data = excluded.identity_data,
    updated_at = now();

  insert into public.profiles (id, email, username, full_name, role, active)
  values
    (v_admin_id, 'admin@lafossagames.local', 'admin', 'Admin La Fossa', 'admin', true),
    (v_staff_id, 'staff@lafossagames.local', 'staff', 'Staff La Fossa', 'staff', true)
  on conflict (id) do update
  set
    email = excluded.email,
    username = excluded.username,
    full_name = excluded.full_name,
    role = excluded.role,
    active = excluded.active;
end $$;

insert into public.tournaments (
  id,
  code,
  name,
  sport,
  fee,
  date,
  status,
  public_status,
  published_at,
  notes,
  created_by,
  updated_by
)
values
  ('10000000-0000-4000-8000-000000000001', 'calcio-a-5', 'Calcio a 5', 'calcio', 120, '2026-07-05', 'registrations_open', 'registrations_open', now(), 'Torneo principale open.', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000002', 'calcio-a-5-u15', 'Calcio a 5 Under 15', 'calcio', 60, '2026-07-06', 'registrations_open', 'registrations_open', now(), 'Torneo dedicato agli under 15.', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000003', 'green-volley', 'Green Volley', 'pallavolo', 50, '2026-07-06', 'registrations_open', 'registrations_open', now(), 'Green volley misto.', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000004', 'ping-pong', 'Ping Pong', 'altro', 10, '2026-07-07', 'draft', 'hidden', null, null, '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000005', 'fc-26', 'FC 26', 'altro', 10, '2026-07-07', 'draft', 'hidden', null, null, '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000006', 'briscola', 'Briscola', 'altro', 10, '2026-07-08', 'draft', 'hidden', null, null, '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000007', 'calcio-balilla', 'Calcio Balilla', 'altro', 10, '2026-07-08', 'draft', 'hidden', null, null, '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001')
on conflict (id) do update
set
  code = excluded.code,
  name = excluded.name,
  sport = excluded.sport,
  fee = excluded.fee,
  date = excluded.date,
  status = excluded.status,
  public_status = excluded.public_status,
  published_at = excluded.published_at,
  notes = excluded.notes,
  updated_by = excluded.updated_by,
  updated_at = now();

insert into public.sponsors (
  id,
  company_name,
  contact_name,
  contact_info,
  type,
  value,
  category,
  promised_amount,
  received_amount,
  payment_method,
  responsible_user_id,
  status,
  deliverables,
  notes,
  created_by,
  updated_by
)
values
  ('20000000-0000-4000-8000-000000000001', 'Bar Centrale', 'Marco Rossi', '+39 333 000 0001', 'cash', 500, 'gold', 500, 500, 'bonifico', '00000000-0000-4000-8000-000000000001', 'pagato', 'Logo su locandina e banner campo.', 'Sponsor principale demo.', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000002', 'Pizzeria La Fossa', 'Giulia Bianchi', '+39 333 000 0002', 'cash', 300, 'silver', 300, 150, 'contanti', '00000000-0000-4000-8000-000000000002', 'confermato', 'Logo social.', 'Saldo da incassare.', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002'),
  ('20000000-0000-4000-8000-000000000003', 'Ferramenta Verde', 'Luca Verdi', '+39 333 000 0003', 'bonifico', 150, 'bronzo', 150, 0, null, '00000000-0000-4000-8000-000000000002', 'in_trattativa', 'Ringraziamento pubblico.', null, '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002')
on conflict (id) do update
set
  company_name = excluded.company_name,
  contact_name = excluded.contact_name,
  contact_info = excluded.contact_info,
  type = excluded.type,
  value = excluded.value,
  category = excluded.category,
  promised_amount = excluded.promised_amount,
  received_amount = excluded.received_amount,
  payment_method = excluded.payment_method,
  responsible_user_id = excluded.responsible_user_id,
  status = excluded.status,
  deliverables = excluded.deliverables,
  notes = excluded.notes,
  updated_by = excluded.updated_by,
  updated_at = now();

insert into public.expenses (
  id,
  date,
  description,
  category,
  amount,
  paid_by,
  payment_method,
  status,
  notes,
  created_by,
  updated_by
)
values
  ('30000000-0000-4000-8000-000000000001', '2026-05-10', 'Caparra impianto sportivo', 'location', 250, 'Admin La Fossa', 'bonifico', 'pagata', null, '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001'),
  ('30000000-0000-4000-8000-000000000002', '2026-05-12', 'Palloni e materiale gara', 'materiali', 180, 'Staff La Fossa', 'contanti', 'da_rimborsare', 'Da rimborsare allo staff.', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002')
on conflict (id) do update
set
  date = excluded.date,
  description = excluded.description,
  category = excluded.category,
  amount = excluded.amount,
  paid_by = excluded.paid_by,
  payment_method = excluded.payment_method,
  status = excluded.status,
  notes = excluded.notes,
  updated_by = excluded.updated_by,
  updated_at = now();

insert into public.incomes (
  id,
  date,
  source,
  category,
  amount,
  received_by,
  payment_method,
  notes,
  created_by,
  updated_by
)
values
  ('40000000-0000-4000-8000-000000000001', '2026-05-11', 'Acconto Bar Centrale', 'sponsor', 500, 'Admin La Fossa', 'bonifico', null, '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001'),
  ('40000000-0000-4000-8000-000000000002', '2026-05-13', 'Iscrizione squadra demo', 'iscrizioni', 120, 'Staff La Fossa', 'contanti', null, '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002')
on conflict (id) do update
set
  date = excluded.date,
  source = excluded.source,
  category = excluded.category,
  amount = excluded.amount,
  received_by = excluded.received_by,
  payment_method = excluded.payment_method,
  notes = excluded.notes,
  updated_by = excluded.updated_by,
  updated_at = now();

insert into public.tournament_teams (
  id,
  tournament_id,
  name,
  captain_name,
  captain_contact,
  vice_captain_name,
  vice_captain_contact,
  fee,
  paid,
  notes,
  created_by,
  updated_by
)
values
  ('50000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'I Leoni della Fossa', 'Andrea Neri', '+39 333 000 0101', 'Paolo Blu', '+39 333 000 0102', 120, true, null, '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002'),
  ('50000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Atletico Borgo', 'Davide Gialli', '+39 333 000 0201', null, null, 120, false, 'Pagamento atteso.', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002'),
  ('50000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', 'Green Spikers', 'Sara Costa', '+39 333 000 0301', null, null, 50, true, null, '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001')
on conflict (id) do update
set
  tournament_id = excluded.tournament_id,
  name = excluded.name,
  captain_name = excluded.captain_name,
  captain_contact = excluded.captain_contact,
  vice_captain_name = excluded.vice_captain_name,
  vice_captain_contact = excluded.vice_captain_contact,
  fee = excluded.fee,
  paid = excluded.paid,
  notes = excluded.notes,
  updated_by = excluded.updated_by,
  updated_at = now();

-- Ensure every seeded tournament has at least 20 teams.
with seeded_tournaments as (
  select
    id,
    name,
    fee,
    row_number() over (order by date nulls last, code, id) as tournament_index
  from public.tournaments
),
generated_teams as (
  select
    (
      substr(md5(id::text || ':' || team_index::text), 1, 8)
      || '-'
      || substr(md5(id::text || ':' || team_index::text), 9, 4)
      || '-4'
      || substr(md5(id::text || ':' || team_index::text), 14, 3)
      || '-8'
      || substr(md5(id::text || ':' || team_index::text), 18, 3)
      || '-'
      || substr(md5(id::text || ':' || team_index::text), 21, 12)
    )::uuid as id,
    id as tournament_id,
    name as tournament_name,
    fee,
    tournament_index,
    team_index
  from seeded_tournaments
  cross join generate_series(1, 20) as team_index
)
insert into public.tournament_teams (
  id,
  tournament_id,
  name,
  captain_name,
  captain_contact,
  vice_captain_name,
  vice_captain_contact,
  fee,
  paid,
  notes,
  created_by,
  updated_by
)
select
  id,
  tournament_id,
  tournament_name || ' - Squadra ' || lpad(team_index::text, 2, '0'),
  'Capitano ' || tournament_index || '-' || team_index,
  '+39 333 '
    || lpad(tournament_index::text, 3, '0')
    || ' '
    || lpad(team_index::text, 4, '0'),
  case when team_index % 3 = 0 then 'Vice ' || tournament_index || '-' || team_index else null end,
  case
    when team_index % 3 = 0 then '+39 334 '
      || lpad(tournament_index::text, 3, '0')
      || ' '
      || lpad(team_index::text, 4, '0')
    else null
  end,
  fee,
  team_index <= 12,
  case
    when team_index <= 12 then 'Iscrizione saldata.'
    else 'Pagamento da completare.'
  end,
  case
    when team_index % 2 = 0 then '00000000-0000-4000-8000-000000000001'::uuid
    else '00000000-0000-4000-8000-000000000002'::uuid
  end,
  case
    when team_index % 2 = 0 then '00000000-0000-4000-8000-000000000001'::uuid
    else '00000000-0000-4000-8000-000000000002'::uuid
  end
from generated_teams
on conflict (id) do update
set
  tournament_id = excluded.tournament_id,
  name = excluded.name,
  captain_name = excluded.captain_name,
  captain_contact = excluded.captain_contact,
  vice_captain_name = excluded.vice_captain_name,
  vice_captain_contact = excluded.vice_captain_contact,
  fee = excluded.fee,
  paid = excluded.paid,
  notes = excluded.notes,
  updated_by = excluded.updated_by,
  updated_at = now();

insert into public.team_participants (
  id,
  team_id,
  first_name,
  last_name,
  contact,
  gender,
  registered,
  created_by,
  updated_by
)
values
  ('60000000-0000-4000-8000-000000000001', '50000000-0000-4000-8000-000000000001', 'Andrea', 'Neri', '+39 333 000 0101', 'uomo', true, '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002'),
  ('60000000-0000-4000-8000-000000000002', '50000000-0000-4000-8000-000000000001', 'Paolo', 'Blu', '+39 333 000 0102', 'uomo', true, '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002'),
  ('60000000-0000-4000-8000-000000000003', '50000000-0000-4000-8000-000000000003', 'Sara', 'Costa', '+39 333 000 0301', 'donna', true, '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001')
on conflict (id) do update
set
  team_id = excluded.team_id,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  contact = excluded.contact,
  gender = excluded.gender,
  registered = excluded.registered,
  updated_by = excluded.updated_by,
  updated_at = now();

insert into public.participation_requests (
  id,
  tournament_id,
  first_name,
  last_name,
  email,
  phone,
  privacy_accepted,
  whatsapp_accepted,
  rules_accepted,
  status,
  updated_by
)
values
  ('70000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000003', 'Marta', 'Riva', 'marta.riva@example.local', '+39 333 000 0401', true, true, true, 'nuova', null)
on conflict (id) do update
set
  tournament_id = excluded.tournament_id,
  first_name = excluded.first_name,
  last_name = excluded.last_name,
  email = excluded.email,
  phone = excluded.phone,
  privacy_accepted = excluded.privacy_accepted,
  whatsapp_accepted = excluded.whatsapp_accepted,
  rules_accepted = excluded.rules_accepted,
  status = excluded.status,
  updated_by = excluded.updated_by,
  updated_at = now();

insert into public.participation_request_notes (
  id,
  request_id,
  note,
  created_by
)
values
  ('80000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001', 'Richiesta demo da contattare per conferma squadra.', '00000000-0000-4000-8000-000000000001')
on conflict (id) do update
set
  request_id = excluded.request_id,
  note = excluded.note,
  created_by = excluded.created_by;
