# UX/UI Master Roadmap

Updated: 2026-07-10

This document is the single source of truth for the UX/UI modernization work across the three visual surfaces of the platform:

1. Member Web
2. Admin Web
3. Public/Auth

The API is shared by all surfaces and is not treated as a visual surface.

## Status legend

- ✅ Done
- 🚧 In progress
- ⏭ Next
- ⏳ Planned
- 🧪 Needs regression verification
- ⛔ Blocked

## Breakpoints

- Small mobile: 360–374px
- Mobile: 375–430px
- Tablet: 768–1023px
- Desktop: 1024–1439px
- Wide desktop: 1440px+

## Safety rules

- Mobile and desktop share the same API, state, validation, and business logic.
- Device-specific work must be limited to composition, spacing, navigation, density, and interaction presentation.
- Do not duplicate money-operation logic between layouts.
- Do not use `pnpm prisma db push --force-reset`.
- Every major UI change must pass build, route smoke, and the regression matrix before being marked complete.
- Touch targets must be at least 44px.
- Fixed controls must respect safe-area insets.
- Tables must have a mobile card or horizontal-scroll fallback.
- Loading, empty, error, disabled, success, and maintenance states must be covered.

# Group 1: Design System + Member UX/UI

## Shared foundations

- ✅ Design tokens in `apps/web-member/app/design-tokens.css`
- ✅ Shared member UI primitives in `apps/web-member/app/components/member-ui.tsx`
- ✅ Shared UI styles in `apps/web-member/app/member-ui.css`
- ✅ Shared shell styles in `apps/web-member/app/member-shell.css`
- ✅ Member mobile stylesheet
- ✅ Member desktop stylesheet
- ✅ Shared navigation configuration
- ✅ Shared route access configuration
- ✅ Typed site settings provider
- ✅ Member session provider
- ✅ Pending request count hook
- ✅ Shared member API request helper
- ✅ Footer migrated to typed settings
- ✅ Shell and layout inline styles reduced

## Member Home

- ✅ Home data hook extracted
- ✅ Home sections split from orchestration
- ✅ Quick actions generated from navigation configuration
- ✅ Shared card, notice, button, and empty state usage
- ✅ Home inline styles moved to CSS
- ✅ Mobile composition
- ✅ Desktop 12-column composition
- ✅ Hero, wallet, pending, announcements, categories, game rails, FAQ, and activity zones
- 🧪 Verify all home states at six standard viewports
- ⏳ Add screenshot baseline for visual regression

## Login and Register

- ✅ Public/Auth mobile layout
- ✅ Public/Auth desktop split layout
- ✅ Safe-area support
- ✅ Password visibility controls
- ✅ Feature-flag and maintenance states retained
- ✅ Referral flow retained
- ✅ Focus and disabled states improved
- ✅ Auth shell CSS extracted
- 🚧 Final inline-validation polish
- 🚧 Error summary and field-level error association
- ⏳ Password rule hints and strength feedback
- 🧪 Autofill, keyboard overlap, and 200% zoom verification

## Deposit

- ✅ Existing select → transfer → waiting flow retained
- ✅ Slip upload and preview retained
- ✅ Confirmation modal retained
- ✅ Responsive finance foundation loaded
- ✅ Mobile safe-area and control sizing coverage
- 🚧 Full page refactor from inline styles to shared classes/components
- 🚧 Mobile sticky action treatment
- 🚧 Desktop form + summary composition
- 🚧 Shared deposit response types
- ⏳ Step indicator
- ⏳ Better upload retry and invalid-file feedback
- ⏳ Accessible file input and progress state
- 🧪 Full submit, retry, error, and waiting-state regression

## Withdraw

- ✅ Existing account → amount → confirm → waiting flow retained
- ✅ Bonus-turnover blocking retained
- ✅ Wallet and bank-account loading retained
- ✅ Responsive finance foundation loaded
- 🚧 Full page refactor from inline styles to shared classes/components
- 🚧 Mobile sticky action treatment
- 🚧 Desktop wallet summary + form composition
- 🚧 Shared withdrawal, wallet, bank, and bonus types
- ⏳ Step indicator
- ⏳ Clear min/max/available guidance
- ⏳ Better realtime amount validation
- 🧪 Full submit, bonus-block, insufficient-balance, and waiting-state regression

