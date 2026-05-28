-- Add display names for transaction audit users so the transactions page does
-- not need to load the full profiles table just to render "Inserito da".
-- Add invoice flags to sponsors so sponsor payments can be tracked like incomes.
alter table public.sponsors
  add column if not exists da_fatturare boolean not null default false,
  add column if not exists fattura_emessa boolean not null default false;

drop view if exists public.transactions_view;

create view public.transactions_view as

  -- entrate manuali
  select
    i.id,
    'incomes'::text           as source_table,
    i.id                      as source_id,
    'income'::text            as type,
    i.date,
    i.source                  as description,
    i.category,
    i.amount,
    i.payment_method,
    i.received_by             as person,
    null::text                as expense_status,
    i.delivered_to_treasurer,
    i.delivered_at,
    i.delivered_by,
    i.da_fatturare,
    i.fattura_emessa,
    i.created_by,
    i.updated_by,
    coalesce(nullif(btrim(created_profile.full_name), ''), nullif(btrim(created_profile.email), ''), i.created_by::text) as created_by_name,
    coalesce(nullif(btrim(updated_profile.full_name), ''), nullif(btrim(updated_profile.email), ''), i.updated_by::text) as updated_by_name,
    i.created_at,
    i.updated_at
  from public.incomes i
  left join public.profiles created_profile on created_profile.id = i.created_by
  left join public.profiles updated_profile on updated_profile.id = i.updated_by

  union all

  -- spese manuali
  select
    e.id,
    'expenses'::text          as source_table,
    e.id                      as source_id,
    'expense'::text           as type,
    e.date,
    e.description,
    e.category,
    e.amount,
    e.payment_method,
    e.paid_by                 as person,
    e.status                  as expense_status,
    false                     as delivered_to_treasurer,
    null::timestamptz         as delivered_at,
    null::uuid                as delivered_by,
    false                     as da_fatturare,
    false                     as fattura_emessa,
    e.created_by,
    e.updated_by,
    coalesce(nullif(btrim(created_profile.full_name), ''), nullif(btrim(created_profile.email), ''), e.created_by::text) as created_by_name,
    coalesce(nullif(btrim(updated_profile.full_name), ''), nullif(btrim(updated_profile.email), ''), e.updated_by::text) as updated_by_name,
    e.created_at,
    e.updated_at
  from public.expenses e
  left join public.profiles created_profile on created_profile.id = e.created_by
  left join public.profiles updated_profile on updated_profile.id = e.updated_by

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
    coalesce(nullif(btrim(created_profile.full_name), ''), nullif(btrim(created_profile.email), ''), tt.created_by::text) as created_by_name,
    coalesce(nullif(btrim(updated_profile.full_name), ''), nullif(btrim(updated_profile.email), ''), tt.updated_by::text) as updated_by_name,
    tt.created_at,
    tt.updated_at
  from public.tournament_teams tt
  join public.tournaments t on t.id = tt.tournament_id
  left join public.profiles created_profile on created_profile.id = tt.created_by
  left join public.profiles updated_profile on updated_profile.id = tt.updated_by
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
    s.da_fatturare,
    s.fattura_emessa,
    s.created_by,
    s.updated_by,
    coalesce(nullif(btrim(created_profile.full_name), ''), nullif(btrim(created_profile.email), ''), s.created_by::text) as created_by_name,
    coalesce(nullif(btrim(updated_profile.full_name), ''), nullif(btrim(updated_profile.email), ''), s.updated_by::text) as updated_by_name,
    s.created_at,
    s.updated_at
  from public.sponsors s
  left join public.profiles created_profile on created_profile.id = s.created_by
  left join public.profiles updated_profile on updated_profile.id = s.updated_by
  where s.received_amount > 0;

grant select on public.transactions_view to authenticated;

create or replace function public.list_transactions_with_summary(
  p_type text default null,
  p_category text default null,
  p_delivery_status text default null,
  p_date_from date default null,
  p_date_to date default null,
  p_search text default null,
  p_page integer default 1,
  p_page_size integer default 25
)
returns jsonb
language sql
stable
security invoker
set search_path to 'public'
as $$
  with filtered as (
    select *
    from public.transactions_view tv
    where
      (p_type is null or p_type = 'all' or tv.type = p_type)
      and (p_category is null or tv.category = p_category)
      and (
        p_delivery_status is null
        or p_delivery_status = 'all'
        or (
          p_delivery_status = 'pending'
          and tv.type = 'income'
          and tv.delivered_to_treasurer = false
        )
        or (
          p_delivery_status = 'delivered'
          and tv.type = 'income'
          and tv.delivered_to_treasurer = true
        )
      )
      and (p_date_from is null or tv.date >= p_date_from)
      and (p_date_to is null or tv.date <= p_date_to)
      and (p_search is null or p_search = '' or tv.description ilike '%' || p_search || '%')
  ),
  paged as (
    select *
    from filtered
    order by date desc, created_at desc
    offset greatest(coalesce(p_page, 1) - 1, 0) * greatest(coalesce(p_page_size, 25), 1)
    limit greatest(coalesce(p_page_size, 25), 1)
  ),
  summary_rows as (
    select amount, type, delivered_to_treasurer
    from public.transactions_view
  )
  select jsonb_build_object(
    'data',
    coalesce(
      (
        select jsonb_agg(to_jsonb(p) order by p.date desc, p.created_at desc)
        from paged p
      ),
      '[]'::jsonb
    ),
    'total',
    (select count(*) from filtered),
    'summary',
    jsonb_build_object(
      'totalIncomes',
      coalesce(
        (select sum(amount) from summary_rows where type = 'income'),
        0
      ),
      'totalExpenses',
      coalesce(
        (select sum(amount) from summary_rows where type = 'expense'),
        0
      ),
      'incomeCount',
      (select count(*) from summary_rows where type = 'income'),
      'expenseCount',
      (select count(*) from summary_rows where type = 'expense'),
      'pendingDelivery',
      coalesce(
        (
          select sum(amount)
          from summary_rows
          where type = 'income' and delivered_to_treasurer = false
        ),
        0
      ),
      'pendingDeliveryCount',
      (
        select count(*)
        from summary_rows
        where type = 'income' and delivered_to_treasurer = false
      )
    )
  );
$$;

grant execute on function public.list_transactions_with_summary(
  text,
  text,
  text,
  date,
  date,
  text,
  integer,
  integer
) to authenticated;
