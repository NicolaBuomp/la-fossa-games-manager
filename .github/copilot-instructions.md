# La Fossa Games – Copilot Instructions

## Project Overview

**La Fossa Games** is an Angular 21 SPA that manages a multi-sport summer event (22–26 giugno 2026) held in Pozzuoli. It has two surfaces:

- **Landing page** (`/`) — public marketing page with tournament info, public participation form, and sponsor inquiry
- **Gestionale** (`/app/*`) — authenticated management dashboard for staff and admins

All UI text is in **Italian**. Dates use `it-IT` locale, currency uses EUR formatting.

---

## Tech Stack

| Layer     | Technology                                    |
| --------- | --------------------------------------------- |
| Framework | Angular 21, standalone components             |
| Language  | TypeScript 5.9 (strict)                       |
| Styling   | TailwindCSS 3.4 (custom theme)                |
| Backend   | Supabase (Auth + PostgreSQL + RPC)            |
| State     | Angular Signals (no NgRx, no BehaviorSubject) |
| Deploy    | Vercel                                        |

---

## Commands

```bash
npm start            # dev server :4200 (runs sync:env:dev pre-hook)
npm run build        # production build (runs sync:env:prod pre-hook)
npm test             # Karma tests
npm run sync:env     # regenerate src/environments/environment.generated.ts from .env
npm run deploy:vercel
```

`environment.generated.ts` is **gitignored** — always regenerated from `.env` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`).

---

## Architecture

### Folder layout

```
src/app/
├── app.component.ts        # Root: RouterOutlet + CookieBanner
├── app.routes.ts           # All routes (lazy-loaded)
├── core/
│   ├── guards/             # authGuard, adminGuard, appHomeGuard
│   ├── services/           # SupabaseService, CrudService, AuthService, feature services
│   └── types/
│       ├── models.ts       # All interfaces and Insert* types
│       └── constants.ts    # EXPENSE_CATEGORIES, INCOME_CATEGORIES, PAYMENT_METHODS, SPONSOR_STATUSES
├── features/
│   ├── landing/            # Public landing page
│   ├── auth/               # Login page
│   ├── dashboard/          # Admin KPI + audit log
│   ├── expenses/           # Expense CRUD (admin)
│   ├── incomes/            # Income CRUD (admin)
│   ├── sponsors/           # Sponsor pipeline (admin)
│   ├── registrations/      # Tournament + team + participant management
│   ├── participation-requests/ # Public request triage
│   ├── profile/            # Password change
│   └── users/              # User management (admin)
└── shared/
    └── components/
        ├── shell.component.ts      # Layout: desktop sidebar + mobile hamburger
        └── ui.component.ts         # SummaryCard, KpiPanel, Modal, EmptyState, StatusBadge, ConfirmModal
```

### Routes

```
/                   → LandingComponent (public)
/login              → LoginComponent (public)
/app                → ShellComponent [authGuard]
  /app/dashboard    → DashboardComponent [adminGuard]
  /app/expenses     → ExpensesComponent [adminGuard]
  /app/incomes      → IncomesComponent [adminGuard]
  /app/sponsors     → SponsorsComponent [adminGuard]
  /app/registrations          → RegistrationsComponent [authGuard]
  /app/participation-requests → ParticipationRequestsComponent [authGuard]
  /app/profile      → ProfileComponent [authGuard]
  /app/users        → UsersComponent [adminGuard]
```

`appHomeGuard` redirects `/app` → `/app/dashboard` (admin) or `/app/registrations` (staff).

---

## Design System

### Custom Tailwind colors (tailwind.config.js)

| Token     | Hex       | Usage                                       |
| --------- | --------- | ------------------------------------------- |
| `ink`     | `#0A0A0A` | Primary text, dark backgrounds              |
| `fossa`   | `#FFD400` | Brand yellow – primary CTA, badges, accents |
| `paper`   | `#FAF7F2` | App background (cream)                      |
| `income`  | `#10B981` | Positive money, success state               |
| `expense` | `#FF3D00` | Negative money, danger state                |

### Fonts