## Transactions

- ✅ Full layout refactor completed
- ✅ Shared `LedgerItem` type used
- ✅ Shared notice and empty state used
- ✅ Mobile transaction-card layout
- ✅ Desktop summary and transaction layout
- ✅ Income, outcome, net, and count summary
- ✅ Before/after balance display
- ✅ Inline styles removed from the page
- ⏳ Search and filter controls
- ⏳ Date range and type/status chips
- ⏳ Pagination or incremental loading
- ⏳ Optional desktop table mode
- 🧪 Verify 100-item rendering and long values

## Bank Accounts

- ✅ Full layout refactor completed
- ✅ Shared member components used
- ✅ Mobile and desktop layouts
- ✅ Account number masking
- ✅ Thai status labels
- ✅ Primary-account badge
- ✅ Sticky desktop form
- ✅ Inline styles removed from the page
- ⏳ Edit/replace workflow if backend supports it
- ⏳ Confirmation dialog for sensitive changes
- ⏳ Bank logo mapping
- 🧪 Verify pending, active, rejected, and empty states

## Games Lobby

- ✅ Existing lobby, featured, popular, recent, and favorite data support
- ✅ Home game rails responsive
- ⏳ Full lobby mobile composition
- ⏳ Full lobby desktop grid
- ⏳ Search, provider, and category filters
- ⏳ Sticky mobile filters
- ⏳ Skeleton game cards
- ⏳ Empty search state
- ⏳ Quick launch and provider grouping
- 🧪 Image fallback and slow-network verification

## Promotions and Bonus

- ⏳ Campaign cards for mobile and desktop
- ⏳ Eligibility and claim states
- ⏳ Expiry badges
- ⏳ Terms accordion
- ⏳ Turnover progress UI
- ⏳ Active, expired, upcoming, and empty states

## Profile, Security, Notifications, Support

- ⏳ Profile overview
- ⏳ Password change
- ⏳ Session/device list
- ⏳ Notification preferences
- ⏳ KYC state
- ⏳ Account status and danger zone
- ⏳ Notifications grouped by date
- ⏳ Read/unread and mark-all-read actions
- ⏳ Support contact channels
- ⏳ Ticket list, detail, composer, and attachments
- ⏳ FAQ search

# Group 2: Admin UX/UI + Operations

## Shared foundations

- ✅ Admin mobile stylesheet
- ✅ Admin desktop stylesheet
- ✅ Shared admin form/table primitives added
- ✅ `AdminInput`
- ✅ `AdminSelect`
- ✅ `AdminTable`
- ✅ `AdminField`
- ✅ `AdminEmptyState`
- ✅ Admin dashboard responsive stylesheet
- ✅ Admin operations responsive stylesheet
- 🚧 Migrate existing admin pages to shared primitives
- 🚧 Reduce inline styles in legacy admin UI components

## Admin Shell

- ✅ Mobile drawer foundation
- ✅ Desktop sidebar foundation
- ✅ Responsive topbar and content widths
- ⏳ Collapsible desktop sidebar state
- ⏳ Command/search entry point
- ⏳ User menu and notification area
- ⏳ Keyboard shortcuts

## Dashboard

- ✅ Mobile and desktop dashboard composition
- ✅ KPI metrics
- ✅ Pending queues
- ✅ Risk alerts
- ✅ Today volume
- ✅ Recent ledger
- ✅ Quick operation cards
- 🚧 Remove remaining inline styles from dashboard-specific content
- ⏳ Skeleton loading
- ⏳ Error retry panel
- ⏳ Trend visualization where useful
- 🧪 Verify mobile density and wide-desktop layout

## Top-up Queue

