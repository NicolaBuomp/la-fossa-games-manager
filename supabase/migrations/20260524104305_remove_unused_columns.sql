-- Rimozione colonne ridondanti o non utilizzate

-- tournaments.sport: ridondante con il campo code (es. 'calcio-a-5', 'pallavolo')
ALTER TABLE public.tournaments DROP COLUMN IF EXISTS sport;

-- participation_requests.email: non usato nel flusso admin
ALTER TABLE public.participation_requests DROP COLUMN IF EXISTS email;

-- sponsors.type: sempre derivato da payment_method al salvataggio
ALTER TABLE public.sponsors DROP COLUMN IF EXISTS type;

-- sponsors.value: campo legacy, sempre sincronizzato con promised_amount
ALTER TABLE public.sponsors DROP COLUMN IF EXISTS value;