- **Body:** Inter (`font-body`) — all body text, forms, labels
- **Display:** Archivo Black (`font-display`) — hero headings, large display text

### SummaryCard tones

```typescript
type Tone = "default" | "income" | "expense" | "warning";
// 'income'  → emerald/green
// 'expense' → red-orange
// 'warning' → amber
// 'default' → ink/neutral
```

### Component prefix

All components use the `lfg` selector prefix (configured in `angular.json`).

---

## Data Models (`core/types/models.ts`)

### Primitive types

```typescript
type UserRole = "staff" | "admin";
type SponsorStatus = "contattato" | "in_trattativa" | "confermato" | "pagato";
type SponsorType = "cash" | "bonifico";
type TournamentSport = "calcio" | "pallavolo" | "altro";
type ParticipantGender = "uomo" | "donna";
```

### Insert types pattern

Every entity has an `Insert*` type that omits server-managed fields:

```typescript
type InsertExpense = Omit<
  Expense,
  "id" | "created_by" | "updated_by" | "created_at" | "updated_at"
>;
// Same pattern for: InsertIncome, InsertSponsor, InsertTournament, InsertTournamentTeam,
//                   InsertTeamParticipant, InsertRegistration, InsertParticipationRequest
```

### Key entities

- **Profile** — user account with `role`, `active`, `username`, `full_name`
- **Expense / Income** — financial records with `date`, `category`, `amount`, `payment_method`, `paid_by`/`received_by`
- **Sponsor** — CRM-style pipeline: `company_name`, `contact_name`, `value`, `status`, `type`, `deliverables`
- **Tournament → TournamentTeam → TeamParticipant** — three-level hierarchy
- **Registration** — flat view for direct-entry tournaments (couples / solo)
- **ParticipationRequest** — public form submissions with status machine and `participation_request_notes`
- **AuditLog** — automatic change tracking (`insert` / `update` / `delete`)

---

## Services

### SupabaseService

Singleton wrapping `@supabase/supabase-js` client. Inject wherever Supabase access is needed.

### CrudService (abstract base)

```typescript
abstract class CrudService<T, I> {
  async list(): Promise<T[]>;
  async create(payload: I): Promise<T>;
  async update(id: string, payload: Partial<I>): Promise<T>;
  async remove(id: string): Promise<void>;
}
```

All feature services extend this. Default sort: `created_at DESC` (override via constructor).

### AuthService

Signal-based. Key signals:

```typescript
session(); // Supabase Session | null
profile(); // Profile | null
isAuthenticated(); // boolean
isAdmin(); // boolean (role === 'admin')
isActive(); // boolean (profile.active)
```

Key methods: `signIn(identifier, password)`, `signOut()`, `updatePassword(password)`, `refreshProfile()`.

Username login resolves email via RPC `username_login_email(login_username)`.

### LoadingService

Global spinner via a counter. `start()` / `stop()` — increment/decrement. `active()` signal = true if count > 0.

### RequestBadgesService

Signals: `tournamentRequests`, `sponsorRequests`. Call `refresh()` on navigation to update nav badges.

### ExportService

`downloadCsv(filename, rows)` — converts any `Record[]` to a properly escaped CSV and triggers browser download.

### ProfileService (admin only)

Admin operations via Supabase Edge Functions:

- `createUser(input: CreateUserInput)` → calls `admin-create-user`
- `resetPassword(id)` → calls `admin-reset-password`
- `updateRole(id, role)`, `setActive(id, active)`
- `updateOwnFullName(fullName)` → RPC `update_own_profile_name`
- `displayNames(ids[])` → RPC `user_display_names`

---

## State Management Pattern

Use **Angular Signals** exclusively. No RxJS observables for component state, no NgRx.

```typescript
// Standard pattern in every feature component
items = signal<Type[]>([]);
loading = signal(false);
error = signal("");
modalOpen = signal(false);
editing = signal<Type | null>(null);
saving = signal(false);

filteredItems = computed(() => this.items().filter(/* ... */));
```

RxJS is used only in ShellComponent to react to `NavigationEnd` events.

---

## Coding Conventions