- ✅ Existing claim/release/approve/reject workflow retained
- ✅ Private slip loading retained
- ✅ Confirmation dialog retained
- ✅ Responsive operations layer loaded
- 🚧 Mobile queue-card polish
- 🚧 Desktop review split layout
- 🚧 Shared form controls for status, notes, and pagination
- 🚧 Remove inline styles
- ⏳ Sticky review action bar
- ⏳ Better audit timeline presentation
- 🧪 Verify claim conflict, missing slip, approve, and reject flows

## Withdrawal Queue

- ✅ Existing operation flow retained
- ✅ Responsive operations layer loaded
- 🚧 Mobile queue-card polish
- 🚧 Desktop review split layout
- 🚧 Shared form controls
- 🚧 Remove inline styles
- ⏳ Sticky review action bar
- ⏳ Risk and account verification summary
- 🧪 Verify claim/release/complete/reject flows

## Members

- ✅ Existing member management remains functional
- ✅ Responsive operations foundation loaded
- 🚧 Mobile member cards
- 🚧 Desktop data table
- 🚧 Search, filter, and pagination toolbar
- 🚧 Shared table primitives
- ⏳ Detail side panel
- ⏳ Account status and risk summary
- ⏳ Bulk actions where safe

## Admin Transactions, Wallets, Ledgers

- ✅ Existing operation pages remain functional
- ✅ Responsive foundation loaded
- 🚧 Shared data tables
- 🚧 Mobile card fallback
- 🚧 Unified money/date/status formatting
- 🚧 Search, filters, sorting, and pagination
- ⏳ Detail side panel
- ⏳ Export actions where supported

## Reports, Activity, Risk, Security

- ✅ Existing reports and activity features remain functional
- ✅ Existing risk and security features remain functional
- ⏳ Responsive density pass
- ⏳ Shared filter bars
- ⏳ Better empty/loading/error states
- ⏳ Mobile card fallback for wide data
- ⏳ Audit timeline visual hierarchy

## Admin Settings

- ✅ Shared admin inputs/selects available
- ⏳ Migrate branding settings
- ⏳ Migrate theme settings
- ⏳ Migrate feature toggles
- ⏳ Migrate contact settings
- ⏳ Migrate legal settings
- ⏳ Live preview
- ⏳ Save bar and unsaved-change warning
- ⏳ Reset defaults
- ⏳ Search within settings

# Group 3: Types + API + Data Architecture

- ✅ `requestJson<T>` and `ApiRequestError`
- ✅ Typed site settings normalization
- ✅ Shared member API types file
- ✅ `MoneyRequest`
- ✅ `LedgerItem`
- ✅ `Game`
- ✅ `GameLobbyPayload`
- ✅ Shared home data hook
- ✅ Shared session and settings providers
- ✅ Shared route and navigation configuration
- ✅ Pending count hook
- 🚧 Deposit response types
- 🚧 Withdrawal response types
- 🚧 Wallet response types
- 🚧 Bank account response types
- 🚧 Bonus ledger response types
- 🚧 Admin finance and queue types
- ⏳ Shared money/date/status formatter module
- ⏳ Request cancellation for stale page loads
- ⏳ Request deduplication where duplicate calls exist
- ⏳ Cache and prefetch strategy
- ⏳ Optimistic updates for safe non-money actions

# Group 4: Accessibility + Responsive + Performance

## Accessibility

- ✅ Core focus styles added to shared layers
- ✅ Touch target minimums documented
- ✅ Reduced-motion handling added in major responsive layers
- 🚧 Form error association
- 🚧 Modal focus trap and focus return
- 🚧 Escape-to-close behavior audit
- 🚧 Semantic heading audit
- 🚧 ARIA labeling audit
- ⏳ Screen-reader-only helper text
- ⏳ Contrast audit for all dynamic brand colors

## Responsive

- ✅ Member Mobile/PC styles separated
- ✅ Admin Mobile/PC styles separated
- ✅ Public/Auth Mobile/PC styles separated
- ✅ Responsive surface guardrails documented
- ✅ Finance and operations responsive foundations
- ✅ Home, dashboard, and auth compositions separated by device
- 🚧 Route-by-route overflow cleanup
- 🚧 Tablet-specific review
- 🚧 Landscape review
- 🚧 Long Thai text review
- 🚧 Large text and 200% zoom review

