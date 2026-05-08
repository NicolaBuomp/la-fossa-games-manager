-- Optional development seed.
-- Replace the UUID below with an existing auth.users.id from your Supabase project.

-- update public.profiles
-- set role = 'admin', full_name = 'Admin La Fossa', active = true
-- where id = '00000000-0000-0000-0000-000000000000';

insert into public.expenses (date, description, category, amount, paid_by, payment_method, notes)
values
  (current_date, 'Acconto campi', 'Affitto campi/sale', 250.00, 'Organizzazione', 'Bonifico', 'Seed sviluppo'),
  (current_date, 'Trofei finali', 'Premi/Trofei', 120.00, 'Organizzazione', 'Contanti', null);

insert into public.incomes (date, source, category, amount, received_by, payment_method, notes)
values
  (current_date, 'Quote iscrizione prime squadre', 'Iscrizioni', 300.00, 'Staff', 'Contanti', 'Seed sviluppo');

insert into public.sponsors (company_name, contact_name, contact_info, type, value, status, deliverables, notes)
values
  ('Bar Centrale', 'Luca', 'luca@example.com', 'cash', 500.00, 'confermato', 'Logo su banner e post social', 'Seed sviluppo');

insert into public.registrations (name, tournament, contact, fee, paid, registration_date, notes)
values
  ('Team Alpha', 'Calcio 5', 'team-alpha@example.com', 80.00, true, current_date, null),
  ('Team Beta', 'Calcio 5', 'team-beta@example.com', 80.00, false, current_date, 'Da richiamare');
