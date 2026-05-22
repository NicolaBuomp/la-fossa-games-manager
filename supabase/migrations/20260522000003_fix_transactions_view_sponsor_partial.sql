-- Fix: includi sponsor con pagamento parziale (received_amount > 0)
-- indipendentemente dallo status. Prima era filtrato solo su status = 'pagato'.
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
    s.created_by,
    s.updated_by,
    s.created_at,
    s.updated_at
  from public.sponsors s
  where s.received_amount > 0;

grant select on public.transactions_view to authenticated;
