# Admin UX/UI Redesign Worklist

Visual redesign target: [`docs/UI_DESIGN_REFERENCE.md`](./UI_DESIGN_REFERENCE.md). Navigation source of truth: [`docs/ADMIN_MENU_INFORMATION_ARCHITECTURE.md`](./ADMIN_MENU_INFORMATION_ARCHITECTURE.md). Component, copy, state, duplicate-work, and execution source of truth: [`docs/UI_CONSISTENCY_COMPLETION_PLAN.md`](./UI_CONSISTENCY_COMPLETION_PLAN.md). Motion source of truth: [`docs/UI_MOTION_ANIMATION_CONTRACT.md`](./UI_MOTION_ANIMATION_CONTRACT.md). The supplied Gaming Fintech Admin boards are the acceptance reference for exact visual parity across Dashboard, Operations, Review, Finance/Risk/Reports, Providers/Marketing/Settings, Desktop, and Mobile.

Updated: 2026-07-14  
Scope: `apps/web-admin` only  
Source of truth for Admin UX/UI work: this file

> This worklist is aligned with the current repository. Existing foundations are Next.js 14, React 18, TypeScript, custom Admin primitives, global CSS/custom properties, `packages/api-client`, Playwright, and `qrcode`. Tools not installed in the repository are planned decisions, not completed capabilities.

## Status

- ✅ Done and verified
- 🧪 Implemented, regression evidence still required
- 🚧 In progress
- ⏳ Planned
- ⛔ Blocked
- 🧊 Deferred

## Admin Definition of Done

- Uses the real API, permissions, audit, finance, risk, KYC, provider, and settings behavior.
- Supports loading, empty, error, partial, stale, conflict, permission-denied, success, and retry states.
- Works at 360×800, 390×844, 430×932, 768×1024, 1024×768, and 1440×900.
- Keyboard navigation, visible focus, 200% zoom, reduced motion, and screen-reader names work.
- Long Thai text, IDs, money values, and masked sensitive values do not overflow.
- Critical mutation actions include confirmation, reason, permission, audit, conflict handling, and partial-failure feedback.
- Relevant Admin build, Playwright, accessibility, and visual checks pass.

# A0: Current foundation and debt inventory

## ADMIN-FOUNDATION-001 Current tooling

- [x] Next.js 14, React 18, TypeScript
- [x] Custom Admin UI primitives
- [x] CSS custom properties, responsive CSS, animation, transitions
- [x] `prefers-reduced-motion`
- [x] Shared `packages/api-client`
- [x] Playwright smoke and visual commands
- [x] `qrcode` for 2FA/security flow
- [ ] Inventory every Admin route and page owner
- [ ] Inventory shared Admin components and duplicate variants
- [ ] Inventory inline-style debt in KYC, finance, settings, risk, reports, and support
- [ ] Replace selectors coupled to `[style*="..."]` with semantic classes
- [ ] Define ownership for global CSS, component styles, tokens, and layout utilities

## ADMIN-FOUNDATION-002 Tooling decisions

- [ ] Evaluate and add `react-hook-form` plus `zod` for mutation forms
- [ ] Evaluate and add `@tanstack/react-query` for server state
- [ ] Evaluate and add `@tanstack/react-table` for dense Admin data views
- [ ] Evaluate and add `motion` for mount/unmount and state transitions
- [ ] Evaluate and add `@axe-core/playwright` and JSX accessibility lint rules
- [ ] Evaluate and add `lucide-react` as the single icon library
- [ ] Record an ADR for each accepted dependency
- [ ] Record bundle impact, migration scope, owner, and rollback plan
- [ ] Do not add shadcn, Radix, Tailwind, GSAP, Rive, Lottie, MUI, Ant Design, or another state/form layer without an approved ADR and demonstrated need

# A1: Shared Admin systems

## ADMIN-SYSTEM-001 Design tokens and primitives

- [ ] Adopt the shared Gaming Fintech visual language: deep navy shell, gold accent, elevated panels, thin borders, restrained radii, white/muted text, semantic green/amber/red statuses, and one outline icon family.
- [ ] Match reference typography, Thai/Latin hierarchy, tabular financial figures, spacing scale, control heights, card density, chart treatment, and responsive table/card behavior.
- [ ] Map sidebar, topbar, KPI tile, table, filter bar, case detail, evidence panel, timeline, badge, modal, drawer, and sticky action patterns to reusable Admin components.
- [ ] Produce approved Desktop and Mobile visual baselines for every Admin reference route at all six standard viewports.

