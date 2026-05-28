-- ============================================================
-- Fatturazione: aggiunge da_fatturare e fattura_emessa a incomes
-- Rimuove date da tournaments
-- Aggiorna transactions_view con i nuovi campi
-- ============================================================

-- STEP 1: rimuove date da tournaments
alter table public.tournaments
  drop column if exists date;

-- STEP 2: aggiunge campi fatturazione a incomes
alter table public.incomes
  add column if not exists da_fatturare  boolean not null default false,
  add column if not exists fattura_emessa boolean not null default false;

-- STEP 3: aggiorna transactions_view
drop view if exists public.transactions_view;

create view public.transactions_view as

  -- entrate manuali
  select
    id,
    'incomes'::text           as source_table,
    id                        as source_id,
    'income'::text            as type,
    date,
    source                    as description,
    category,
    amount,
    payment_method,
    received_by               as person,
    null::text                as expense_status,
    delivered_to_treasurer,
    delivered_at,
    delivered_by,
    da_fatturare,
    fattura_emessa,
    created_by,
    updated_by,
    created_at,
    updated_at
  from public.incomes

  union all

  -- spese manuali
  select
    id,
    'expenses'::text          as source_table,
    id                        as source_id,
    'expense'::text           as type,
    date,
    description,
    category,
    amount,
    payment_method,
    paid_by                   as person,
    status                    as expense_status,
    false                     as delivered_to_treasurer,
    null::timestamptz         as delivered_at,
    null::uuid                as delivered_by,
    false                     as da_fatturare,
    false                     as fattura_emessa,
    created_by,
    updated_by,
    created_at,
    updated_at
  from public.expenses

  union all

  -- pagamenti squadre (solo quelle con paid = true)
  select
    tt.id,
    'tournament_teams'::text  as source_table,
    tt.id                     as source_id,
    'income'::text            as type,
    tt.created_at::date       as date,
    'Iscrizione: ' || tt.name || ' (' || t.name || ')' as description,
    'Iscrizioni'::text        as category,
    tt.fee                    as amount,
    null::text                as payment_method,
    tt.captain_name           as person,
    null::text                as expense_status,
    tt.delivered_to_treasurer,
    tt.delivered_at,
    tt.delivered_by,
    false                     as da_fatturare,
    false                     as fattura_emessa,
    tt.created_by,
    tt.updated_by,
    tt.created_at,
    tt.updated_at
  from public.tournament_teams tt
  join public.tournaments t on t.id = tt.tournament_id
  where tt.paid = true

  union all

  -- pagamenti sponsor: tutti quelli con received_amount > 0,
  -- inclusi pagamenti parziali (status != 'pagato')
  select
    s.id,
    'sponsors'::text          as source_table,
    s.id                      as source_id,
    'income'::text            as type,
    s.updated_at::date        as date,
    'Sponsor: ' || s.company_name as description,
    'Sponsor'::text           as category,
    s.received_amount         as amount,
    s.payment_method,
    s.contact_name            as person,
    null::text                as expense_status,
    s.delivered_to_treasurer,
    s.delivered_at,
    s.delivered_by,
    false                     as da_fatturare,
    false                     as fattura_emessa,
    s.created_by,
    s.updated_by,
    s.created_at,
    s.updated_at
  from public.sponsors s
  where s.received_amount > 0;

grant select on public.transactions_view to authenticated;
