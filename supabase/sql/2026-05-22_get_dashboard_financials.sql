-- RPC function for admin dashboard financial summary.
-- Replaces 4 full-table fetches (expenses, incomes, sponsors, tournament_teams)
-- with a single aggregated query, reducing dashboard load from 5 to 3 API calls.
--
-- Usage: supabase.client.rpc('get_dashboard_financials', { tournament_codes: [...] })

CREATE OR REPLACE FUNCTION get_dashboard_financials(tournament_codes text[])
RETURNS TABLE (
  total_expenses      numeric,
  total_incomes       numeric,
  sponsor_paid        numeric,
  sponsor_confirmed   numeric,
  sponsor_negotiating numeric,
  sponsor_paid_count  bigint,
  reg_paid_amount     numeric,
  reg_pending_amount  numeric,
  reg_paid_count      bigint,
  reg_pending_count   bigint
)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT
    (SELECT COALESCE(SUM(amount), 0) FROM expenses),
    (SELECT COALESCE(SUM(amount), 0) FROM incomes),
    (SELECT COALESCE(SUM(received_amount), 0) FROM sponsors
       WHERE received_amount IS NOT NULL AND received_amount > 0),
    (SELECT COALESCE(SUM(COALESCE(promised_amount, value, 0)), 0) FROM sponsors
       WHERE status = 'confermato'),
    (SELECT COALESCE(SUM(COALESCE(promised_amount, value, 0)), 0) FROM sponsors
       WHERE status = 'in_trattativa'),
    (SELECT COUNT(*) FROM sponsors WHERE status = 'pagato'),
    (SELECT COALESCE(SUM(tt.fee), 0)
       FROM tournament_teams tt
       JOIN tournaments t ON t.id = tt.tournament_id
       WHERE t.code = ANY(tournament_codes) AND tt.paid = true),
    (SELECT COALESCE(SUM(tt.fee), 0)
       FROM tournament_teams tt
       JOIN tournaments t ON t.id = tt.tournament_id
       WHERE t.code = ANY(tournament_codes) AND tt.paid = false),
    (SELECT COUNT(*)
       FROM tournament_teams tt
       JOIN tournaments t ON t.id = tt.tournament_id
       WHERE t.code = ANY(tournament_codes) AND tt.paid = true),
    (SELECT COUNT(*)
       FROM tournament_teams tt
       JOIN tournaments t ON t.id = tt.tournament_id
       WHERE t.code = ANY(tournament_codes) AND tt.paid = false);
$$;
