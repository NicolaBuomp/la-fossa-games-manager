---
name: la-fossa-games-ui
description: "Guidelines for GitHub Copilot to build a polished, mobile-first Angular UI for La Fossa Games, balancing a fast internal management dashboard with a strong public landing experience."
metadata:
  author: "Nicola Buompane / La Fossa Games"
  project: "La Fossa Games"
  stack: "Angular, Tailwind CSS, Supabase"
---

# La Fossa Games UI Skill

This skill guides GitHub Copilot when generating UI, UX, components, pages, layouts, and frontend architecture for the **La Fossa Games** project.

The project has two different frontend souls:

1. **Internal management app**  
   A fast, clear, mobile-first operational dashboard used by staff and admins to manage sponsors, expenses, revenues, registrations, tournaments, payments, brackets, groups, calendars, results, documents, and materials.

2. **Public landing page**  
   A polished, sporty, high-conversion public website used by non-logged users to discover La Fossa Games, view tournaments, submit participation requests, see calendars, groups, rankings, results, sponsors, and public information.

The visual identity must be recognizable and consistent:

- Primary colors: **black, yellow, green**
- Mood: sporty, energetic, local-event driven, modern
- UX priority: clarity, speed, mobile usability, trust
- Design goal: premium but practical

The most important rule:

> The public landing page may be visually expressive. The internal dashboard must always remain fast, readable, and operational. Never sacrifice usability, accessibility, performance, or maintainability for visual effects.

---

## 1. Project Context

La Fossa Games is an event management platform for organizing sports and game tournaments.

The app must support:

- Dashboard overview
- Sponsor management
- Expense tracking
- Revenue tracking
- Tournament management
- Registrations
- Participation requests
- Staff/admin users
- Data export
- Warehouse/material tracking
- Documents and waivers
- Groups and draws
- Match calendars
- Results
- Rankings
- Public landing page content

Main tournaments:

- Calcio a 5
- Calcio a 5 Under 15
- Green Volley
- Ping Pong
- FC 26
- Briscola
- Calcio Balilla

The application must be designed for real operational usage during the event, especially from mobile devices.

---

## 2. Technology Rules

Use the existing project stack.

Expected frontend stack:

- Angular
- Standalone components
- TypeScript
- Tailwind CSS
- Supabase as backend
- Vercel for frontend deployment

Before adding any library, verify that the same result cannot be achieved with Angular, Tailwind, Angular CDK, or existing project dependencies.

Do not introduce heavy visual libraries unless there is a clear need.

Avoid adding by default:

- GSAP
- Lenis
- SplitType
- Three.js
- WebGL libraries
- Custom cursor libraries
- Complex animation frameworks
- Large UI kits without justification

Allowed when useful and justified:

- Angular CDK
- A lightweight accessible UI component library
- Charting library for dashboard statistics
- Date/calendar utilities if required
- File upload utilities if required

When suggesting or adding a library, explain:

- Why it is needed
- What problem it solves
- Why existing tools are not enough
- Its impact on bundle size and maintenance

---

## 3. Design Principles

### 3.1 Shared Visual Identity

All UI must feel part of La Fossa Games.

Use:

- Black/dark backgrounds for strong brand sections
- Yellow accents for primary actions and highlights
- Green accents for confirmation, success, sports energy, or brand details
- Clear contrast between content and background
- Bold typography for headers
- Compact and readable layouts for operational screens

Avoid:

- Generic admin templates with no personality
- Excessive gradients
- Random colors outside the brand palette
- Decorative elements that reduce readability
- Overly complex layouts on mobile

### 3.2 Mobile-First

Most usage may happen from a phone.

Always design first for:

- Small screens
- One-handed interaction
- Fast data entry
- Readable cards
- Sticky primary actions when helpful
- Large tap targets
- Clear form validation
- Minimal horizontal scrolling

Desktop layouts may use:

- Tables
- Multi-column dashboards
- Sidebars
- Wider data views
- Charts and summaries

But mobile must never be an afterthought.

### 3.3 Accessibility

Every generated UI must follow basic accessibility rules:

- Semantic HTML
- Proper buttons instead of clickable divs
- Visible focus states
- Keyboard-friendly interactions
- Sufficient color contrast
- Labels for form fields
- aria attributes only when useful
- Reduced motion support for animations

Do not use color alone to communicate status. Pair colors with labels, icons, or text.

---

## 4. Internal Management App Guidelines

