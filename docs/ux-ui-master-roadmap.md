# UX/UI Master Roadmap

Updated: 2026-07-10

This document is the current source of truth for UX/UI modernization across Member Web, Admin Web and Public/Auth.

## Status legend

- ✅ Done
- 🧪 Implemented, regression verification still required
- 🚧 In progress
- ⏳ Planned
- ⛔ Blocked by an external decision

## Standard viewports

- 360×800
- 390×844
- 430×932
- 768×1024
- 1024×768
- 1440×900

## Safety rules

- Mobile and desktop must share API, state, validation and money logic.
- Do not duplicate finance behavior between layouts.
- Do not use `pnpm prisma db push --force-reset`.
- Sensitive actions require confirmation and keyboard-safe dialogs.
- Touch targets must be at least 44px.
- Fixed controls must respect safe-area insets.
- A route is not complete until loading, empty, error, disabled and success states are covered where applicable.

# Group 1: Member Web

## Shared foundations

- ✅ Design tokens and shared member primitives
- ✅ Mobile and desktop stylesheets
- ✅ Shared navigation and route access configuration
- ✅ Typed site settings provider
- ✅ Member session provider
- ✅ Shared member API helper and response types
- ✅ Shared finance flow components

## Home

- ✅ Mobile composition
- ✅ Desktop 12-column composition
- ✅ Wallet, pending, announcements, categories, game rails, FAQ and activity zones
- 🧪 Six-viewport state verification
- ⏳ Screenshot baseline for authenticated states

## Login and Register

- ✅ Mobile and desktop auth layouts
- ✅ Safe-area handling
- ✅ Password visibility controls
- ✅ Feature-flag and maintenance states
- ✅ Referral flow
- ✅ Field-level validation
- ✅ Error summary and input association
- ✅ Password rules and progress feedback
- ✅ Public maintenance and session-expired pages
- ✅ Public legal and contact pages
- 🧪 Autofill, keyboard overlap and 200% zoom verification

## Deposit

- ✅ Existing select → transfer → waiting flow retained
- ✅ Slip upload and preview retained
- ✅ Confirmation dialog retained
- ✅ Shared classes/components refactor
- ✅ Mobile sticky action treatment
- ✅ Desktop form and summary composition
- ✅ Shared response types
- ✅ Step indicator
- ✅ Accessible confirm dialog with focus trap, Escape and focus return
- 🧪 Full submit, retry, invalid-file and waiting-state regression

## Withdraw

- ✅ Existing account → amount → confirm → waiting flow retained
- ✅ Bonus-turnover blocking retained
- ✅ Wallet and bank-account loading retained
- ✅ Shared classes/components refactor
- ✅ Mobile sticky action treatment
- ✅ Desktop wallet summary and form composition
- ✅ Shared withdrawal, wallet, bank and bonus types
- ✅ Step indicator and amount guidance
- ✅ Accessible confirm dialog with focus trap, Escape and focus return
- 🧪 Full submit, bonus-block, insufficient-balance and waiting-state regression

## Transactions and Bank Accounts

- ✅ Responsive transaction layout
- ✅ Shared ledger type and summaries
- ✅ Before/after balance display
- ✅ Responsive bank-account layout
- ✅ Account masking and Thai status labels
- 🧪 Long-value and empty-state verification
- ⏳ Optional desktop table mode
- ⏳ Bank edit/replace workflow where backend support exists

## Remaining member product areas

- ⏳ Games lobby full pass
- ⏳ Promotions and bonus cards
- ⏳ Profile and security pages
- ⏳ Notifications
- ⏳ Support tickets and FAQ search

# Group 2: Admin Web

## Shared foundations

- ✅ Admin mobile and desktop stylesheets
- ✅ Shared admin UI primitives
- ✅ Responsive operations stylesheet
- ✅ Accessible shared confirm dialog
- ✅ Professional SVG icon system for shell and navigation
- ✅ Persistent collapsible desktop sidebar with permission-aware search
- ✅ Responsive Admin topbar, mobile drawer scroll lock and Escape handling
- 🚧 Continue reducing inline styles in legacy pages

## Dashboard

- ✅ Responsive dashboard composition
- ✅ KPI, queues, risk alerts, recent ledger and quick actions
- 🧪 Mobile density and wide-desktop verification
- ⏳ Skeleton and retry states

## Top-up Queue

