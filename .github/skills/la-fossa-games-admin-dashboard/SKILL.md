---
name: la-fossa-games-admin-dashboard
description: "Guidelines for GitHub Copilot to build a mobile-first Angular management dashboard for La Fossa Games, optimized for staff/admin operations, data entry, permissions, and tournament management."
metadata:
  author: "Nicola Buompane / La Fossa Games"
  project: "La Fossa Games"
  target: "Internal management dashboard"
  stack: "Angular, Tailwind CSS, Supabase"
---

# La Fossa Games Admin Dashboard Skill

This skill guides GitHub Copilot when building or modifying the **internal management dashboard** for La Fossa Games.

The dashboard is not a marketing website. It is an operational tool used by staff and admins to manage the event before and during its execution.

The dashboard must be:

- Mobile-first
- Fast
- Clear
- Reliable
- Easy to use under pressure
- Safe with permissions
- Consistent with the La Fossa Games brand

Brand identity:

- Black
- Yellow
- Green
- Sporty
- Minimal
- Operational
- Modern

Core principle:

> The admin dashboard must prioritize usability, data accuracy, permissions, and speed over decorative visual effects.

---

## 1. Product Context

La Fossa Games is an event/tournament management platform.

The internal dashboard must support:

- Dashboard overview
- Sponsor management
- Expense tracking
- Revenue tracking
- Tournament management
- Registrations
- Participation requests
- Staff/admin users
- Export data
- Warehouse/material tracking
- Documents and waivers
- Tournament groups
- Draws
- Match calendars
- Results
- Rankings
- Public visibility controls for the landing page

Main tournaments:

- Calcio a 5
- Calcio a 5 Under 15
- Green Volley
- Ping Pong
- FC 26
- Briscola
- Calcio Balilla

The app will be used mostly from mobile devices, especially by staff members during real event operations.

---

## 2. Stack and Architecture

Use the existing project architecture.

Expected stack:

- Angular
- Standalone components
- TypeScript
- Tailwind CSS
- Supabase
- Vercel deployment

Follow existing conventions before introducing new patterns.

Use:

- `core/services` for Supabase, auth, CRUD, export, and domain services
- `core/guards` for route protection
- `core/types` for shared models, enums, constants, and database-related types
- `features` for page-level business areas
- `shared/components` for reusable UI
- `supabase` for migrations and seed data
- generated folders only through their generators

Do not hand-edit generated files unless the generator is updated too.

---

## 3. Recommended UI Library

Tailwind CSS remains the base styling system.

For this dashboard, a UI helper library is useful because the app requires:

- accessible dialogs
- drawers/sheets
- dropdowns
- selects
- date pickers
- tooltips
- tabs
- accordions
- tables
- mobile-friendly overlays
- confirmation modals
- command/search interfaces

Recommended choice:

## Angular CDK + Headless/unstyled components first

Prefer **Angular CDK** as the foundation because it provides accessible behavior without forcing a visual style.

Use Angular CDK for:

- dialogs
- overlays
- focus trapping
- keyboard interactions
- portals
- accessibility primitives
- menus where appropriate
- virtual scrolling if large lists require it

This keeps the UI fully brandable with Tailwind.

## Optional UI library

If the project needs faster delivery of complex admin components, prefer **PrimeNG** only if it is intentionally adopted across the app.

PrimeNG is useful for:

- data tables
- calendars/date pickers
- dropdowns
- multi-selects
- dialogs
- toasts
- confirm dialogs
- file upload
- admin-style components

Rules if PrimeNG is introduced:

1. Do not mix multiple UI libraries.
2. Keep Tailwind as the brand styling layer.
3. Override PrimeNG styling to match black/yellow/green.
4. Use PrimeNG mainly for complex admin controls, not for every visual element.
5. Avoid PrimeNG components when a simple Tailwind component is enough.
6. Check bundle size and avoid importing unnecessary modules.
7. Keep all UI accessible and mobile-friendly.

Do not introduce Angular Material unless the project explicitly chooses a Material Design look. Material is reliable but may make the dashboard feel less custom and less aligned with La Fossa Games branding.

---

## 4. Mobile-First Dashboard Rules

Design every management screen for mobile first.

Mobile UI must use:

- stacked cards instead of wide tables
- large tap targets
- sticky bottom actions where useful
- compact but readable forms
- clear status badges
- quick filters
- searchable lists
- simple detail drawers or pages
- readable monetary values
- minimal horizontal scrolling

Desktop UI may use:

- tables
- sidebars
- multi-column grids
- charts
- denser information layout

