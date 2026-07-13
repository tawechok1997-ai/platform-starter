# UX/UI Master Worklist

Updated: 2026-07-13  
Source of truth: current repository state on `main`

This document is the execution-ready source of truth for UX/UI modernization across Member Web, Admin Web, and Public/Auth. It replaces overlapping backlog language with one prioritized worklist. Completed capabilities remain documented below, but only items in the active queues should be picked up as new work.

## Status legend

- ✅ Done and verified at the latest confirmed checkpoint
- 🧪 Implemented; regression evidence still required
- 🚧 In progress
- ⏳ Planned
- ⛔ Blocked by an external decision
- 🧊 Deferred; not part of the active queue

## Execution rules

1. Work in priority order: P0 → P1 → P2.
2. Pick only tasks whose dependencies are complete.
3. Run related build, smoke, and regression checks before marking a task done.
4. Record evidence in the task: commit, PR, test command, screenshot/artifact, or deployment URL.
5. Do not create duplicate responsive routes, API calls, validation, permissions, finance logic, provider logic, or settings state.
6. Do not use `pnpm prisma db push --force-reset`.
7. Do not deploy, migrate production data, rotate secrets, or enable paid services without an explicit decision.
8. Parallel work is allowed only when tasks do not touch the same shared shell, token layer, schema, or finance workflow.
9. A task may move from 🧪 to ✅ only after its verification checklist passes.

## Standard viewports

- 360×800
- 390×844
- 430×932
- 768×1024
- 1024×768
- 1440×900

## Definition of done

A route or surface is complete only when all applicable checks pass:

- Uses the existing real API, authentication, permissions, settings, storage, audit, finance, and provider behavior.
- Uses shared types and UI primitives, or documents a justified exception.
- Handles loading, empty, error, disabled, success, permission, conflict, maintenance, stale-data, and retry states where applicable.
- Works at all six standard viewport sizes.
- Supports keyboard navigation, visible focus, reduced motion, and 200% zoom.
- Does not overflow with long Thai text, long IDs, long money values, or missing/oversized media.
- Keeps critical actions reachable above the mobile safe area.
- Does not require hover-only interaction or critical horizontal scrolling.
- Preserves idempotency, claims, locks, retries, deep links, pagination, filters, and error semantics.
- Passes the relevant build, smoke, and regression checks.
- Records evidence in this worklist or the UX regression matrix.

# Active execution queue

## P0: Verification, CI, and production safety

### P0-UX-001: Generate first six-viewport Public/Auth baseline

- Status: 🧪
- Scope: `apps/web-member`, Public/Auth routes
- Routes: Login, Register, Maintenance, Session Expired, Legal, Contact
- Depends on: existing Playwright visual configuration ✅
- Parallel safe: No; establishes the visual baseline used by later fixes
- Verification:
  - `pnpm test:e2e:visual:update`
  - review all generated screenshots at six standard viewports
  - confirm no secret or production account is captured
- Evidence:
  - Commit:
  - Artifact:
  - Reviewed by/date:

### P0-UX-002: Review visual diffs and fix blocking regressions

- Status: ⏳
- Scope: Public/Auth layouts and shared styles touched by P0-UX-001
- Depends on: P0-UX-001
- Parallel safe: No
- Required checks:
  - overflow
  - keyboard focus and tab order
  - autofill
  - mobile keyboard overlap
  - safe-area controls
  - 200% zoom
  - long Thai text
- Verification:
  - `pnpm test:e2e:visual`
  - relevant web build
- Evidence:
  - Commit:
  - Test result:
  - Remaining intentional diffs:

### P0-OPS-001: Run safe Railway route smoke

- Status: 🧪
- Scope: deployed API, Admin Web, and Member Web
- Depends on: valid non-production or approved test credentials
- Parallel safe: Yes, unless another deployment is in progress
- Verification:
  - `pnpm test:e2e:smoke`
  - API health and version checks
  - no destructive money or settings actions
- Evidence:
  - Environment:
  - Run URL/artifact:
  - Result/date:

### P0-QA-001: Record regression results

- Status: ⏳
- Scope: `docs/ux-regression-matrix-finance-operations.md`
- Depends on: P0-UX-001, P0-UX-002, P0-OPS-001
- Parallel safe: No
- Verification:
  - every tested route/state/viewport has a result
  - unresolved issues link to a task, issue, or commit