- ✅ Claim/release/approve/reject flow retained
- ✅ Private slip loading retained
- ✅ Confirmation dialog retained
- ✅ Mobile queue-card layout
- ✅ Desktop review split layout
- ✅ Sticky mobile review actions
- ✅ Audit timeline presentation
- ✅ Reduced inline styles
- 🧪 Claim conflict, missing slip, approve and reject regression

## Withdrawal Queue

- ✅ Existing operation flow retained
- ✅ Mobile queue-card layout
- ✅ Desktop review split layout
- ✅ Sticky mobile review actions
- ✅ Risk and account verification summary
- ✅ Reduced inline styles
- 🧪 Claim/release/complete/reject regression

## Members

- ✅ Existing member management retained
- ✅ Search, status filter and pagination
- ✅ Mobile cards
- ✅ Tablet/desktop split layout
- ✅ Wallet summary and quick status actions
- 🧪 Long-value and status-update regression
- ⏳ Detail side panel
- ⏳ Safe bulk actions where justified

## Wallet Ledgers / Transactions

- ✅ Existing ledger endpoint retained
- ✅ Search and direction filter
- ✅ Mobile cards
- ✅ Desktop money summary
- ✅ Before/amount/after presentation
- ✅ Responsive metadata details
- 🧪 Long reference/idempotency values and 100-item rendering
- ⏳ Export actions where supported

## Remaining admin areas

- ⏳ Reports, activity, risk and security density pass
- ⏳ Admin settings migration
- ✅ Collapsible sidebar and navigation search
- ⏳ Command palette and keyboard shortcuts

# Group 3: Accessibility and Responsive Quality

## Completed

- ✅ Visible focus styles
- ✅ Minimum touch targets
- ✅ Reduced-motion handling
- ✅ Auth field error association
- ✅ Admin modal focus trap and focus return
- ✅ Finance modal focus trap and focus return
- ✅ Escape-to-close behavior for shared dialogs
- ✅ Body scroll locking while dialogs are open
- ✅ Loading-state protection against accidental dialog dismissal

## Verification still required

- 🧪 Semantic heading audit
- 🧪 ARIA labeling audit outside shared dialogs/auth
- 🧪 Dynamic brand-color contrast audit
- 🧪 Long Thai text review
- 🧪 Landscape review
- 🧪 200% zoom review

# Group 4: Quality Gate

## Builds and deployment

- ✅ API build passing on Railway
- ✅ Admin build passing on Railway
- ✅ Member build passing on Railway
- ⛔ Vercel target app is not defined; do not guess between `web-member` and `web-admin`

## Automated browser checks

- ✅ Existing Playwright smoke suite
- ✅ Six-viewport visual regression configuration
- ✅ Public/Auth visual coverage for Login, Register, Maintenance, Session Expired, Legal and Contact
- ✅ Commands:
  - `pnpm test:e2e:smoke`
  - `pnpm test:e2e:visual:update`
  - `pnpm test:e2e:visual`
- 🧪 Generate and review first screenshot baseline
- 🧪 Add authenticated Member/Admin screenshot coverage with safe seeded accounts

## Manual regression required

- 🧪 Deposit submit/retry/error/waiting states
- 🧪 Withdraw bonus-block/insufficient-balance/waiting states
- 🧪 Admin top-up and withdrawal money actions
- 🧪 Members and wallet-ledger long-value layouts
- 🧪 Keyboard-only and 200% zoom pass
- 🧪 Post-deploy route verification

# Current execution queue

## Now

1. 🧪 Generate the first six-viewport public/auth screenshot baseline.
2. 🧪 Review diffs and fix any overflow or keyboard-accessibility failures.
3. 🧪 Run safe route smoke against Railway deployments.
4. 🧪 Record results in `docs/ux-regression-matrix-finance-operations.md`.

## Next

1. ⏳ Add authenticated visual coverage using non-production seeded accounts.
2. ⏳ Games, Promotions, Profile, Notifications and Support passes.
3. ⏳ Admin Settings migration.
4. ⏳ Performance UX pass: skeletons, stale-request cancellation and stable image sizing.
5. ⛔ Configure Vercel only after the deployment target app is explicitly chosen.

# Definition of done

A route is complete only when all applicable items are true:

- Uses shared types where available.
- Uses shared UI primitives or a documented exception.
- Has no unnecessary duplicated inline styles.
- Works at all six standard viewport sizes.
- Handles loading, empty, error, disabled and success states.
- Supports keyboard navigation and visible focus.
- Does not overflow with long Thai content.
- Keeps critical actions reachable above the mobile safe area.
- Preserves API and business behavior.
- Passes build and relevant smoke/regression checks.


# Market-Standard UX/UI Direction

This section is the newest cross-product UX/UI requirement. It applies to both PC and mobile and supersedes overlapping older presentation notes.

## Product quality bar

- [ ] Make the product feel like a credible market-ready gaming and fintech platform, not a collection of template pages.
- [ ] Keep the interface professional, calm, readable, and operationally safe.
- [ ] Use one coherent visual language across Member, Admin, Public, and Auth surfaces.
- [ ] Prefer clear hierarchy and fast task completion over decorative density.
- [ ] Use motion to explain state and hierarchy; never use motion that distracts from money, risk, or security actions.

## Responsive product model

- [ ] Design Desktop, Tablet, and Mobile as deliberate presentations of the same product, not a desktop layout that is merely compressed.
- [ ] Preserve the same API, state, validation, permissions, and money logic across breakpoints.
- [ ] Desktop: dense operations, sidebar navigation, tables, split panes, hover affordances, keyboard shortcuts, and detail drawers.
- [ ] Tablet: collapsible navigation, two-column summaries, touch-safe controls, responsive charts, and full-height detail panels.
- [ ] Mobile: prioritized single-column content, bottom/compact navigation, card lists, full-screen filters, action sheets, sticky safe-area actions, and no critical horizontal scrolling.
- [ ] Verify 360×800, 390×844, 430×932, 768×1024, 1024×768, and 1440×900.

## Shared design system

- [ ] Create one shared token layer for color, typography, spacing, radius, border, shadow, blur, elevation, motion, and semantic status.
- [ ] Use a deliberate Thai/English typography system with defined weights, line heights, control sizes, and long-text behavior.
- [ ] Standardize iconography through one icon wrapper and remove emoji/glyphs as primary UI icons.
- [ ] Consolidate duplicate Admin primitives and reduce unnecessary inline styles.
- [ ] Define Button, Input, Select, Table, Card, Metric, Badge, Modal, Drawer, Toast, Tabs, Skeleton, Empty, Error, and Success variants.
- [ ] Support dark, dim, light, and high-contrast themes where the product settings expose them.
- [ ] Keep glass, gradient, glow, and blur restrained; never use them on dense tables or detailed audit content when they reduce readability.

## Admin market-ready surfaces

- [ ] Redesign the Admin shell with grouped sidebar, collapsible/icon mode, top command bar, global search, notifications, system health, environment badge, and profile menu.
- [ ] Add permission-aware navigation, command palette, breadcrumbs, pinned/recent pages, and clear access-denied states.
- [ ] Redesign Dashboard as an operations command center with KPIs, trends, money flow, queue aging, risk summary, and provider health.
- [ ] Add shared production tables with filters, sorting, pagination, row density, saved views, expandable rows, and detail drawers.
- [ ] Present desktop queue operations as tables/split panes and mobile queue operations as card lists/action sheets.
- [ ] Give Reports, Activity, Risk, Security, Providers, Games, Members, Wallets, Ledgers, Support, and Settings a consistent information hierarchy.
- [ ] Add loading skeleton, empty, partial-error, retry, stale-data, disabled, permission-hidden, and success states to every major surface.

## Member market-ready surfaces

- [ ] Redesign Member Home with clear wallet/pending state, featured content, recent activity, and focused primary actions.
- [ ] Complete the Games Lobby with featured games, recently played, categories, provider filters, search, favorites, maintenance states, and stable image fallbacks.
- [ ] Make Deposit and Withdraw flows feel like secure fintech workflows with progress, review, confirmation, evidence, waiting, retry, and failure states.
- [ ] Complete Promotions/Bonus, Profile/Security, Notifications, Transactions, Bank Accounts, Support, and FAQ using the same design system.
- [ ] Use premium but restrained visual media; avoid clutter, excessive badges, and competing calls to action.

## Motion and interaction system