But desktop improvements must not break mobile usability.

Avoid:

- fixed-width layouts
- desktop-only tables
- tiny action buttons
- hover-only interactions
- hidden critical actions
- multi-step flows when a simple form is enough

---

## 5. Role-Based Dashboard UX

Roles:

### Public user

Public users do not access the internal dashboard.

They may submit participation requests through public forms and view published tournament information on the landing page.

### Staff user

Staff users can:

- create operational data
- modify operational data
- manage sponsors where permitted
- manage expenses where permitted
- manage registrations
- update payment statuses
- manage tournaments and results where permitted
- view only authorized economic sections

Staff users cannot:

- delete data
- create staff/admin users
- change roles
- access unauthorized financial details
- modify system-level settings

### Admin user

Admin users can:

- manage all internal data
- create staff users
- manage roles
- delete/archive records where allowed
- access all financial details
- configure public visibility
- manage settings

Rules:

- Do not only hide UI buttons.
- Enforce permissions in guards, services, and Supabase/RLS policies when possible.
- UI must clearly communicate when an action is not available.
- Admin-only actions must be protected both in UI and data layer.
- Staff users must never be able to delete records.

---

## 6. Dashboard Home

The dashboard home should show the operational state of the event.

Recommended widgets:

- Total sponsors
- Confirmed sponsors
- Promised amount
- Collected amount
- Pending payments
- Total expenses
- Expenses to reimburse
- Net balance
- Pending registrations
- Confirmed registrations
- Active tournaments
- Matches today/upcoming
- Recent activity
- Quick actions

Mobile layout:

- summary cards stacked in a 1-column layout
- quick actions near the top
- recent alerts clearly visible
- no decorative hero

Desktop layout:

- summary cards grid
- charts if useful
- activity panel
- finance/tournament overview panels

Use charts only if they improve decision-making.

---

## 7. Sponsor Management

Sponsor records should support:

- sponsor name
- category: bronze, silver, gold
- contact person
- phone
- promised amount
- collected amount
- payment status
- payment method
- notes
- assigned staff/admin member

Recommended UI:

- sponsor list
- filters by category, payment status, assigned member
- search by name/contact
- sponsor detail page or drawer
- quick phone/contact action on mobile
- payment status badge
- role-based amount visibility
- export action for authorized users

Mobile card should show:

- sponsor name
- category
- payment status
- assigned member
- main amount if user is authorized
- quick actions

Do not expose sensitive financial data to unauthorized staff users.

---

## 8. Expense Management

Expense records should support:

- title
- category
- amount
- date
- payment method
- paid by
- status: paid, to reimburse, reimbursed
- notes

Expenses do not require admin approval unless business rules change.

Recommended UI:

- expense list
- quick add expense
- filters by category/date/status/paid by
- reimbursement status badge
- monthly or event-total summary
- mobile cards
- desktop table

For staff users:

- show only permitted economic data
- allow payment status updates if permitted
- do not allow deletion

For admin users:

- full visibility
- correction tools
- delete/archive if allowed

---

## 9. Revenue Management

Revenue records should be clearly separated by source:

- sponsors
- tournament registrations
- food/bar
- donations
- other

Recommended UI:

- revenue source filters
- total collected
- expected vs collected
- missing payments
- export
- related entity link when available

Payment-related UI must be clear and consistent across sponsors, registrations, and other revenue sources.

Use shared payment status components.

---

## 10. Tournament Management

Tournament management is a core dashboard module.

The dashboard must support the full tournament lifecycle:

1. Create tournament
2. Configure tournament rules/settings
3. Collect registrations
4. Close registrations
5. Create or generate groups
6. Create or generate calendar
7. Manage matches
8. Insert results
9. Calculate rankings
10. Publish public data to landing page

Tournament UI sections:

- overview
- participants/teams
- groups
- matches
- calendar
- results
- rankings
- settings
- public visibility

Recommended tournament statuses:

- draft
- registrations open
- registrations closed
- groups generated
- calendar generated
- in progress
- completed
- archived

Do not make tournament generation a black box.

For generated groups/calendar, provide:

- preview
- confirmation
- manual adjustment
- clear warning before overwriting existing data

Results entry must be fast on mobile.

Recommended result entry UI:

- match card
- two team names
- score inputs
- save button
- status badge
- optional notes
- clear validation

Ranking calculations must be testable and deterministic.

---

## 11. Registration Management

Registration records should support:

- team or participant name
- contact person
- phone
- player list
- registration fee
- payment status
- registration status
- staff notes
- waiver/document status if available

Recommended registration statuses:

- pending
- approved
- rejected
- waiting for payment
- confirmed

Recommended UI:

- registrations list
- filters by tournament/status/payment
- quick approve/reject
- detail page or drawer
- payment update action
- document/waiver status
- duplicate check when possible

Mobile card should show:

- team/participant name
- tournament
- registration status
- payment status
- contact action
- primary next action

---

## 12. Participation Requests

Participation requests are submitted from the public side and reviewed internally.

Internal UI must allow staff/admins to:

- view requests
- filter by tournament/status
- approve request
- reject request
- convert request into registration
- add staff notes
- update contact data if needed

Do not lose the original submitted information.

Track review state and reviewer when possible.

---

## 13. Warehouse and Materials

Material tracking should remain simple and operational.

Material records may include:

- item name
- category
- quantity
- assigned person
- location
- status
- notes

Recommended statuses:

- available
- assigned
- missing
- damaged
- returned

Recommended UI:

- item list
- quantity summary
- filters by category/status
- quick quantity update
- mobile cards

Avoid overcomplicating this module unless required.

---

## 14. Documents and Waivers

Document/waiver tracking should support:

- document type
- related tournament
- related participant/team
- upload status
- validation status
- notes
- uploaded file reference if implemented

Recommended statuses:

- missing
- uploaded
- valid
- rejected
- expired

Rules:

- Do not expose private documents publicly.
- Use secure Supabase storage rules if files are uploaded.
- Show clear missing-document warnings before confirming registrations when needed.

---

## 15. Public Visibility Controls

Some tournament data will be shown on the public landing page.

Admin/staff UI should clearly control what is public.

Potential public data:

- tournament list
- registration status
- groups
- calendar
- match results
- rankings
- announcements
- sponsors

Never publish:

- internal notes
- private phone numbers unless explicitly intended
- payment details
- staff-only records
- documents
- private registration data

Use explicit flags or status fields for public visibility.

Examples:

- `isPublic`
- `publishedAt`
- `publicStatus`
- `showOnLanding`

Do not assume all internal data is public.

---

## 16. Forms

Forms must be simple, clear, and validated.

Rules:

- Use labels for every field.
- Use clear validation messages.
- Use proper input types.
- Keep forms short when possible.
- Break long forms into logical sections.
- Save actions must be clearly visible.
- Show success/error feedback.
- Prevent accidental double submission.
- Preserve user input on validation errors.

Recommended field types:

- `tel` for phone
- `number` or currency-safe input for amounts
- `date` for dates
- selects for statuses/categories
- textarea for notes

For money:

- format consistently in EUR
- avoid floating-point errors in business logic
- prefer cents or decimal-safe database values where possible

---

## 17. Data Lists, Tables, and Cards

Data-heavy pages need strong UX.

Always include when useful:

- search
- filters
- sorting
- pagination or incremental loading
- empty states
- loading states
- error states

Desktop:

- tables are acceptable
- use sticky headers if useful
- keep row actions clear
- do not overload columns

Mobile:

- prefer cards
- show key status at the top
- show most important fields first
- put secondary info in expandable sections
- place primary actions near the bottom or in a sticky action area

Do not create horizontal-scroll tables on mobile unless there is no better option.

---

## 18. Status Badges and Visual Language

Use consistent badges for:

- payment status
- registration status
- tournament status
- document status
- material status
- publication status

Badges should include text, not only color.

Recommended color meaning:

- Yellow: pending, attention, primary brand action
- Green: confirmed, paid, valid, success
- Red: rejected, missing, error, danger
- Gray: draft, archived, neutral
- Blue or neutral accent: informational if needed

Keep badge design consistent across modules.

---

## 19. Navigation

Admin navigation must be fast and predictable.

Recommended mobile navigation:

- bottom navigation for core areas, or
- compact header + menu drawer

Recommended desktop navigation:

- sidebar
- clear active state
- grouped modules

Suggested groups:

- Overview
- Finance
- Sponsors
- Tournaments
- Registrations
- Materials
- Documents
- Users
- Exports
- Settings

Do not hide important sections inside unclear menus.

---

## 20. Feedback and System States

Every important action must provide feedback.

Use:

- toast notifications
- inline validation
- loading spinners or skeletons
- disabled states during save
- confirmation dialogs for risky actions
- empty states with next action

Examples:

- Sponsor saved
- Payment status updated
- Expense added
- Registration approved
- Groups generated
- Result published
- Export completed

Error messages should be understandable and actionable.

Avoid raw technical errors in UI.

---

## 21. Motion Rules for Admin