### Components

- Always **standalone** (`standalone: true`)
- Template inline or external `.html` file — be consistent with the existing file
- Use `inject()` for dependency injection, not constructor parameters
- Import only what the template needs (no barrel `CommonModule`)

### Forms

Use **template-driven forms** with `ngModel` (no ReactiveFormsModule). Standard structure:

```html
<form (ngSubmit)="save()">
  <fieldset [disabled]="saving()" class="disabled:opacity-70">
    <label class="grid gap-1 text-sm font-bold">
      Campo <span class="text-red-500">*</span>
      <input
        type="text"
        [(ngModel)]="form.field"
        name="field"
        required
        class="rounded-lg border border-black/10 bg-neutral-50 px-3 py-2 text-sm font-normal
               focus:border-ink focus:outline-none focus:ring-2 focus:ring-fossa/20"
      />
    </label>
    <button type="submit" [disabled]="saving()">
      {{ saving() ? 'Salvataggio…' : 'Salva' }}
    </button>
  </fieldset>
</form>
```

### Error handling

```typescript
// Service level
const { data, error } = await this.supabase.client.from("table").select();
if (error) throw error;
return data;

// Component level
try {
  await this.service.operation();
} catch (e) {
  this.error.set(e instanceof Error ? e.message : "Operazione fallita");
}
```

### Date / currency formatting

```typescript
new Intl.DateTimeFormat("it-IT").format(new Date(dateString));
new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(
  amount,
);
```

---

## UI Component Catalog (`shared/components/ui.component.ts`)

| Component               | Selector            | Key inputs                                                   |
| ----------------------- | ------------------- | ------------------------------------------------------------ |
| `SummaryCardComponent`  | `lfg-summary-card`  | `label`, `value`, `hint?`, `tone?`                           |
| `KpiPanelComponent`     | `lfg-kpi-panel`     | `title`, `eyebrow?`, `storageKey` (localStorage)             |
| `EmptyStateComponent`   | `lfg-empty-state`   | `title`, `text`, `actionLabel?` → `(action)`                 |
| `ModalComponent`        | `lfg-modal`         | `open`, `title` → `(close)`                                  |
| `StatusBadgeComponent`  | `lfg-status-badge`  | `label`, `className?`                                        |
| `ConfirmModalComponent` | `lfg-confirm-modal` | `open`, `message`, `confirmLabel?` → `(confirm)`, `(cancel)` |

KPI panel collapse state is persisted as `lfg-kpi-{storageKey}` in `localStorage`.

---

## Features Quick Reference

### Landing page sections (public)

1. **Hero** — countdown to event, CTAs: "Iscriviti" (fossa yellow) / "Scopri i tornei"
2. **Key info cards** — dates, sports count, registration status
3. **Sports grid** — 7 tournament cards with modal detail + "Chiedi informazioni" CTA
4. **Why section** — yellow background, stats: 7 Tornei / 5 Giorni / 1ª Edizione
5. **Sponsor tiers** — Silver / Gold / Platinum pricing with perks
6. **Participation form** — tabbed: "Partecipa" (tournament form) or "Diventa sponsor" (sponsor inquiry)

Public form calls `PublicParticipationService.createRequest()` / `createSponsorLead()` (no auth required).

### Dashboard (admin only)

- Main balance card: recorded incomes + sponsors paid + registrations paid − expenses
- Probable balance: adds confirmed/negotiating sponsors + unpaid registration fees
- 5-column KPI panel: sponsor counts, registration counts, payment rate
- Pending requests alert (amber) if `nuova` requests exist
- Audit log: last 12 operations with color-coded action badges (insert=green, update=blue, delete=red)

### Registrations

7 default tournaments (upserted on first load):

| Code | Name                | Sport     | Type   |
| ---- | ------------------- | --------- | ------ |
| —    | Calcio a 5          | calcio    | Team   |
| —    | Calcio a 5 Under 15 | calcio    | Team   |
| —    | Pallavolo           | pallavolo | Team   |
| —    | Briscola            | altro     | Couple |
| —    | Fifa                | altro     | Solo   |
| —    | Ping Pong           | altro     | Solo   |
| —    | Calcio Balilla      | altro     | Couple |

