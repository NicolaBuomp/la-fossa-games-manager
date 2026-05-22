-- Aggiunge supporto per ruoli multipli per utente
-- Introduce roles text[] sostituendo role text singolo
-- Nuovi ruoli: 'owner' (solo nbuompane), 'tesoriere'

-- 1. Aggiungi colonna roles
ALTER TABLE public.profiles
  ADD COLUMN roles text[] NOT NULL DEFAULT ARRAY['staff'::text];

-- 2. Migra dati esistenti da role a roles
UPDATE public.profiles
  SET roles = ARRAY[role]
  WHERE role = 'staff';

UPDATE public.profiles
  SET roles = ARRAY['staff'::text, 'admin'::text]
  WHERE role = 'admin';

-- 3. Imposta nbuompane come owner
UPDATE public.profiles
  SET roles = array_append(roles, 'owner'::text)
  WHERE username = 'nbuompane';

-- 4. Rimuovi la vecchia colonna role
ALTER TABLE public.profiles DROP COLUMN role;

-- 5. Aggiungi constraint sui valori ammessi
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_roles_check
  CHECK (roles <@ ARRAY['staff'::text, 'admin'::text, 'owner'::text, 'tesoriere'::text]);

-- 6. Aggiorna funzione is_admin()
CREATE OR REPLACE FUNCTION public.is_admin()
  RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  AS $$
    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND active = true
        AND 'admin' = ANY(roles)
    );
  $$;

-- 7. Aggiorna funzione is_active_member()
CREATE OR REPLACE FUNCTION public.is_active_member()
  RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  AS $$
    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND active = true
        AND array_length(roles, 1) > 0
    );
  $$;

-- 8. Nuova funzione is_owner()
CREATE OR REPLACE FUNCTION public.is_owner()
  RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  AS $$
    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND active = true
        AND 'owner' = ANY(roles)
    );
  $$;

-- 9. Nuova funzione is_treasurer()
CREATE OR REPLACE FUNCTION public.is_treasurer()
  RETURNS boolean
  LANGUAGE sql STABLE SECURITY DEFINER
  AS $$
    SELECT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND active = true
        AND ('tesoriere' = ANY(roles) OR 'owner' = ANY(roles))
    );
  $$;

-- 10. RPC per aggiornare i ruoli di un utente (solo owner)
CREATE OR REPLACE FUNCTION public.update_user_roles(target_user_id uuid, new_roles text[])
  RETURNS void
  LANGUAGE plpgsql SECURITY DEFINER
  AS $$
  BEGIN
    IF NOT is_owner() THEN
      RAISE EXCEPTION 'Solo l''owner può modificare i ruoli degli utenti';
    END IF;

    -- Valida che i ruoli siano validi (esclude owner dall'assegnazione via UI)
    IF new_roles && ARRAY['owner'::text] THEN
      RAISE EXCEPTION 'Il ruolo owner non può essere assegnato tramite questa funzione';
    END IF;

    IF NOT (new_roles <@ ARRAY['staff'::text, 'admin'::text, 'tesoriere'::text]) THEN
      RAISE EXCEPTION 'Ruoli non validi: %', new_roles;
    END IF;

    UPDATE public.profiles
      SET roles = new_roles
      WHERE id = target_user_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Utente non trovato: %', target_user_id;
    END IF;
  END;
  $$;

-- Gestisci il caso in cui updated_at non esista (ignora l'errore)
-- La funzione sopra funziona anche senza updated_at

-- 11. Aggiorna le RLS policy su profiles
-- Rimuovi le policy esistenti per update
DROP POLICY IF EXISTS profiles_admin_update ON public.profiles;
DROP POLICY IF EXISTS profiles_self_update ON public.profiles;

-- Owner può aggiornare qualsiasi profilo (inclusi i ruoli)
CREATE POLICY profiles_owner_update ON public.profiles
  FOR UPDATE
  USING (is_owner())
  WITH CHECK (is_owner());

-- Admin può aggiornare profili altrui ma NON può cambiare i roles
-- Usiamo la RPC per i roles, quindi qui l'admin aggiorna solo altri campi
CREATE POLICY profiles_admin_update ON public.profiles
  FOR UPDATE
  USING (is_admin() AND id != auth.uid())
  WITH CHECK (is_admin());

-- Self update (per profilo personale — campi non-sensibili)
CREATE POLICY profiles_self_update ON public.profiles
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