## Performance UX

- ⏳ Shared skeleton primitives
- ⏳ Lazy images where appropriate
- ⏳ Stable image aspect ratios
- ⏳ Abort stale requests
- ⏳ Reduce avoidable re-renders
- ⏳ Route prefetch strategy
- ⏳ Perceived-loading improvements

# Group 5: Quality Gate + Final Polish

## Existing documents

- ✅ `docs/mobile-visual-regression-checklist.md`
- ✅ `docs/responsive-surface-guardrails.md`
- ✅ `docs/ux-regression-matrix-finance-operations.md`
- ✅ `docs/final-qa-checklist.md`
- ✅ `docs/member-ux-qa.md`
- ✅ `docs/playwright-smoke.md`
- ✅ `docs/production-verification.md`

## Required checks

- ✅ API build passing at latest confirmed checkpoint
- ✅ Admin build passing at latest confirmed checkpoint
- ✅ Member build confirmed passing before this roadmap update
- 🚧 Re-run builds after Deposit/Withdraw refactor
- ⏳ Lint
- ⏳ Type-check
- ⏳ Route matrix
- ⏳ Feature-flag matrix
- ⏳ Auth/public-route matrix
- ⏳ Loading/empty/error/success matrix
- ⏳ Deposit flow smoke
- ⏳ Withdrawal flow smoke
- ⏳ Admin approval/rejection smoke
- ⏳ Mobile screenshots
- ⏳ Desktop screenshots
- ⏳ Contrast audit
- ⏳ Reduced-motion audit
- ⏳ Keyboard-only audit
- ⏳ Visual regression baseline
- ⏳ Post-deploy smoke verification

# Current execution queue

## Now

1. 🚧 Refactor Deposit page to shared classes/components while preserving all money logic.
2. 🚧 Refactor Withdraw page to shared classes/components while preserving all money logic.
3. 🚧 Move Deposit/Withdraw finance models into shared types.
4. 🚧 Add shared step/summary/confirmation presentation patterns.
5. 🧪 Build and regression-check Deposit/Withdraw.

## Next

1. ⏭ Top-up Queue full presentation refactor.
2. ⏭ Withdrawal Queue full presentation refactor.
3. ⏭ Members and Admin Transactions migration to shared table/card patterns.
4. ⏭ Public/Auth field-level validation and error summary.
5. ⏭ Games, Promotions, Profile, Notifications, and Support UX passes.
6. ⏭ Admin Settings migration.
7. ⏭ Full accessibility and performance pass.
8. ⏭ Final visual regression and production polish.

# Completed architecture and UX milestones

- ✅ Deprecated duplicate member bottom navigation shim
- ✅ Central member navigation configuration
- ✅ Central member route configuration
- ✅ Typed public site settings
- ✅ Site settings provider
- ✅ Member session provider
- ✅ Home orchestration split from sections and data hook
- ✅ Shared member API helper
- ✅ Shared member UI primitives
- ✅ Shared admin form/table primitives
- ✅ Shared member API response types
- ✅ Typed footer
- ✅ Shell and layout CSS extraction
- ✅ Member Home Mobile/PC redesign
- ✅ Admin Dashboard Mobile/PC redesign
- ✅ Public Login/Register Mobile/PC redesign
- ✅ Transactions full refactor
- ✅ Bank Accounts full refactor

# Definition of done

A route is complete only when all applicable items are true:

- Uses shared types where available.
- Uses shared UI primitives or documented exceptions.
- Has no unnecessary duplicated inline style objects.
- Works at all six standard viewport sizes.
- Handles loading, empty, error, disabled, and success states.
- Supports keyboard navigation and visible focus.
- Does not overflow with long Thai content.
- Keeps critical actions reachable above the mobile safe area.
- Preserves API and business behavior.
- Passes build and relevant smoke/regression checks.