The internal app is not a portfolio. It is a working tool.

Prioritize:

- Speed
- Clarity
- Reliability
- Low cognitive load
- Mobile usability
- Clear status management
- Fast filtering and searching
- Safe editing flows

### 4.1 Dashboard

The dashboard should quickly answer:

- How many sponsors are confirmed?
- How much money was promised?
- How much money was collected?
- How many registrations are pending?
- How many expenses are open?
- Which payments need attention?
- Which tournaments are active?
- What changed recently?

Recommended UI:

- Summary cards
- Status badges
- Compact charts
- Recent activity list
- Quick actions
- Mobile-friendly stacked layout

Avoid:

- Decorative hero sections inside the admin dashboard
- Full-screen animations
- Heavy motion
- Custom cursors
- Complex scroll effects

### 4.2 Sponsor Management

Sponsor UI must support:

- Sponsor name
- Category: bronze, silver, gold
- Contact person
- Phone
- Promised amount
- Collected amount
- Payment status
- Payment method
- Notes
- Assigned staff/admin member

Recommended UI:

- List with filters by category, status, assigned member
- Detail page or drawer
- Clear payment badge
- Quick call/contact action on mobile
- Amount visibility based on role permissions
- Export action for authorized users

Do not expose sensitive economic details to unauthorized roles.

### 4.3 Expenses and Revenues

Expense UI must support:

- Title
- Category
- Amount
- Date
- Payment method
- Paid by
- Status: paid, to reimburse, reimbursed
- Notes

Revenues should be separated by source:

- Sponsors
- Tournament registrations
- Food/bar
- Donations
- Other

Recommended UI:

- Clear financial summaries
- Filters by category/date/status
- Mobile card list
- Desktop table
- Role-based visibility
- Simple data entry form

Expenses do not require admin approval unless the business rules change.

### 4.4 Tournament Management

Tournament management must support the full lifecycle:

1. Tournament setup
2. Registration collection
3. Registration closure
4. Group/draw creation
5. Calendar generation
6. Match result entry
7. Ranking calculation
8. Public result visibility

Recommended sections:

- Tournament overview
- Participants/teams
- Groups
- Matches
- Results
- Rankings
- Settings

Tournament UI must allow staff/admins to:

- Create or edit tournaments
- Close registrations
- Generate or manually create groups
- Generate or manually edit calendars
- Insert results
- Publish results to the landing page
- Manage notes and special cases

Avoid hiding important tournament state behind complex interactions.

### 4.5 Registrations and Participation Requests

Registration UI must support:

- Team or participant name
- Contact person
- Phone
- Player list
- Registration fee
- Payment status
- Registration status
- Staff notes
- Waiver/document status when available

Recommended statuses:

- Pending
- Approved
- Rejected
- Waiting for payment
- Confirmed

Public requests should be easy to submit. Internal approval should be safe and clear.

### 4.6 Warehouse, Materials, and Documents

For warehouse/material tracking, prefer simple operational screens:

- Item name
- Category
- Quantity
- Assigned person
- Status
- Notes

For documents/waivers:

- Document type
- Related participant/team
- Upload status
- Validation status
- Notes

Keep file handling simple, secure, and mobile-friendly.

---

## 5. Public Landing Page Guidelines

The public landing page may be more expressive than the admin dashboard.

Its goals:

- Present La Fossa Games clearly
- Communicate energy and credibility
- Show tournaments
- Drive registrations or participation requests
- Display public calendars, groups, rankings, and results
- Highlight sponsors
- Work perfectly on mobile

### 5.1 Landing Structure

Recommended sections:

1. Hero
2. Event overview
3. Tournament list
4. Registration call to action
5. Calendar / upcoming matches
6. Groups and rankings
7. Results
8. Sponsors
9. FAQ / useful info
10. Contact / social links

### 5.2 Hero

The hero should be visually strong but not slow.

Use:

- Bold typography
- Strong black/yellow/green contrast
- Sport/event imagery or abstract shapes
- Clear CTA
- Short copy
- Mobile-friendly layout

Avoid:

- Mandatory preloaders
- Excessive 100vh sections on mobile
- Scroll hijacking
- Heavy video backgrounds unless optimized
- Effects that delay content access

### 5.3 Public Tournament Data

Public users must be able to see:

- Tournament names
- Registration status
- Calendar
- Groups
- Results
- Rankings
- Public announcements

The public landing must never expose:

- Internal notes
- Private phone numbers unless intentionally public
- Sensitive payment data
- Admin/staff-only information
- Supabase implementation details

---

## 6. Motion and Interaction Rules

Use motion to improve understanding, not to impress at any cost.

Good uses:

- Button hover feedback
- Card hover elevation
- Subtle page transitions
- Toast notifications
- Modal enter/exit
- Loading skeletons
- Status updates
- Landing section reveals

Avoid by default:

- Custom cursors
- Magnetic buttons
- Scroll hijacking
- Long preloaders
- Heavy parallax
- WebGL
- Complex pinned scroll narratives
- Animations required to understand content

Performance rules:

- Animate only `transform` and `opacity` where possible
- Avoid animating `width`, `height`, `top`, `left`, `margin`, or layout-heavy properties
- Use `prefers-reduced-motion`
- Reduce or disable decorative animations on touch devices
- Do not use `will-change` everywhere
- Keep initial load fast

Use CSS transitions and Angular-friendly patterns before introducing external animation libraries.

---

## 7. Component Rules

Prefer reusable, focused components.

Examples:

- `StatusBadgeComponent`
- `PaymentStatusBadgeComponent`
- `TournamentCardComponent`
- `SponsorCardComponent`
- `AmountSummaryCardComponent`
- `DataFilterBarComponent`
- `EmptyStateComponent`
- `ConfirmDialogComponent`
- `MobileActionBarComponent`
- `PublicTournamentSectionComponent`
- `RankingTableComponent`
- `MatchResultCardComponent`

Each component should:

- Have a clear responsibility
- Use typed inputs/outputs
- Avoid hidden side effects
- Be easy to test
- Work well on mobile
- Use Tailwind consistently

Do not create large components that mix:

- Data fetching
- Permission logic
- Complex form logic
- Presentation
- Routing
- Mutation handling

Split when needed.

---

## 8. Forms and Data Entry

Forms are central to the project.

Always generate forms that are:

- Clear
- Validated
- Mobile-friendly
- Forgiving but precise
- Easy to correct
- Safe against accidental destructive actions

Use clear labels.

Use helpful validation messages.

Use appropriate input types:

- `tel` for phone numbers
- `number` or currency-specific handling for amounts
- `date` for dates
- selects for statuses/categories
- textarea for notes

For money values:

- Avoid floating-point mistakes in business logic
- Prefer storing cents or decimal-safe values if the database supports it
- Format amounts consistently in the UI

For destructive actions:

- Staff users must not be allowed to delete records
- Admin-only delete actions must require confirmation
- Prefer soft delete/archive where appropriate

---

## 9. Role-Based UX

Roles:

### Public user

Can:

- View public landing content
- Submit participation requests
- View public tournament calendars/results/rankings when published

Cannot:

- Access admin dashboard
- See internal notes
- See private financial data

### Staff user

Can:

- Create and modify operational data
- Manage sponsors, expenses, registrations, tournaments, results, and payment statuses where allowed
- View only permitted financial sections

Cannot:

- Delete data
- Create staff/admin users
- Access unauthorized financial details
- Modify system-level settings

### Admin user

Can:

- Manage all data
- Create staff users
- Manage roles
- Delete or archive data where allowed
- Access all financial details
- Configure public visibility

Every UI action must respect these permissions.

Do not only hide UI buttons. Enforce permissions through guards, services, and Supabase policies where possible.

---

## 10. Supabase and Data Safety

Supabase is the backend.

Most tables and migrations already exist. Before changing data models:

1. Inspect existing tables/types/services.
2. Reuse existing conventions.
3. Update migrations clearly.
4. Update TypeScript types.
5. Update services and tests.
6. Consider RLS impact.

RLS is recommended for sensitive tables, especially:

- Users/profiles
- Roles
- Sponsors
- Payments
- Expenses
- Revenues
- Internal notes
- Documents
- Staff-only records

Never expose service role keys or secrets in frontend code.

Do not put sensitive business logic only in UI components.

---

## 11. UI Library Guidance

Tailwind CSS is the baseline.

A UI library may be used only if it improves:

- Accessibility
- Forms
- Tables
- Dialogs
- Menus
- Date pickers
- Selects
- Mobile UX
- Development speed without hurting maintainability

Preferred approach:

1. Use existing components first.
2. Use Tailwind for custom branded UI.
3. Use Angular CDK for accessibility and behavior.
4. Add a UI library only with justification.

Avoid mixing multiple UI libraries.

