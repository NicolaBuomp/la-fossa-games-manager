alter table public.audit_logs
  add column if not exists operation_id text,
  add column if not exists summary text,
  add column if not exists entity_label text,
  add column if not exists context jsonb not null default '{}'::jsonb;

create index if not exists audit_logs_operation_idx
on public.audit_logs (operation_id, changed_at desc);

create or replace function public.audit_row_label(p_table_name text, p_data jsonb)
returns text
language plpgsql
stable
set search_path to 'public'
as $$
begin
  if p_data is null then
    return null;
  end if;

  return nullif(
    trim(
      coalesce(p_data->>'company_name', '') ||
      case when p_data ? 'company_name' then '' else coalesce(p_data->>'description', '') end ||
      case when p_data ? 'company_name' or p_data ? 'description' then '' else coalesce(p_data->>'source', '') end ||
      case when p_data ? 'company_name' or p_data ? 'description' or p_data ? 'source' then '' else coalesce(p_data->>'name', '') end ||
      case
        when p_data ? 'first_name' or p_data ? 'last_name'
          then trim(coalesce(p_data->>'first_name', '') || ' ' || coalesce(p_data->>'last_name', ''))
        else ''
      end
    ),
    ''
  );
end;
$$;

create or replace function public.audit_table_label(p_table_name text)
returns text
language sql
stable
as $$
  select case p_table_name
    when 'expenses' then 'spesa'
    when 'incomes' then 'entrata'
    when 'sponsors' then 'sponsor'
    when 'registrations' then 'iscrizione'
    when 'tournaments' then 'torneo'
    when 'tournament_teams' then 'squadra'
    when 'team_participants' then 'partecipante'
    else p_table_name
  end;
$$;

create or replace function public.audit_action_phrase(p_action text)
returns text
language sql
stable
as $$
  select case p_action
    when 'insert' then 'inserito'
    when 'update' then 'modificato'
    when 'delete' then 'eliminato'
    else p_action
  end;
$$;

create or replace function public.build_audit_context(
  p_table_name text,
  p_action text,
  p_record_id uuid,
  p_data jsonb
)
returns jsonb
language plpgsql
stable
set search_path to 'public'
as $$
declare
  v_context jsonb := '{}'::jsonb;
  v_team record;
  v_tournament record;
begin
  if p_table_name = 'team_participants' then
    select
      tt.id,
      tt.name,
      tt.tournament_id,
      t.name as tournament_name
    into v_team
    from public.tournament_teams tt
    left join public.tournaments t on t.id = tt.tournament_id
    where tt.id = nullif(p_data->>'team_id', '')::uuid;

    if v_team.id is not null then
      v_context = jsonb_build_object(
        'team_id', v_team.id,
        'team_name', v_team.name,
        'tournament_id', v_team.tournament_id,
        'tournament_name', v_team.tournament_name
      );
    end if;
  elsif p_table_name = 'tournament_teams' then
    select id, name
    into v_tournament
    from public.tournaments
    where id = nullif(p_data->>'tournament_id', '')::uuid;

    if v_tournament.id is not null then
      v_context = jsonb_build_object(
        'tournament_id', v_tournament.id,
        'tournament_name', v_tournament.name
      );
    end if;
  end if;

  return v_context;
exception
  when invalid_text_representation then
    return '{}'::jsonb;
end;
$$;

create or replace function public.build_audit_summary(
  p_actor_name text,
  p_table_name text,
  p_action text,
  p_entity_label text,
  p_context jsonb
)
returns text
language plpgsql
stable
set search_path to 'public'
as $$
declare
  v_actor text := coalesce(nullif(trim(p_actor_name), ''), 'Sistema');
  v_table_label text := public.audit_table_label(p_table_name);
  v_action_phrase text := public.audit_action_phrase(p_action);
  v_label text := nullif(trim(coalesce(p_entity_label, '')), '');
begin
  if p_table_name = 'team_participants' then
    return v_actor || ' ha ' || v_action_phrase || ' partecipante' ||
      case when v_label is not null then ' "' || v_label || '"' else '' end ||
      case
        when nullif(p_context->>'team_name', '') is not null
          then ' nella squadra "' || (p_context->>'team_name') || '"' ||
            case
              when nullif(p_context->>'tournament_name', '') is not null
                then ' in ' || (p_context->>'tournament_name')
              else ''
            end
        else ''
      end;
  end if;

  if p_table_name = 'tournament_teams' then
    return v_actor || ' ha ' || v_action_phrase || ' squadra' ||
      case when v_label is not null then ' "' || v_label || '"' else '' end ||
      case
        when nullif(p_context->>'tournament_name', '') is not null
          then ' in ' || (p_context->>'tournament_name')
        else ''
      end;
  end if;

  return v_actor || ' ha ' || v_action_phrase || ' ' || v_table_label ||
    case when v_label is not null then ' "' || v_label || '"' else '' end;
end;
$$;

create or replace function public.record_audit_log() returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  actor_id uuid := auth.uid();
  v_action text := lower(TG_OP);
  v_data jsonb := case when TG_OP = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  v_actor_name text := public.current_actor_name();
  v_entity_label text := public.audit_row_label(TG_TABLE_NAME, v_data);
  v_context jsonb := public.build_audit_context(
    TG_TABLE_NAME,
    v_action,
    coalesce(new.id, old.id),
    v_data
  );
  v_operation_id text := coalesce(actor_id::text, 'system') || ':' || txid_current()::text;
begin
  insert into public.audit_logs (
    table_name,
    record_id,
    action,
    changed_by,
    changed_by_name,
    old_data,
    new_data,
    operation_id,
    summary,
    entity_label,
    context
  )
  values (
    TG_TABLE_NAME,
    coalesce(new.id, old.id),
    v_action,
    actor_id,
    v_actor_name,
    case when TG_OP in ('UPDATE', 'DELETE') then to_jsonb(old) else null end,
    case when TG_OP in ('INSERT', 'UPDATE') then to_jsonb(new) else null end,
    v_operation_id,
    public.build_audit_summary(
      v_actor_name,
      TG_TABLE_NAME,
      v_action,
      v_entity_label,
      v_context
    ),
    v_entity_label,
    v_context
  );

  return coalesce(new, old);
end;
$$;
