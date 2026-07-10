# UX/UI Master Roadmap

Updated: 2026-07-10

## Audit status note

The checkmarks below describe implementation presence, not production acceptance. Items marked `✅` still require the verification work listed under `🧪` and in `docs/remaining-work-backlog.md`. Provider, notification, support, anti-bot, settings, and chart surfaces that are currently scaffolded must not be treated as production-complete until their backend and acceptance checks pass.

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
- ⏳ Collapsible sidebar, command entry and keyboard shortcuts

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
5. 🚧 Verify the new Member/Admin shell navigation changes on mobile and desktop.
6. ⏳ Add explicit loading, empty, error, retry, stale-data, and success states to every major route.
7. ⏳ Complete the Games, Promotions, Profile, Notifications, and Support UX passes.

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