If a UI library is introduced, keep brand styling consistent with La Fossa Games.

---

## 12. Tables, Cards, and Responsive Data

Use tables on desktop when data comparison matters.

Use cards on mobile when tables become hard to read.

For data-heavy pages:

- Add search
- Add filters
- Add sorting where useful
- Add empty states
- Add loading states
- Add error states
- Add pagination or virtual scrolling when needed

For mobile:

- Avoid wide tables
- Use stacked record cards
- Put key status and amount at the top
- Keep primary actions easy to reach

---

## 13. Landing Page Performance

The landing page must be visually strong but fast.

Rules:

- Optimize images
- Lazy-load non-critical sections
- Avoid blocking animations
- Keep above-the-fold content fast
- Do not add video or heavy assets without explicit need
- Make public data fetching resilient
- Add fallback states for missing tournament data

Public pages should remain usable even if some dynamic data fails to load.

---

## 14. Code Style

Follow existing project conventions.

General rules:

- Angular standalone components
- TypeScript
- Two-space indentation
- Tailwind utility classes consistent with existing UI
- Clear naming
- Small focused files
- Feature-specific logic inside feature folders
- Shared reusable UI inside shared components
- Do not hand-edit generated files

Naming should be clear and consistent.

Prefer business-readable names:

- `Sponsor`
- `Tournament`
- `Registration`
- `ParticipationRequest`
- `PaymentStatus`
- `ExpenseStatus`
- `TournamentStatus`
- `UserRole`

Avoid vague names:

- `DataItem`
- `Thing`
- `ManagerComponent`
- `PageComponent` when more specific naming is possible

---

## 15. Testing Expectations

Add or update tests when changing:

- Auth
- Guards
- Role permissions
- Supabase services
- Data mapping
- Payment status logic
- Registration status transitions
- Tournament generation logic
- Ranking calculations
- Public visibility rules
- Critical forms

Use Jasmine/Karma if that is the existing setup.

At minimum, test:

- Permission-sensitive behavior
- Service methods
- Status transitions
- Edge cases in tournament/ranking logic
- UI behavior that affects important workflows

---

## 16. Codex/Copilot Working Rules

Before modifying code:

1. Inspect the existing structure.
2. Identify related components, services, types, guards, and Supabase files.
3. Reuse existing patterns.
4. Avoid unnecessary rewrites.
5. Make the smallest safe change.
6. Consider mobile UX.
7. Consider role permissions.
8. Consider Supabase/RLS implications.
9. Consider tests.
10. Consider deployment impact.

Do not:

- Touch generated files unless the generator is also updated
- Introduce new libraries without justification
- Rewrite large areas without need
- Break working flows
- Expose sensitive data
- Skip permission checks
- Add decorative complexity to admin screens
- Assume public and internal data have the same visibility

When implementing a feature, include:

- Component/page changes
- Service changes
- Type updates
- Permission checks
- Loading/error/empty states
- Responsive layout
- Tests where needed

---

## 17. Deployment Awareness

Frontend target:

- Vercel

Backend target:

- Supabase free plan

Codex/Copilot must consider free-plan limits:

- Database usage
- Storage usage
- Bandwidth
- Function usage if edge functions are added
- Excessive polling
- Large unoptimized images
- Heavy client bundles

Avoid solutions that require expensive infrastructure unless explicitly requested.

For production safety, prefer separate environments when possible:

- Development/testing environment
- Production environment

Ideally, use separate Supabase projects for dev and prod when real event data is involved.

---

## 18. Final Quality Checklist

Before considering a UI task complete, verify:

- The layout works on mobile
- The layout works on desktop
- The UI follows black/yellow/green brand identity
- Text is readable
- Buttons are easy to tap
- Empty states exist
- Loading states exist
- Error states exist
- Permissions are respected
- Staff cannot delete data
- Admin-only actions are protected
- Sensitive amounts are not exposed to unauthorized users
- Forms have validation
- Animations are lightweight
- Reduced motion is respected
- No unnecessary library was added
- Existing flows are not broken
- Tests were added or updated when appropriate

---

## Summary

Build La Fossa Games as a serious, polished event platform.

For the public landing page:

- Make it memorable
- Make it sporty
- Make it conversion-focused
- Make it fast

For the internal app:

- Make it clear
- Make it reliable
- Make it mobile-first
- Make it operational

Premium quality means not only beautiful UI, but also correct permissions, clean data flows, fast interactions, and an interface that staff can use under real event pressure.
