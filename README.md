# La Fossa Games Manager

Web app Angular mobile-first per la gestione organizzativa di un evento sportivo: spese, entrate, sponsor, iscrizioni, utenti staff/admin ed export CSV.

## Stack

- Angular 21 standalone components
- TypeScript
- TailwindCSS
- Supabase Auth
- Supabase PostgreSQL
- Supabase Row Level Security
- Deploy statico compatibile con Vercel o GitHub Pages

La bozza `sport-event-manager.jsx` e' stata usata solo come riferimento funzionale e visivo. L'app finale non usa React e non usa `localStorage` come database.

## Funzionalita MVP

- Landing pubblica visibile senza login.
- Login/logout con Supabase Auth.
- Rotte protette per staff/admin.
- Guard admin per gestione utenti.
- Dashboard con totale entrate, totale spese, saldo, sponsor confermati/pagati, iscrizioni pagate e da incassare.
- CRUD mobile-first per spese, entrate, sponsor e iscrizioni.
- Eliminazione record solo per admin, applicata sia in UI sia in RLS.
- Cambio stato sponsor e toggle pagamento iscrizioni.
- Modulo utenti solo admin per ruolo `staff/admin` e stato `active`.
- Export CSV per spese, entrate, sponsor e iscrizioni.

## Installazione

```bash
npm install
```

## Configurazione Supabase

1. Crea un progetto gratuito su Supabase.
2. In SQL Editor esegui la migration:

```text
supabase/migrations/20260508104500_initial_schema.sql
```

3. Crea il primo utente da Supabase Auth.
4. Promuovi il primo profilo ad admin:

```sql
update public.profiles
set role = 'admin', active = true, full_name = 'Admin La Fossa'
where email = 'tua-email@example.com';
```

5. Recupera Project URL e anon public key da Supabase Project Settings > API.
6. Sostituisci i placeholder in:

```text
src/environments/environment.ts
src/environments/environment.prod.ts
```

Nota: la Supabase anon key e' pubblica per natura nelle app frontend. La sicurezza dei dati e' demandata alle policy RLS incluse nella migration.

## Sviluppo locale

```bash
npm start
```

Apri `http://localhost:4200`.

### Gestione Ambienti (Dev / Prod)

Per differenziare il collegamento al database di sviluppo e produzione usando un unico file `.env`:

1. Nel tuo file `.env` (o `.env.local`), definisci le chiavi con i prefissi `DEV` e `PROD`:

   ```text
   SUPABASE_DEV_URL=...
   SUPABASE_DEV_ANON_KEY=...

   SUPABASE_PROD_URL=...
   SUPABASE_PROD_ANON_KEY=...
   ```

2. Avvia o builda l'app usando i comandi dedicati:

- **Sviluppo (usa chiavi \_DEV):**

  ```bash
  npm run start:dev
  ```

- **Produzione locale (usa chiavi \_PROD):**

  ```bash
  npm run start:prod
  ```

- **Build per Sviluppo:**

  ```bash
  npm run build:dev
  ```

- **Build per Produzione:**
  ```bash
  npm run build:prod
  ```

Il comando standard `npm start` continuerà a cercare le chiavi standard `LFG_SUPABASE_URL` e `LFG_SUPABASE_ANON_KEY`.

## Seed opzionale

Il file `supabase/seed/dev_seed.sql` contiene dati dimostrativi. Usalo solo in sviluppo e dopo aver creato almeno un utente autenticato. Se vuoi promuovere un utente ad admin, modifica la UUID o usa l'email come mostrato sopra.

## Ruoli e autorizzazioni

- Utenti non autenticati: non leggono e non scrivono dati gestionali.
- Staff attivi: leggono, creano e aggiornano spese, entrate, sponsor e iscrizioni.
- Admin attivi: fanno tutto, inclusa eliminazione record e gestione profili.
- Ogni utente puo' leggere il proprio profilo.
- Solo admin puo' leggere e modificare profili altrui.

Le policy sono definite nella migration iniziale con helper SQL `public.is_active_member()` e `public.is_admin()`.

## Deploy Vercel

1. Collega il repository a Vercel.
2. Build command:

```bash
npm run build
```

3. Output directory:

```text
dist/la-fossa-games-manager/browser
```

4. `vercel.json` contiene la rewrite verso `index.html` per supportare il routing Angular.

## Deploy GitHub Pages

Installa le dipendenze e genera la build con base href del repository:

```bash
npm run build -- --base-href /NOME_REPOSITORY/
```

Pubblica il contenuto di:

```text
dist/la-fossa-games-manager/browser
```

Per routing client-side su GitHub Pages, configura una fallback `404.html` uguale a `index.html` nel workflow di deploy.

## Struttura principale

```text
src/app/core/services      Supabase, auth, CRUD, export
src/app/core/guards        auth.guard e admin.guard
src/app/core/types         interfacce e costanti
src/app/features           landing, login, dashboard e moduli MVP
src/app/shared/components  shell e componenti UI riutilizzabili
supabase/migrations        schema, trigger e policy RLS
supabase/seed              seed opzionale sviluppo
```/app/core/types         interfacce e costanti
src/app/features           landing, login, dashboard e moduli MVP
src/app/shared/components  shell e componenti UI riutilizzabili
supabase/migrations        schema, trigger e policy RLS
supabase/seed              seed opzionale sviluppo
```