- Evidence:
  - Commit:

### P0-CI-001: Reconcile open CI alert issues

- Status: ⏳
- Scope: GitHub Issues #14, #15, #17, #19
- Depends on: latest workflow status for each referenced branch/commit
- Parallel safe: Yes
- Actions:
  - confirm whether each alert still reproduces
  - close stale alerts with evidence
  - create or link a repair task for active failures
- Verification:
  - latest build/smoke status recorded on each issue
- Evidence:
  - Issue comments/closures:

## P1: Active product completion

### P1-QA-001: Add authenticated visual coverage

- Status: ⏳
- Scope: Member and Admin authenticated routes
- Depends on: safe seeded non-production accounts, P0 baseline complete
- Parallel safe: No; touches shared visual test fixtures
- Minimum routes:
  - Admin Dashboard, Reports, Activity, Risk, Deposits, Withdrawals, Wallets, Ledgers, Providers, Games, Support, Settings
  - Member Home, Deposit, Withdraw, Transactions, Bank Accounts, Games Lobby, Profile
- Verification:
  - `pnpm test:e2e:visual:update`
  - `pnpm test:e2e:visual`
  - seeded credentials excluded from artifacts and logs
- Evidence:
  - Commit:
  - Artifact:

### P1-ADMIN-001: Dashboard loading and retry states

- Status: ⏳
- Scope: `apps/web-admin`
- Routes: Admin Dashboard
- Depends on: existing responsive dashboard ✅
- Parallel safe: Yes, unless shared skeleton primitives are being changed
- Required states:
  - loading skeleton
  - partial error
  - retry
  - stale data
  - permission-hidden widgets
- Verification:
  - `pnpm build:web-admin`
  - authenticated visual regression
- Evidence:
  - Commit:
  - Screenshots:

### P1-ADMIN-002: Reports, Activity, Risk, and Security density pass

- Status: ⏳
- Scope: `apps/web-admin`
- Depends on: shared Admin shell ✅
- Parallel safe: Partially; split by route only when shared primitives are unchanged
- Required outcomes:
  - consistent hierarchy
  - responsive filters
  - readable dense data
  - no critical horizontal scrolling on mobile
  - long ID and Thai text handling
- Verification:
  - `pnpm build:web-admin`
  - authenticated visual regression
- Evidence:
  - Commit/PR:

### P1-ADMIN-003: Admin Settings migration and compatibility audit

- Status: ⏳
- Scope: Admin Settings and every consuming surface
- Depends on: record current setting keys and consumers first
- Parallel safe: No
- Required outcomes:
  - preserve branding, navigation, content, feature flags, maintenance, finance, provider, security, and notification settings
  - mask and permission-protect secrets
  - safe fallback for missing/invalid settings
  - runtime updates continue working where currently supported
- Verification:
  - before/after setting compatibility matrix
  - `pnpm build:web-admin`
  - `pnpm build:web-member`
  - relevant smoke and visual tests
- Evidence:
  - Commit/PR:
  - Compatibility matrix:

### P1-MEMBER-001: Games Lobby full pass

- Status: ⏳
- Scope: `apps/web-member`
- Depends on: existing settings/provider/game APIs
- Parallel safe: Yes, unless shared Member shell or tokens are changed
- Required outcomes:
  - featured and recently played
  - categories, provider filters, search, favorites
  - maintenance/provider-down states
  - stable image fallbacks
  - Admin-managed ordering/content where backend support exists
- Verification:
  - `pnpm build:web-member`
  - authenticated visual regression
- Evidence:
  - Commit/PR:

### P1-MEMBER-002: Promotions and Bonus surfaces

- Status: ⏳
- Scope: `apps/web-member`
- Depends on: real promotion/bonus APIs and settings
- Parallel safe: Yes
- Verification:
  - loading, empty, active, expired, ineligible, error states
  - `pnpm build:web-member`
- Evidence:
  - Commit/PR:

### P1-MEMBER-003: Profile and Security surfaces

- Status: ⏳
- Scope: `apps/web-member`
- Depends on: existing auth/security APIs
- Parallel safe: No when auth/session primitives are touched
- Verification:
  - session, validation, permission, retry, and success states
  - keyboard-only and 200% zoom
  - `pnpm build:web-member`
- Evidence:
  - Commit/PR:

### P1-MEMBER-004: Notifications, Support, and FAQ search

