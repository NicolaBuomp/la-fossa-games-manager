-- Aggiunge tracking consegna al tesoriere e link a fonti sulla tabella incomes

alter table public.incomes
  add column if not exists delivered_to_treasurer boolean not null default false,
  add column if not exists delivered_at timestamptz,
  add column if not exists delivered_by uuid references public.profiles(id),
  add column if not exists sponsor_id uuid references public.sponsors(id) on delete set null,
  add column if not exists team_id uuid references public.tournament_teams(id) on delete set null;

alter table public.incomes
  drop constraint if exists incomes_delivery_consistency_check,
  add constraint incomes_delivery_consistency_check
    check (
      (delivered_to_treasurer = false and delivered_at is null)
      or
      (delivered_to_treasurer = true and delivered_at is not null)
    );

create index if not exists incomes_pending_delivery_idx
  on public.incomes (delivered_to_treasurer) where not delivered_to_treasurer;

create index if not exists incomes_sponsor_id_idx
  on public.incomes (sponsor_id) where sponsor_id is not null;

create index if not exists incomes_team_id_idx
  on public.incomes (team_id) where team_id is not null;

-- RPC per bulk-update consegna al tesoriere (chiamabile da tutti gli utenti attivi)
create or replace function public.mark_incomes_delivered(
  p_income_ids uuid[],
  p_delivered_by uuid
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if not public.is_active_member() then
    raise exception 'Accesso non autorizzato.';
  end if;

  update public.incomes
  set
    delivered_to_treasurer = true,
    delivered_at = now(),
    delivered_by = p_delivered_by,
    updated_at = now(),
    updated_by = auth.uid()
  where id = any(p_income_ids)
    and delivered_to_treasurer = false;
end;
$$;

grant execute on function public.mark_incomes_delivered(uuid[], uuid)
  to authenticated;
