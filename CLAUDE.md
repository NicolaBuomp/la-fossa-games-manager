# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Dev server at localhost:4200 (auto-generates environment.generated.ts)
npm run build      # Production build to dist/la-fossa-games-manager/browser
npm test           # Karma test runner
npm run sync:env   # Manually regenerate src/environments/environment.generated.ts from .env
npm run deploy:vercel  # Build + deploy to Vercel production
```

All start/build/test scripts automatically run `sync:env` as a pre-hook. The file `src/environments/environment.generated.ts` is gitignored and generated from `.env` (requires `SUPABASE_URL` and `SUPABASE_ANON_KEY`).

## Architecture

**Stack**: Angular 21 standalone components · TypeScript 5.9 · TailwindCSS · Supabase (Auth + PostgreSQL)

### Data Layer

- `SupabaseService` — singleton wrapping the `@supabase/supabase-js` client; all database access goes through it
- `CrudService<T, I>` — abstract base class with generic `list`, `create`, `update`, `remove` methods; entity services extend it
- Entity services (`ExpensesService`, `SponsorsService`, etc.) extend `CrudService` and call Supabase RPC or table queries
- `ExportService` — CSV download utility for any `T[]`

### State Management

Angular Signals for all reactive state. No NgRx or global store — Supabase is the source of truth. `AuthService` exposes session, profile, and user state as computed read-only signals.

### Routing & Guards

Lazy-loaded standalone routes in `src/app/app.routes.ts`:
- Public: `/` (landing), `/login`
- Protected (`/app/*`): requires `authGuard` (authenticated + active)
- Admin-only: requires `adminGuard` (authenticated + active + admin role)

### Feature Modules

Each feature in `src/app/features/` follows the same pattern:
1. Inject service + auth + export + profiles
2. Signal-based state: `items`, `form`, `modalOpen`, `editing`, `error`
3. `ngOnInit` loads data from the service
4. Modal for create/edit with ngModel two-way binding
5. List view with admin-only delete actions
6. CSV export via `ExportService`

### Shared UI

`src/app/shared/components/` contains:
- `ShellComponent` — responsive layout: desktop sidebar nav + mobile hamburger with badge support
- `ModalComponent`, `SummaryCardComponent`, `EmptyStateComponent` — reusable UI atoms

### Types

- `src/app/core/types/models.ts` — all interfaces: `Profile`, `Expense`, `Income`, `Sponsor`, `Registration`, `Tournament`, `ParticipantRequest`
- `src/app/core/types/constants.ts` — `EXPENSE_CATEGORIES`, `INCOME_CATEGORIES`, `PAYMENT_METHODS`, `SPONSOR_STATUSES`
- User roles: `'staff' | 'admin'`
- Sponsor statuses: `'contattato' | 'in_trattativa' | 'confermato' | 'pagato'`

### Styling

TailwindCSS with custom theme colors defined in `tailwind.config.js`:
- `ink` (#0A0A0A) — primary text/dark
- `fossa` (#FFD400) — brand yellow accent
- `paper` (#FAF7F2) — background
- `income` / `expense` — semantic color scales

Component prefix is `lfg` (configured in `angular.json`).
