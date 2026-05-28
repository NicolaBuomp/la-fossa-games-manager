-- ============================================================
-- STEP 1: rimuove campi non più necessari da incomes
-- (sponsor_id e team_id non servono: la view li ricava direttamente)
-- ============================================================
alter table public.incomes
  drop column if exists sponsor_id,
  drop column if exists team_id;

drop index if exists public.incomes_sponsor_id_idx;
drop index if exists public.incomes_team_id_idx;

-- ============================================================
-- STEP 2: aggiunge tracking consegna su tournament_teams
-- ============================================================
alter table public.tournament_teams
  add column if not exists delivered_to_treasurer boolean not null default false,
  add column if not exists delivered_at timestamptz,
  add column if not exists delivered_by uuid references public.profiles(id);

alter table public.tournament_teams
  drop constraint if exists tournament_teams_delivery_check,
  add constraint tournament_teams_delivery_check
    check (
      (delivered_to_treasurer = false and delivered_at is null)
      or
      (delivered_to_treasurer = true and delivered_at is not null)
    );

-- ============================================================
-- STEP 3: aggiunge tracking consegna su sponsors
-- ============================================================
alter table public.sponsors
  add column if not exists delivered_to_treasurer boolean not null default false,
  add column if not exists delivered_at timestamptz,
  add column if not exists delivered_by uuid references public.profiles(id);

alter table public.sponsors
  drop constraint if exists sponsors_delivery_check,
  add constraint sponsors_delivery_check
    check (
      (delivered_to_treasurer = false and delivered_at is null)
      or
      (delivered_to_treasurer = true and delivered_at is not null)
    );

-- ============================================================
-- STEP 4: view unificata transactions_view
-- Unisce: incomes, expenses, tournament_teams (paid=true), sponsors (status='pagato')
-- Colonne chiave:
--   source_table   tabella di origine ('incomes','expenses','tournament_teams','sponsors')
--   source_id      id del record originale
--   type           'income' | 'expense'
--   amount         importo
--   description    testo descrittivo
--   category       categoria
--   date           data
--   payment_method
--   delivered_to_treasurer  (null per le spese)
--   delivered_at            (null per le spese)
--   delivered_by            (null per le spese)
--   created_by, updated_by, created_at, updated_at
-- ============================================================
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

  -- pagamenti sponsor (solo quelli con status = 'pagato')
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
  where s.status = 'pagato';

-- RLS sulla view: accessibile agli utenti attivi
-- (la view eredita la sicurezza dalle tabelle sottostanti via SECURITY INVOKER default)
grant select on public.transactions_view to authenticated;

-- ============================================================
-- STEP 5: RPC unificata mark_transaction_delivered
-- Gestisce tutte e 3 le tabelle sorgente in base al source_table
-- Input: array di {source_table, source_id} come jsonb
-- ============================================================
drop function if exists public.mark_incomes_delivered(uuid[], uuid);

create or replace function public.mark_transaction_delivered(
  p_items jsonb,
  p_delivered_by uuid
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_item jsonb;
  v_table text;
  v_id uuid;
begin
  if not public.is_active_member() then
    raise exception 'Accesso non autorizzato.';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_table := v_item->>'source_table';
    v_id    := (v_item->>'source_id')::uuid;

    if v_table = 'incomes' then
      update public.incomes
      set
        delivered_to_treasurer = true,
        delivered_at = now(),
        delivered_by = p_delivered_by,
        updated_at = now(),
        updated_by = auth.uid()
      where id = v_id
        and delivered_to_treasurer = false;

    elsif v_table = 'tournament_teams' then
      update public.tournament_teams
      set
        delivered_to_treasurer = true,
        delivered_at = now(),
        delivered_by = p_delivered_by,
        updated_at = now(),
        updated_by = auth.uid()
      where id = v_id
        and delivered_to_treasurer = false;

    elsif v_table = 'sponsors' then
      update public.sponsors
      set
        delivered_to_treasurer = true,
        delivered_at = now(),
        delivered_by = p_delivered_by,
        updated_at = now(),
        updated_by = auth.uid()
      where id = v_id
        and delivered_to_treasurer = false;
    end if;
  end loop;
end;
$$;

grant execute on function public.mark_transaction_delivered(jsonb, uuid)
  to authenticated;
