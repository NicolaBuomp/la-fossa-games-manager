# AGENTS.md — La Fossa Games Manager

## Project Context

La Fossa Games Manager is an Angular/Supabase web application used to manage the operational side of La Fossa Games. The app must support both internal management workflows and a public-facing landing area.

The project is not only a generic admin panel. It manages a real multi-sport event with sponsors, registrations, expenses, payments, tournament organization, documents, materials, and public tournament results.

Codex must preserve this business context when making changes. Every technical decision should support clarity, mobile usability, data reliability, and simple management by non-technical staff.

## Core Goals

- Manage La Fossa Games operations from a single web app.
- Allow unauthenticated users to submit participation requests and view public information.
- Allow staff users to manage day-to-day operational data without accessing every sensitive area.
- Allow admin users to control users, permissions, configuration, exports, and critical data.
- Support future editions of the event, not only the current one.
- Keep the application usable mainly from mobile devices.
- Keep frontend hosting and backend usage compatible with free or low-cost deployment constraints.

## Tech Stack

- Frontend: Angular 21 with standalone components.
- Styling: Tailwind CSS.
- Backend: Supabase.
- Database: PostgreSQL managed through Supabase migrations.
- Auth: username/password-style login flow backed by Supabase Auth or an equivalent Supabase-compatible implementation.
- Hosting: Vercel for the frontend.
- Testing: Jasmine/Karma through Angular CLI.

Avoid adding new frameworks, libraries, or architectural layers unless there is a strong reason and the change is explained clearly.

## Existing Project Structure

Application code lives mainly in `src/app`.

Expected structure:

- `src/app/core/services`: Supabase, auth, CRUD, export, generated-data, and domain services.
- `src/app/core/guards`: route protection for staff/admin/public flows.
- `src/app/core/types`: shared models, enums, constants, and database-related types.
- `src/app/features`: page-level areas such as dashboard, registrations, sponsors, tournaments, participation requests, expenses, exports, users, and public landing pages.
- `src/app/shared/components`: reusable UI components.
- `src/styles.css`: global styles.
- `public`: static public assets.
- `src/app/core/generated`: generated files. Do not edit manually.
- `src/environments`: generated or environment-specific configuration.
- `supabase`: migrations, schema, seeds, policies, and SQL helpers.
- `scripts`: local generation or validation scripts.

Do not move folders or rename large areas unless the task specifically requires it.

## Development Commands

Use the existing npm scripts whenever possible:

- `npm install`: install dependencies.
- `npm start`: generate required assets/env and run Angular locally.
- `npm run build`: generate required assets/env and create the production build.
- `npm test`: generate required assets/env and run tests.
- `npm run watch`: rebuild continuously with the development configuration.
- `npm run check:schema`: verify schema assumptions.
- `npm run sync:sponsors`: regenerate sponsor-related generated data.
- `npm run sync:env`: regenerate environment files.

Before proposing changes to scripts, inspect `package.json` and related scripts.

## User Roles and Permissions

The app has three main user levels.

### Public / unauthenticated user

Can:

- View the landing page.
- View public information about the event.
- Submit participation requests or registration forms.
- View public tournament information once available: groups, fixtures, calendars, results, standings, and other public competition data.

Cannot:

- Access internal dashboard pages.
- View private economic data.
- Modify registrations, payments, sponsors, or tournament administration.

### Staff user

Can:

- Create and modify operational data.
- Manage sponsors assigned or visible to them, according to app rules.
- Manage expenses and operational records.
- Manage registrations and participation requests.
- Change payment states where allowed by the current workflow.
- Manage tournament operational data when authorized.

Cannot:

- Delete records.
- Create other staff users.
- Access every economic section by default.
- Change global configuration unless explicitly allowed.

### Admin user

Can:

- Manage all data.
- Create staff users manually.
- Assign roles and permissions.
- Delete records when the UI and database policies allow it.
- Access sensitive economic data.
- Export data.
- Manage configuration, tournament setup, and critical workflows.

## Permission Rules

- Staff can create and update data, but deletion should be restricted to admins.
- Staff can see only the economic sections explicitly allowed by the app.
- Staff can change payment states.
- Only admins can create staff users.
- Authorization must be enforced both in the Angular UI and in Supabase policies where possible.
- Never rely only on hidden buttons in the frontend for security.

## Main Functional Modules

The app must support these modules:

- Dashboard.
- Sponsors.
- Expenses.
- Income.
- Tournaments.
- Registrations.
- Participation requests.
- Users and staff management.
- Data export.
- Warehouse/materials.
- Documents and release forms.
- Tournament management after registrations close.
- Public landing page.

## Tournament Management

After registrations close, the app should support complete tournament organization.

Required or expected features:

- Create tournaments.
- Configure tournament type and rules.
- Manage teams or individual participants.
- Create groups.
- Support draw/sorteggio workflows.
- Generate calendars and fixtures.
- Record match results.
- Calculate standings where relevant.
- Publish public data to the landing page.
- Keep internal admin data separate from public display data.

Public users should eventually be able to see:

- Groups.
- Match calendar.
- Results.
- Standings.
- Tournament status.

Tournament entities should be designed in a way that can support multiple tournament formats, not only one fixed sport.

Current tournaments:

- Calcio a 5.
- Calcio a 5 Under 15.
- Green Volley.
- Ping Pong.
- FC 26.
- Briscola.
- Calcio Balilla.

## Sponsor Management

Each sponsor should support at least:

- Sponsor name.
- Category: `bronzo`, `silver`, `gold`.
- Contact person.
- Phone number.
- Promised amount.
- Received amount.
- Payment status.
- Payment method.
- Notes.
- Staff member and/or admin responsible for the sponsor.

Optional future fields may include:

- Logo.
- Contract or agreement files.
- Receipt files.
- Visibility/package notes.
- Sponsorship deliverables.

When changing sponsor-related code, preserve the distinction between promised amount and received amount.

## Expense Management

Each expense should support at least:

- Title.
- Category.
- Amount.
- Date.
- Payment method.
- Person who paid.
- Status: `pagata`, `da_rimborsare`, `rimborsata`.
- Notes.

Expenses do not require admin approval before being inserted.

Do not assume every staff user can see all financial information. Check role and permission logic before exposing totals, reports, or exports.

## Income Management

Income should be tracked separately from expenses.

Possible income sources:

- Sponsors.
- Tournament registrations.
- Food/bar.
- Donations.
- Other event income.

Keep economic logic explicit and avoid mixing sponsor payments with generic income unless the data model intentionally supports that mapping.

## Registration and Participation Requests

Each registration or participation request should support at least:

- Team or participant name.
- Contact person.
- Phone number.
- Player list.
- Registration fee.
- Payment status.
- Registration status.
- Staff notes.
- Release forms/documents.

Status changes should be explicit and type-safe.

Suggested status examples:

- `draft`.
- `submitted`.
- `pending_review`.
- `approved`.
- `rejected`.
- `pending_payment`.
- `confirmed`.
- `cancelled`.

Use the existing project schema if it already defines different values. Do not invent new statuses without checking existing database assumptions.

## Materials and Warehouse

The app should support a module for materials and warehouse management.

Possible features:

- Material name.
- Category.
- Quantity.
- Assigned area or tournament.
- Purchase/rental status.
- Notes.
- Responsible staff member.

Keep this module separate from expenses, even if some materials are linked to costs.

## Documents and Release Forms

The app should support document management for registrations and participants.

Possible document types:

- Release forms/liberatorie.
- Receipts.
- Agreements.
- Sponsor documents.
- Other event documents.

Use Supabase Storage only after checking existing bucket structure and security policies.

## UI and UX Guidelines

The UI must be:

- Mobile-first.
- Fast to use during event operations.
- Clear for non-technical staff.
- Minimal, practical, and consistent with La Fossa Games branding.
- Suitable both for a management dashboard and a polished public landing page.

Brand colors:

- Black.
- Yellow.
- Green.

Use Tailwind utility classes consistently with the existing codebase.

For UI libraries:

- Prefer Tailwind and existing shared components first.
- A UI library can be introduced only if it clearly improves the management UI and public landing UX.
- If adding a UI library, explain why it is needed, what problem it solves, and why it is better than using existing components.
- Avoid heavy or visually inconsistent libraries.

## Angular Guidelines

- Use standalone components.
- Keep components small and focused.
- Put feature-specific logic inside the relevant `features/<area>` folder.
- Put reusable UI in `shared/components`.
- Put reusable business/data logic in `core/services`.
- Put shared types, enums, and constants in `core/types`.
- Use route guards for staff/admin protection.
- Keep templates readable and avoid complex logic directly inside HTML.
- Prefer typed reactive forms for complex forms.
- Avoid duplicated Supabase calls across components; use services.
- Avoid large all-purpose services. Split by domain when needed.

## TypeScript Guidelines

- Keep strict typing wherever possible.
- Avoid `any` unless there is a strong reason.
- Use explicit interfaces/types for domain entities.
- Keep database-related types aligned with Supabase schema.
- When migrations change database fields, update TypeScript types and mapping logic.
- Prefer clear naming over clever abstractions.

Naming convention:

- Angular files: `feature-name.component.ts`, `domain.service.ts`, `admin.guard.ts`.
- Types and interfaces: descriptive English names are preferred for code consistency.
- User-facing labels may be Italian.
- Database enum values should be stable, lowercase, and documented.

## Supabase and Database Guidelines

Supabase is the only backend.

Most tables and migrations already exist. Before creating or changing database objects:

1. Inspect existing migrations.
2. Inspect existing schema assumptions.
3. Check existing RLS policies.
4. Check generated or manually maintained TypeScript types.
5. Prefer additive migrations when possible.
6. Avoid destructive changes unless explicitly requested.

RLS:

- RLS should be strongly considered for all tables containing private or operational data.
- Public landing data may be exposed through safe public views/tables/policies.
- Sensitive data such as payments, expenses, users, and private notes must not be publicly readable.
- Frontend guards are not enough for security.

Migrations:

- Never modify production data assumptions casually.
- Add clear migration files for database changes.
- Include policies when adding new tables.
- Update seed data if needed.
- Update schema checks if the project has scripts that validate assumptions.

## Authentication Guidelines

- Staff users are created manually by admins.
- Public users do not need accounts to submit requests unless a future feature requires it.
- The login flow should feel like username/password, even if implemented with Supabase-compatible email/password under the hood.
- Keep role checks centralized and consistent.

## Generated Files

Do not manually edit generated files.

Generated locations include:

- `src/app/core/generated`.
- Generated environment files under `src/environments`.
- Any file clearly marked as generated.

If generated output is wrong, update the generator script instead.

## Testing Guidelines

Tests use Jasmine/Karma.

Add or update tests when changing:

- Auth logic.
- Guards.
- Role/permission behavior.
- Supabase data mapping.
- Registration status transitions.
- Payment status transitions.
- Sponsor calculations.
- Expense/income totals.
- Tournament calendar/result logic.
- Public/private data visibility.

Place tests next to the unit under test using `*.spec.ts`.

Run the relevant tests before finishing a task when possible.

## Export and Reporting

The app should support exports for operational and admin workflows.

Possible exports:

- Sponsors.
- Expenses.
- Income.
- Registrations.
- Tournament participants.
- Final economic report.
- Public tournament data where useful.

Admin users should have full export access. Staff export access must respect permission rules.

Do not expose restricted economic data in public exports.

## Deployment Guidelines

Frontend deployment target: Vercel.
Backend: Supabase free plan unless requirements change.

Codex should consider free-plan constraints for Supabase and Vercel:

- Avoid unnecessary server-side complexity.
- Avoid excessive polling.
- Avoid large storage usage without reason.
- Avoid expensive queries where simple indexed queries or views would work.
- Keep public landing pages efficient.

Recommended environment setup:

- Development Supabase project for local/dev testing.
- Production Supabase project for real event data.

If separate Supabase projects are not currently available, keep the code ready for separate dev/prod configuration through environment variables.

## Security Rules

- Keep secrets out of git.
- Do not hardcode Supabase keys beyond safe public anon keys where appropriate.
- Do not expose service-role keys in frontend code.
- Validate public form inputs.
- Protect admin/staff routes with guards.
- Protect private data with Supabase policies.
- Do not expose private notes, internal payment details, or staff-only data on the landing page.

## Codex Workflow Before Making Changes

Before editing code, Codex should:

1. Understand the requested change.
2. Inspect the relevant folder structure.
3. Identify affected components, services, types, guards, migrations, tests, and generated files.
4. Check whether the change affects permissions or public/private data visibility.
5. Check whether database changes require a migration.
6. Prefer the smallest safe implementation.
7. Avoid large refactors unless the task explicitly asks for one.

## Codex Rules During Changes

- Do not break working flows.
- Do not remove existing behavior unless requested.
- Do not introduce new libraries without explaining the reason.
- Do not edit generated files manually.
- Do not change Supabase schema without a clear migration.
- Do not bypass role checks.
- Do not expose private data in the landing page.
- Keep UI consistent with the existing Tailwind style.
- Keep business rules explicit and typed.
- Keep commits focused when suggesting commit boundaries.

## Pull Request / Final Response Checklist

When completing a task, summarize:

- What changed.
- Files touched.
- Database migrations added or changed.
- Tests added or updated.
- Commands run.
- Any risks, limitations, or follow-up work.

For UI changes, include screenshots or explain what should be visually checked.

For Supabase changes, include notes about policies, seed data, and environment requirements.

## Commit Style

Use Conventional Commits, preferably scoped and imperative.

Examples:

- `feat: aggiungi gestione gironi torneo`.
- `fix: correggi visibilità importi sponsor per staff`.
- `refactor: separa servizio sponsor da servizio entrate`.
- `test: aggiungi test permessi staff`.

Keep each commit focused on one logical change.

## Important Business Notes

- La Fossa Games uses black, yellow, and green as brand colors.
- The app must work well from mobile because staff may use it during the event.
- Staff permissions are intentionally limited.
- Payment states can be changed by staff where allowed.
- Deletions are admin-only.
- Tournament public data must be visible to unauthenticated users only when it is meant to be public.
- The app should remain maintainable for future editions of the event.
