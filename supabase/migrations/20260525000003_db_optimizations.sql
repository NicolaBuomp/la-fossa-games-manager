-- ============================================================
-- STEP 1: Pulizia indice orfano
-- La colonna tournaments.date è stata rimossa in 20260524104305
-- ============================================================
DROP INDEX IF EXISTS public.tournaments_date_idx;

-- ============================================================
-- STEP 2: Indici mancanti su colonne filtrate di frequente
-- ============================================================

-- Tesoreria: filtra le entrate non ancora consegnate al tesoriere
CREATE INDEX IF NOT EXISTS incomes_delivered_pending_idx
  ON public.incomes (delivered_to_treasurer)
  WHERE delivered_to_treasurer = false;

-- Fatturazione: filtra le entrate che richiedono fattura
CREATE INDEX IF NOT EXISTS incomes_da_fatturare_idx
  ON public.incomes (da_fatturare)
  WHERE da_fatturare = true;

-- Tesoreria + mark_transaction_delivered: squad non ancora consegnate
CREATE INDEX IF NOT EXISTS tournament_teams_delivered_pending_idx
  ON public.tournament_teams (delivered_to_treasurer)
  WHERE delivered_to_treasurer = false;

-- Tesoreria + mark_transaction_delivered: sponsor non ancora consegnati
CREATE INDEX IF NOT EXISTS sponsors_delivered_pending_idx
  ON public.sponsors (delivered_to_treasurer)
  WHERE delivered_to_treasurer = false;

-- Sponsors listPaged: filtro per utente responsabile o creatore
CREATE INDEX IF NOT EXISTS sponsors_responsible_user_idx
  ON public.sponsors (responsible_user_id)
  WHERE responsible_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS sponsors_created_by_idx
  ON public.sponsors (created_by)
  WHERE created_by IS NOT NULL;

-- ============================================================
-- STEP 3: RPC get_sponsors_summary
-- Sostituisce SponsorsService.summary() che caricava tutti i
-- record in memoria e aggregava in TypeScript.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_sponsors_summary(
  p_user_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'contactedCount',     COUNT(*) FILTER (WHERE status = 'contattato'),
    'negotiatingCount',   COUNT(*) FILTER (WHERE status = 'in_trattativa'),
    'confirmedPaidCount', COUNT(*) FILTER (WHERE status IN ('confermato', 'pagato')),
    'promisedTotal',      COALESCE(SUM(promised_amount) FILTER (WHERE status IN ('confermato', 'pagato')), 0),
    'receivedTotal',      COALESCE(SUM(received_amount), 0)
  )
  FROM public.sponsors
  WHERE p_user_id IS NULL
     OR responsible_user_id = p_user_id
     OR created_by = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_sponsors_summary(uuid) TO authenticated;

-- ============================================================
-- STEP 4: RPC get_participation_request_counts
-- Sostituisce countsByStatus() che caricava tutti gli status
-- in memoria e contava in TypeScript.
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_participation_request_counts()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'newCount',       COUNT(*) FILTER (WHERE status = 'nuova'),
    'managingCount',  COUNT(*) FILTER (WHERE status = 'in_gestione'),
    'contactedCount', COUNT(*) FILTER (WHERE status = 'contattata'),
    'archivedCount',  COUNT(*) FILTER (WHERE status = 'archiviata')
  )
  FROM public.participation_requests
  WHERE status != 'trasferita';
$$;

GRANT EXECUTE ON FUNCTION public.get_participation_request_counts() TO authenticated;

-- ============================================================
-- STEP 5: Fix list_transactions_with_summary — rimuove double scan
-- Prima: la CTE summary_rows rileggeva transactions_view da zero
-- (UNION ALL di 4 branch × 2 LEFT JOIN profiles ciascuno = 8 join).
-- Ora: il summary usa le tabelle base direttamente, senza join a profiles
-- (non servono i nomi per calcolare importi e conteggi).
-- ============================================================
CREATE OR REPLACE FUNCTION public.list_transactions_with_summary(
  p_type text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_delivery_status text DEFAULT NULL,
  p_date_from date DEFAULT NULL,
  p_date_to date DEFAULT NULL,
  p_search text DEFAULT NULL,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 25
)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path TO 'public'
AS $$
  WITH filtered AS (
    SELECT *
    FROM public.transactions_view tv
    WHERE
      (p_type IS NULL OR p_type = 'all' OR tv.type = p_type)
      AND (p_category IS NULL OR tv.category = p_category)
      AND (
        p_delivery_status IS NULL
        OR p_delivery_status = 'all'
        OR (p_delivery_status = 'pending'   AND tv.type = 'income' AND tv.delivered_to_treasurer = false)
        OR (p_delivery_status = 'delivered' AND tv.type = 'income' AND tv.delivered_to_treasurer = true)
      )
      AND (p_date_from IS NULL OR tv.date >= p_date_from)
      AND (p_date_to   IS NULL OR tv.date <= p_date_to)
      AND (p_search IS NULL OR p_search = '' OR tv.description ILIKE '%' || p_search || '%')
  ),
  paged AS (
    SELECT *
    FROM filtered
    ORDER BY date DESC, created_at DESC
    OFFSET GREATEST(COALESCE(p_page, 1) - 1, 0) * GREATEST(COALESCE(p_page_size, 25), 1)
    LIMIT  GREATEST(COALESCE(p_page_size, 25), 1)
  ),
  base_summary AS (
    SELECT 'income'::text  AS type, amount,          delivered_to_treasurer FROM public.incomes
    UNION ALL
    SELECT 'expense'::text AS type, amount,          false                  FROM public.expenses
    UNION ALL
    SELECT 'income'::text  AS type, fee AS amount,   delivered_to_treasurer FROM public.tournament_teams WHERE paid = true
    UNION ALL
    SELECT 'income'::text  AS type, received_amount, delivered_to_treasurer FROM public.sponsors         WHERE received_amount > 0
  )
  SELECT jsonb_build_object(
    'data',
    COALESCE(
      (SELECT jsonb_agg(to_jsonb(p) ORDER BY p.date DESC, p.created_at DESC) FROM paged p),
      '[]'::jsonb
    ),
    'total',   (SELECT COUNT(*) FROM filtered),
    'summary', jsonb_build_object(
      'totalIncomes',         COALESCE((SELECT SUM(amount) FROM base_summary WHERE type = 'income'), 0),
      'totalExpenses',        COALESCE((SELECT SUM(amount) FROM base_summary WHERE type = 'expense'), 0),
      'incomeCount',          (SELECT COUNT(*) FROM base_summary WHERE type = 'income'),
      'expenseCount',         (SELECT COUNT(*) FROM base_summary WHERE type = 'expense'),
      'pendingDelivery',      COALESCE((SELECT SUM(amount)  FROM base_summary WHERE type = 'income' AND NOT delivered_to_treasurer), 0),
      'pendingDeliveryCount', (SELECT COUNT(*) FROM base_summary WHERE type = 'income' AND NOT delivered_to_treasurer)
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.list_transactions_with_summary(text, text, text, date, date, text, integer, integer)
  TO authenticated;