- [ ] Consolidate color, spacing, radius, shadow, typography, motion, breakpoint, and z-index tokens
- [ ] Consolidate Button, Input, Select, TextArea, Checkbox, Radio, and Field primitives
- [ ] Consolidate Card, Metric, Badge, Notice, Toast, Skeleton, Empty, Error, and Success states
- [ ] Consolidate Modal, Drawer, ConfirmDialog, DetailPanel, Tabs, Pagination, Timeline, and StickyActionBar
- [ ] Create responsive FilterBar and mobile filter drawer
- [ ] Create FilePreview and secure-download feedback primitives
- [ ] Remove duplicate Admin primitive implementations
- [ ] Add component tests for critical primitives

## ADMIN-SYSTEM-002 Motion and interaction

- [ ] Create motion duration, easing, distance, and reduced-motion tokens
- [ ] Keep CSS for hover, focus, press, skeleton, and simple transitions
- [ ] Use `motion` only for modal, drawer, toast, list, step, and detail-panel enter/exit
- [ ] Limit pulse animation to active incidents, genuinely live status, and high-risk alerts
- [ ] Prevent layout shift during queue/detail transitions
- [ ] Restore focus after modal/drawer close
- [ ] Test reduced motion and keyboard-only interactions
- [ ] Verify animation performance on iPhone-class mobile viewports
- [ ] Apply `docs/UI_MOTION_ANIMATION_CONTRACT.md` to sidebar/drawer, queue/detail, review actions, risk alerts, charts, notices, and table-to-card transitions
- [ ] Restrict infinite pulse to explicitly live high-risk alerts; use one-time highlight for normal updates
- [ ] Retain reduced-motion, focus, CLS, slow-device, and duplicate-request evidence for animated Admin surfaces

## ADMIN-SYSTEM-003 Forms and validation

- [ ] Create shared RHF/Zod field adapters if the tooling decision is approved
- [ ] Create server-error-code mapping without parsing raw messages
- [ ] Create focus-first-error and validation-summary behavior
- [ ] Create dirty-state and unsaved-change behavior
- [ ] Require reason fields for reject, hold, override, adjustment, and destructive actions
- [ ] Prevent duplicate submit and show mutation progress
- [ ] Add form component and browser regression tests

## ADMIN-SYSTEM-004 Server state

- [ ] Create an Admin QueryClient and auth-aware provider if TanStack Query is approved
- [ ] Define query-key factories by domain
- [ ] Define stale time, retry, cancellation, invalidation, and polling policies
- [ ] Handle session expiry and permission changes centrally
- [ ] Handle optimistic rollback and version conflicts centrally
- [ ] Migrate page-level `useEffect + useState + fetch` orchestration by domain

## ADMIN-SYSTEM-005 Data table

- [ ] Create `AdminDataTable` if TanStack Table is approved
- [ ] Support sorting, filtering, pagination, URL state, column visibility, and column priority
- [ ] Support row selection, bulk actions, sticky action bar, and partial-failure feedback
- [ ] Support loading, empty, error, partial, stale, and retry states
- [ ] Provide mobile table-to-card fallback
- [ ] Preserve permissions, masking, and audit semantics

# A2: Admin route worklist

## ADMIN-ROUTE-001 Authentication and security

- [ ] Login loading, error, lockout, 2FA, recovery, and session-expired states
- [ ] Password manager, autofill, Caps Lock, keyboard, and focus behavior
- [ ] Owner transfer and last-owner protection UX
- [ ] Session list, revoke one, revoke all, current-device marker, and login history
- [ ] Responsive and accessibility regression

## ADMIN-ROUTE-002 Dashboard

- [ ] Loading skeleton and partial-widget failure
- [ ] Retry per widget without full-page flash
- [ ] Stale timestamp and metric definitions
- [ ] Permission-hidden widgets
- [ ] Accessible chart summaries
- [ ] Six-viewport visual regression
- [ ] Match the Admin Dashboard & Operations reference: KPI tiles, business trend chart, risk/alert panel, action center, system health, queue, case detail, and mobile summary ordering

## ADMIN-ROUTE-003 Deposits and withdrawals

- [ ] Queue filters, saved URL state, pagination, and claim ownership
- [ ] Slip/proof preview with secure loading and failure handling
- [ ] Approve, reject, release, complete, and retry confirmations
- [ ] Mandatory reason and audit summary
- [ ] Duplicate action and version-conflict recovery
- [ ] Mobile card layout and sticky actions
- [ ] Seeded data correctness and authenticated browser regression
- [ ] Match the Admin Review Flow reference for top-up and withdrawal review, including evidence panel, risk signals, mandatory reason, conflict state, audit summary, and sticky actions

## ADMIN-ROUTE-004 Members, wallets, ledgers, and bank accounts