- Status: ⏳
- Scope: `apps/web-member`
- Depends on: backend support for each visible action
- Parallel safe: Yes by feature area
- Verification:
  - real API integration
  - empty/error/retry states
  - long Thai text
  - `pnpm build:web-member`
- Evidence:
  - Commit/PR:

### P1-ADMIN-004: Member detail panel and safe bulk actions

- Status: ⏳
- Scope: Admin Members
- Depends on: existing member management ✅
- Parallel safe: No when member state/actions are shared
- Notes:
  - detail side panel is required
  - bulk actions remain optional until each action has explicit permission, confirmation, audit, partial-failure, and retry behavior
- Verification:
  - `pnpm build:web-admin`
  - long-value and status-update regression
- Evidence:
  - Commit/PR:

### P1-ADMIN-005: Ledger export actions

- Status: ⏳
- Scope: Admin Wallet Ledgers / Transactions
- Depends on: supported export endpoint
- Parallel safe: Yes
- Block rule: do not create a duplicate export API only for the UI
- Verification:
  - permission, loading, empty, error, large-result, and CSV content checks
- Evidence:
  - Commit/PR:

## P2: Polish, performance, and optional enhancements

### P2-PERF-001: Performance UX pass

- Status: ⏳
- Scope: Member, Admin, Public/Auth
- Depends on: P1 route ownership stabilized
- Parallel safe: Partially
- Required outcomes:
  - shared skeleton variants
  - stale-request cancellation
  - stable media sizing
  - no layout shift from feedback
  - reduced blur for low-power/mobile contexts
- Verification:
  - relevant builds
  - visual regression
  - route-level performance notes
- Evidence:
  - Commit/PR:

### P2-UI-001: Complete shared component consolidation

- Status: 🚧
- Scope: shared Admin and Member primitives
- Depends on: active P1 work must not be editing the same primitives
- Parallel safe: No
- Remaining outcomes:
  - reduce legacy inline styles
  - consolidate duplicate Admin primitives
  - complete variants for Button, Input, Select, Table, Card, Metric, Badge, Modal, Drawer, Toast, Tabs, Skeleton, Empty, Error, and Success
- Verification:
  - no behavior regression
  - Admin and Member builds
- Evidence:
  - Commit/PR:

### P2-UI-002: Motion and interaction system

- Status: ⏳
- Scope: shared tokens and UI primitives
- Depends on: P2-UI-001
- Parallel safe: No
- Required outcomes:
  - motion duration/easing tokens
  - hover, press, focus, drawer, modal, toast, skeleton, list, and chart transitions
  - `prefers-reduced-motion` support
  - no distracting motion on money, risk, or security actions
- Verification:
  - keyboard and reduced-motion review
  - visual regression
- Evidence:
  - Commit/PR:

### P2-ADMIN-001: Command palette and keyboard shortcuts

- Status: ⏳
- Scope: Admin shell
- Depends on: permission-aware navigation ✅
- Parallel safe: No when shell/navigation are being edited
- Verification:
  - permission filtering
  - keyboard conflict audit
  - accessible open/close/focus behavior
- Evidence:
  - Commit/PR:

### P2-MEMBER-001: Optional desktop transaction table mode

- Status: 🧊
- Scope: Member Transactions
- Depends on: product decision that table mode improves the desktop workflow
- Parallel safe: Yes
- Verification:
  - preserves the same ledger data and filters
  - no duplicated transaction state
- Evidence:
  - Decision/commit:

### P2-MEMBER-002: Bank account edit/replace workflow

- Status: ⛔
- Scope: Member Bank Accounts
- Depends on: confirmed backend support and security rules
- Parallel safe: No
- Block rule: do not simulate edit/replace with local-only state
- Evidence:
  - Backend decision:

### P2-THEME-001: Additional themes and density preferences

- Status: 🧊
- Scope: Admin and Member settings
- Depends on: confirmed product support and storage model
- Required options only where exposed by product settings:
  - dark
  - dim
  - light
  - high contrast
  - density
  - reduced motion
  - reduced blur
- Evidence:
  - Product decision:

## Blocked external decisions

### BLOCK-DEPLOY-001: Select Vercel target app

- Status: ⛔
- Decision required: choose `web-member` or `web-admin`
- Rule: do not guess or configure Vercel before the target is explicit
- Evidence:
  - Decision/date:

# Verified current capabilities