Team-based tournaments manage `TournamentTeam` + nested `TeamParticipant`. Direct-entry tournaments use the flat `Registration` model. Italian collation used for name sorting.

### Sponsors status machine

```
contattato → in_trattativa → confermato → pagato
```

A **sponsor lead** is: `status='contattato'`, `type='cash'`, `value=0`, `deliverables='Richiesta informazioni sponsor dal sito pubblico'`. These come from the public landing form and trigger a nav badge.

### Participation requests status machine

```
nuova → in_gestione → contattata → archiviata
                    ↑____________________________| (can reopen)
```

`nuova` requests trigger a nav badge. Each request can have threaded notes (`participation_request_notes`).

---

## Role-Based Access

| Feature                | Staff            | Admin |
| ---------------------- | ---------------- | ----- |
| Dashboard              | ❌               | ✅    |
| Expenses               | ❌               | ✅    |
| Incomes                | ❌               | ✅    |
| Sponsors               | ❌               | ✅    |
| Registrations          | ✅ (view + edit) | ✅    |
| Participation Requests | ✅               | ✅    |
| Profile                | ✅               | ✅    |
| Users                  | ❌               | ✅    |

Guards: `authGuard` (authenticated + active), `adminGuard` (authenticated + active + admin).

---

## Navigation (ShellComponent)

Desktop: fixed sidebar (72px wide on mobile collapsed, full width on lg+).
Mobile: sticky header with hamburger → full-height overlay menu.

Nav items with badges (admin-only):

- **Richieste** badge = count of `nuova` participation requests
- **Sponsor** badge = count of sponsor leads (value=0 + contattato + from public form)

Badges are refreshed by `RequestBadgesService.refresh()` on every `NavigationEnd`.

---

## Responsive Breakpoints

| Breakpoint | px   | Notes                     |
| ---------- | ---- | ------------------------- |
| `sm`       | 640  | Tablet — 2-column grids   |
| `lg`       | 1024 | Desktop — sidebar appears |
| `xl`       | 1280 | Wide — 3+ column grids    |

Mobile-first. Modals slide up from bottom on mobile (`animate-slide-up`), centered on desktop. Touch targets: `min-h-11` (44px).

---

## Supabase RPC Functions

| Function                  | Called from    | Purpose                               |
| ------------------------- | -------------- | ------------------------------------- |
| `username_login_email`    | AuthService    | Resolve username → email for login    |
| `admin-create-user`       | ProfileService | Create new user with temp password    |
| `admin-reset-password`    | ProfileService | Reset user password                   |
| `update_own_profile_name` | ProfileService | User updates their own full name      |
| `user_display_names`      | ProfileService | Batch-fetch display names by user IDs |

---

## Constants

```typescript
// core/types/constants.ts
EXPENSE_CATEGORIES; // 10 items: 'Attrezzatura', 'Premi/Trofei', 'Catering', ...
INCOME_CATEGORIES; // 7 items: 'Iscrizioni', 'Sponsor', 'Bar/Ristoro', ...
PAYMENT_METHODS; // 5 items: 'Contanti', 'Bonifico', 'POS/Carta', 'PayPal', 'Altro'
SPONSOR_STATUSES; // Array<{id, label, className}> — use for status filter pills
```

---

## What NOT to do

- Do **not** use RxJS `BehaviorSubject` or `Observable` for component state — use `signal()` / `computed()`
- Do **not** use `CommonModule` — import only what is needed (e.g., `NgIf`, `NgFor` are available as standalone directives or use `@if` / `@for` control flow)
- Do **not** use Angular forms `ReactiveFormsModule` — use template-driven `ngModel`
- Do **not** add a global state store (NgRx, Akita, etc.)
- Do **not** hardcode Supabase URLs or keys in source — they come from `environment.generated.ts`
- Do **not** use `constructor(private ...)` injection — use `inject()` at field level
- Do **not** translate UI text to English — all labels, messages, and copy must remain in **Italian**