- [ ] Define motion tokens for duration, easing, enter/exit, hover, press, drawer, modal, toast, skeleton, list update, and chart reveal.
- [ ] Add page/section reveal only where it supports orientation.
- [ ] Add tactile button hover/press/focus states with keyboard-visible focus.
- [ ] Add drawer/modal transitions, toast feedback, skeleton shimmer, KPI count-up, chart reveal, and list insertion/removal transitions.
- [ ] Add success/error feedback without blocking the user or causing layout shift.
- [ ] Disable or reduce animation under `prefers-reduced-motion` and reduce blur on low-power/mobile contexts.

## Quality gate

- [ ] No route is complete until loading, empty, error, disabled, success, long-text, long-number, permission, and maintenance states are reviewed.
- [ ] No page is complete until desktop, tablet, and mobile screenshots are reviewed.
- [ ] No critical action requires horizontal scrolling or hover-only interaction.
- [ ] No duplicated route, API, state, validation, permission, finance, or provider logic is introduced for responsive presentation.
- [ ] Run authenticated visual regression for Dashboard, Reports, Activity, Risk, Deposits, Withdrawals, Wallets, Ledgers, Providers, Games, Support, Settings, Login, Register, Member Home, Games Lobby, Profile, and Finance flows.
- [ ] Record intentional deviations and unresolved visual issues in the UX regression matrix.

## Delivery order

1. Shared tokens, typography, icon system, and component consolidation.
2. Responsive Admin and Member shells.
3. Admin Dashboard and operations table/detail system.
4. Member Home, Games Lobby, and finance flows.
5. Reports, Risk, Security, Providers, Support, Settings, and content surfaces.
6. Motion, accessibility, themes, density, and visual regression across all routes.


## Real-system integration and Admin configurability

These requirements are mandatory for every redesign and supersede any visual-only or mock-data implementation.

### Real integration

- [ ] Every page reads and writes through the existing real API, database, authentication, permission, finance, provider, storage, audit, notification, and settings flows.
- [ ] Do not replace real data with hard-coded mock data, duplicate local state, static dashboard numbers, fake buttons, or visual-only workflows.
- [ ] Do not create duplicate APIs, routes, database fields, permissions, finance logic, provider logic, or validation only to support a new layout.
- [ ] Preserve current IDs, filters, pagination, deep links, audit targets, upload flows, idempotency, claims, locks, retries, and error semantics.
- [ ] Every visible action must call a real supported operation and show its loading, success, error, permission, conflict, and retry state.
- [ ] Charts, counters, badges, queue totals, risk summaries, provider health, and activity feeds must use real API data and disclose stale/partial data.
- [ ] Member and Admin presentations may differ by device, but they must share the same business state and server-authoritative rules.

### Admin-configurable presentation

- [ ] Preserve existing Admin Settings behavior after the redesign.
- [ ] Site name, description, logo, brand mark, primary color, theme, and supported visual tokens remain configurable.
- [ ] Navigation icons, labels, visibility, badges, and feature availability continue to follow stored settings and permissions.
- [ ] Member Home banners, announcements, popups, promotions, featured games, game categories, ordering, and fallback media remain manageable from Admin where backend support exists.
- [ ] Login/Register presentation, contact information, support channels, legal content, SEO metadata, maintenance notices, and feature flags continue to use Admin-managed values.
- [ ] Deposit, withdrawal, bank, provider, game, anti-bot, security, notification, and operational settings must continue to affect the real workflows they control.
- [ ] Dark, dim, light, high-contrast, density, reduced-motion, and reduced-blur preferences should be stored per admin/account when supported, with safe defaults otherwise.
- [ ] A missing or invalid setting must fall back safely without breaking navigation, authentication, finance, or critical operations.
- [ ] Sensitive settings and provider secrets must remain masked, permission-protected, audited, and excluded from browser-visible payloads.

### Configuration compatibility QA

- [ ] Record the current setting keys and their consuming pages before replacing shared shells or components.
- [ ] Test each configurable value before and after the redesign on Desktop, Tablet, and Mobile.
- [ ] Verify settings changes propagate without a rebuild where the current system supports runtime updates.
- [ ] Verify disabled features disappear from navigation and direct routes are still server-authorized.
- [ ] Verify branding colors retain accessible contrast; unsafe dynamic colors must receive an accessible fallback.
- [ ] Verify media with missing, slow, invalid, portrait, landscape, and oversized sources uses stable fallback sizing.
- [ ] Verify maintenance, feature-disabled, permission-denied, provider-down, and partial-settings states.
- [ ] No redesigned route is complete until its real integration and Admin-configurability checks pass.