These are not active tasks. They are retained to prevent duplicate implementation.

## Member Web

- ✅ Shared design tokens and Member primitives
- ✅ Mobile and desktop stylesheets
- ✅ Shared navigation and route access configuration
- ✅ Typed site settings provider
- ✅ Member session provider
- ✅ Shared Member API helper and response types
- ✅ Shared finance flow components
- ✅ Responsive Member Home compositions
- ✅ Wallet, pending, announcements, categories, game rails, FAQ, and activity zones
- ✅ Mobile and desktop Login/Register layouts
- ✅ Guided registration, referral, validation, password feedback, and legal/contact/maintenance states
- ✅ Deposit flow, slip preview, confirmation, responsive composition, step indicator, and accessible dialog
- ✅ Withdraw flow, turnover blocking, wallet/bank loading, responsive composition, step indicator, and accessible dialog
- ✅ Responsive Transactions and Bank Accounts
- ✅ Ledger summaries, before/after balance, account masking, and Thai status labels

## Admin Web

- ✅ Mobile and desktop stylesheets
- ✅ Shared Admin UI primitives
- ✅ Responsive operations stylesheet
- ✅ Accessible shared confirmation dialog
- ✅ SVG icon system
- ✅ Permission-aware collapsible sidebar and navigation search
- ✅ Responsive topbar and mobile drawer behavior
- ✅ Responsive Admin sign-in
- ✅ Responsive Dashboard with KPIs, queues, risk alerts, recent ledger, and quick actions
- ✅ Top-up claim/release/approve/reject flow, private slip loading, responsive review layouts, sticky mobile actions, and audit timeline
- ✅ Withdrawal claim/release/complete/reject flow, responsive review layouts, sticky mobile actions, and risk/account summaries
- ✅ Member search, status filters, pagination, mobile cards, desktop split layout, wallet summary, and quick status actions
- ✅ Wallet ledger endpoint, search/direction filters, responsive cards, money summaries, and metadata details

## Accessibility and responsive foundations

- ✅ Visible focus styles
- ✅ Minimum 44px touch targets
- ✅ Reduced-motion handling
- ✅ Auth field error association
- ✅ Dialog focus trap, focus return, Escape handling, scroll lock, and loading dismissal protection
- ✅ Six-viewport Playwright visual configuration
- ✅ Public/Auth route coverage exists
- ✅ Playwright smoke suite exists

## Latest confirmed build/deployment checkpoint

- ✅ API build passing on Railway
- ✅ Admin build passing on Railway
- ✅ Member build passing on Railway
- 🧪 API smoke previously reported passing; rerun evidence is required in P0-OPS-001
- 🧪 E2E smoke previously reported passing; rerun evidence is required in P0-OPS-001

# Verification backlog by capability

Use this section as test coverage, not as duplicate feature work.

## Member verification

- 🧪 Home at six viewports and authenticated states
- 🧪 Login/Register autofill, keyboard overlap, safe area, and 200% zoom
- 🧪 Deposit submit, retry, invalid file, waiting, and confirmation behavior
- 🧪 Withdraw turnover block, insufficient balance, waiting, and confirmation behavior
- 🧪 Transactions and Bank Accounts long values and empty states

## Admin verification

- 🧪 Dashboard mobile density and wide desktop
- 🧪 Top-up claim conflict, missing slip, approve, and reject
- 🧪 Withdrawal claim, release, complete, and reject
- 🧪 Members long values and status updates
- 🧪 Wallet Ledgers long references, idempotency values, and 100-item rendering

## Cross-product verification

- 🧪 Semantic heading audit
- 🧪 ARIA labels outside shared dialogs/auth
- 🧪 Dynamic brand-color contrast
- 🧪 Long Thai text
- 🧪 Landscape
- 🧪 200% zoom
- 🧪 Keyboard-only operation
- 🧪 Post-deploy route verification
- 🧪 Admin-configurable values before/after redesign
- 🧪 Feature-disabled, permission-denied, provider-down, maintenance, partial-settings, and invalid-media states

# Suggested automation prompt

Use this worklist as the only UX/UI execution source. Start with the first unblocked P0 task. Verify repository state before editing. After each task, run the listed checks, record evidence, update the task status, commit the change, and continue to the next unblocked task. Skip blocked tasks and report the missing decision. Do not duplicate existing routes, APIs, state, validation, permissions, finance logic, provider logic, or settings behavior.