Use minimal motion.

Good motion:

- subtle hover/focus states
- drawer/modal transitions
- toast entrance
- accordion expand/collapse
- loading skeletons

Avoid:

- preloader screens
- custom cursors
- scroll hijacking
- heavy parallax
- magnetic buttons
- long page transitions
- decorative animation on forms/tables

Performance rules:

- animate `transform` and `opacity`
- respect `prefers-reduced-motion`
- avoid expensive layout animations
- avoid animation that blocks user input

---

## 22. Supabase Rules

Supabase is the only backend.

Before changing database-related code:

1. Inspect existing migrations.
2. Inspect existing generated types.
3. Inspect existing services.
4. Reuse conventions.
5. Add migration only when needed.
6. Update TypeScript types.
7. Update services.
8. Update tests.
9. Consider RLS and role permissions.

RLS is recommended, especially for:

- users/profiles
- roles
- sponsors
- expenses
- revenues
- registrations
- documents
- internal notes
- staff-only data

Never expose secrets in frontend code.

Do not put authorization only in components.

---

## 23. Services and State

Keep business logic out of components when possible.

Use services for:

- Supabase queries
- mutations
- status transitions
- role checks
- export logic
- tournament generation
- ranking calculation
- payment calculations

Components should focus on:

- rendering
- user interaction
- form binding
- calling services
- showing states

Avoid duplicate data logic across pages.

---

## 24. Testing

Add or update tests when modifying:

- auth
- guards
- role permissions
- Supabase data mapping
- payment status logic
- registration workflows
- tournament generation
- calendar generation
- result saving
- ranking calculation
- public visibility logic
- critical forms

Test examples:

- staff cannot delete records
- admin can create staff users
- staff can update payment status where allowed
- unauthorized staff cannot see restricted amounts
- ranking calculation handles ties
- generated groups are deterministic or explicitly randomized with clear behavior
- public landing receives only public-safe data

Use the existing test setup.

---

## 25. Export Rules

Export features may include:

- sponsors
- expenses
- revenues
- registrations
- tournament participants
- match results
- rankings
- final economic report

Rules:

- exports must respect permissions
- sensitive fields must be excluded for unauthorized users
- exported files should have clear filenames
- data should be formatted consistently
- monetary values should be readable

Admin can export all permitted data.

Staff can export only what their role allows.

---

## 26. Safety and Destructive Actions

Staff cannot delete data.

Admin delete actions must:

- be clearly labeled
- require confirmation
- explain consequence
- prefer archive/soft delete where possible

Use dangerous styling only for truly destructive actions.

Avoid placing destructive actions next to common actions without separation.

---

## 27. Codex/Copilot Workflow

Before making changes:

1. Understand the requested feature.
2. Identify affected modules.
3. Inspect existing files.
4. Reuse existing patterns.
5. Check permissions.
6. Check mobile UX.
7. Check Supabase impact.
8. Check tests.
9. Make the smallest safe change.
10. Avoid unnecessary rewrites.

After changes:

1. Ensure mobile layout works.
2. Ensure desktop layout works.
3. Ensure permissions are respected.
4. Ensure loading/error/empty states exist.
5. Ensure no generated files were manually edited.
6. Ensure no unnecessary library was added.
7. Ensure tests were updated when needed.

---

## 28. Anti-Patterns

Do not generate:

- desktop-only admin pages
- tables that are unusable on mobile
- giant components with mixed responsibilities
- decorative dashboards with poor data visibility
- forms without validation
- hidden permission assumptions
- public exposure of internal data
- staff delete actions
- untested tournament ranking logic
- hardcoded role logic scattered across components
- duplicated Supabase queries
- new libraries without explanation
- custom cursor or portfolio-style effects
- landing-page-style hero sections inside admin pages

---

## 29. Final Checklist

Before considering admin UI complete, verify:

- mobile-first layout
- clear navigation
- readable typography
- brand-consistent styling
- accessible forms
- visible validation
- loading states
- error states
- empty states
- role permissions
- staff cannot delete
- sensitive data is protected
- payment statuses are clear
- tournament states are clear
- public/private data is separated
- Supabase changes are safe
- tests are updated where needed
- no unnecessary visual complexity
- no unnecessary dependencies

---

## Summary

Build the La Fossa Games dashboard as a serious internal management system.

It should feel branded, modern, and polished, but its first job is to help staff and admins manage the event quickly and safely from mobile.

Premium admin quality means:

- fewer clicks
- clearer data
- safer permissions
- better forms
- faster updates
- reliable tournament management
- no useless visual noise