- [ ] Member search, status filters, detail panel, and masked sensitive values
- [ ] Wallet and ledger summaries with tabular numbers
- [ ] Bank duplicate warning and verification evidence
- [ ] Safe status, freeze, adjustment, and release actions
- [ ] CSV/export progress and error states
- [ ] Long-value, mobile, and permission regression
- [ ] Match the Admin Review Flow reference for member detail and bank-account review, including masked values, status treatment, tabs, risk signals, and responsive fallback

## ADMIN-ROUTE-005 Risk and watchlist

- [ ] Severity/status taxonomy and high-risk treatment
- [ ] Queue filters, bulk actions, linked member/transaction navigation
- [ ] Auto-close suggestion explanation
- [ ] Watchlist create, release, override, and mandatory reason flows
- [ ] Masked identifier policy and audit timeline
- [ ] Conflict recovery and mobile card layout
- [ ] Match risk severity colors, alert timeline, linked member/transaction context, and high-risk action treatment from the Admin Finance, Risk & Reports reference

## ADMIN-ROUTE-006 KYC

- [ ] Split queue, filter, case detail, document list, preview, and review actions
- [ ] Search, risk, date, status, and sort filters
- [ ] Secure document preview/download progress and errors
- [ ] Separate case note from document note
- [ ] Mandatory rejection reason and confirm dialog
- [ ] Version-conflict recovery and permission-disabled states
- [ ] Two-pane desktop to stacked/drawer mobile behavior
- [ ] Keyboard focus management and authenticated regression

## ADMIN-ROUTE-007 Reports and activity

- [ ] Date-range, filter chips, clear-all, URL state, and saved views
- [ ] Dense table hierarchy, sticky header, and row details
- [ ] JSON expand/copy and invalid-JSON fallback
- [ ] CSV export progress, errors, no-data, and large-result warning
- [ ] Seeded correctness and mobile regression
- [ ] Match the Admin Finance, Risk & Reports reference for wallet overview, ledger, report builder, analytics charts, exports, and mobile card fallback

## ADMIN-ROUTE-008 Settings, CMS, promotions, and providers

- [ ] Section navigation, dirty state, save/reset, validation summary
- [ ] Asset upload, preview, broken-media fallback, and secure lifecycle feedback
- [ ] Draft/published state, schedule timezone, preview, and version history
- [ ] Provider setup, test-connection, credential masking, and re-auth
- [ ] Permission-aware controls and compatibility matrix
- [ ] Authenticated visual and functional regression
- [ ] Match the Admin Providers, Marketing & Settings reference for provider tables, transfers/reconciliation, promotions, KYC, support, settings, security, roles, and audit log

## ADMIN-ROUTE-009 Support and operations

- [ ] Ticket queue filters, priority, SLA, assignee, and search
- [ ] Conversation timeline and attachment states
- [ ] Reply pending/sent/failed feedback
- [ ] Linked member, finance, provider, and risk context
- [ ] Resolve/reopen confirmation and audit
- [ ] Long-thread performance and mobile composer behavior

# A3: Accessibility and QA

## ADMIN-QA-001 Accessibility automation

- [ ] Add `@axe-core/playwright` if approved
- [ ] Fail CI on critical accessibility violations
- [ ] Verify headings, labels, ARIA live regions, dialogs, drawers, tables, and icon-only buttons
- [ ] Verify keyboard navigation, focus trap, focus restore, zoom, reflow, contrast, and reduced motion

## ADMIN-QA-002 Visual and interaction evidence

- [ ] Add authenticated Admin fixtures with non-production credentials
- [ ] Cover all six standard viewports
- [ ] Cover loading, empty, error, partial, stale, conflict, permission, success, and session-expired states
- [ ] Store screenshot, trace, console, and network artifacts in CI
- [ ] Fail on browser console and unexpected network errors
- [ ] Use `docs/UI_DESIGN_REFERENCE.md` as the visual parity gate and retain approved baselines for every Admin reference board

# Execution order

1. ADMIN-FOUNDATION-001 debt inventory
2. ADMIN-SYSTEM-001 primitives and tokens
3. ADMIN-SYSTEM-003 forms plus ADMIN-SYSTEM-004 server state
4. ADMIN-SYSTEM-005 data table
5. Finance, Members, Risk, and KYC routes
6. Reports, Settings/CMS, Providers, Support, and Operations
7. Motion polish after behavior and layout are stable
8. Accessibility, visual regression, bundle review, and cleanup

# Evidence log

- Commit/PR:
- Build:
- Visual artifact:
- Accessibility artifact:
- Bundle report:
- Remaining blockers:
