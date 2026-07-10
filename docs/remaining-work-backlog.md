# Remaining Work Backlog

This document lists the remaining work after the latest provider, money operation, and admin UX improvements.

## Current implementation status

The following work has already been implemented or scaffolded:

- Adapter Test Harness UI.
- Admin Operation Dashboard.
- Member Game Session UX polish.
- Wallet Ledger Detail page.
- Admin Sidebar Navigation grouping.
- Provider Setup Wizard v2 validation and preview.
- Provider Preset Preview/Edit UI.
- Provider Credential Management polish.
- Provider Readiness Traffic-light view.
- Game Transfer Recovery UI for review, retry, reverse, and force-fail actions.
- Reconciliation Snapshot Detail workflow.
- Webhook Settlement Test Mode panel.
- Type fix for simple game settings badge tones.

## Immediate priority: Build, fix, and QA

Before adding more product features, the current branch must pass builds and smoke tests.

### Commands to run

```bash
pnpm build:web-admin
pnpm build:api
pnpm build:web-member
pnpm test:e2e:smoke
```

### Known recent fix

- Fixed `apps/web-admin/app/(admin)/simple-game-settings/page.tsx` where `AdminBadge tone` received a broad `string` type instead of a valid badge tone union.

### Build watchlist

- `apps/web-admin/app/(admin)/provider-presets/page.tsx`
  - UI now sends `enabledEndpoints` and `endpointOverrides`.
  - Backend must either accept them or ignore them safely.
- `apps/web-admin/app/(admin)/webhook-settlement/page.tsx`
  - Test mode calls simulator webhook endpoints.
  - Verify auth and path behavior in production build/runtime.
- `apps/web-admin/app/(admin)/game-transfers/[id]/page.tsx`
  - UI references manual reverse and force-fail endpoints.
  - Backend support must be verified.
- `apps/api/src/modules/money-ops/wallet-ledger-detail.controller.ts`
  - Verify Prisma model names and permission usage.

## Backend actions to verify or finish

### Game Transfer Recovery backend

UI exists for transfer recovery, but backend support must be verified and completed.

Required endpoints:

- [ ] `PATCH /admin/game-transfers/:id/actions/manual-reverse`
- [ ] `PATCH /admin/game-transfers/:id/actions/force-fail`

Required behavior:

- [ ] Manual reverse can only run on safe transfer states.
- [ ] Manual reverse cannot run twice for the same transfer.
- [ ] Manual reverse writes a WalletLedger reversal when it changes balance.
- [ ] Force-fail can only run on safe pending states.
- [ ] Retry creates a new idempotency key.
- [ ] Retry is blocked when provider or wallet state is unsafe.
- [ ] Every recovery action requires an admin note.
- [ ] Every recovery action writes an AdminAuditLog.
- [ ] Response payload clearly stores recovery metadata and related ledger IDs.

### Provider Preset Apply backend

UI now supports stronger preview/edit, but backend behavior must be confirmed.

Required behavior:

- [ ] Accept `enabledEndpoints` from preset UI.
- [ ] Accept `endpointOverrides` from preset UI.
- [ ] Create only selected endpoints when `enabledEndpoints` is provided.
- [ ] Apply overridden endpoint URLs when provided.
- [ ] Validate duplicate provider code before create.
- [ ] Create placeholder/disabled credentials only when intended.
- [ ] Audit preset apply with preset code and override summary.
- [ ] Return created provider ID so UI can redirect to the correct provider detail/risk page later.

### Credential Management backend

Current UI supports rotate, enable/disable, and health-check. Backend should be hardened.

Required behavior:

- [ ] Raw secret accepted only on create/rotate.
- [ ] Raw secret is never returned to frontend.
- [ ] Disabled credentials are never used in adapter context.
- [ ] Rotation updates `rotatedAt`.
- [ ] Adapter credential usage optionally updates `lastUsedAt` or equivalent metadata.
- [ ] Credential create/update/rotate/disable actions write AdminAuditLog.
- [ ] Health-check/test action returns sanitized payload only.

### Webhook Test Mode backend

UI test panel exists, but simulator behavior must be verified.

Required behavior:

- [ ] Simulator webhook endpoint accepts test payload from admin UI or has an admin-safe wrapper endpoint.
- [ ] Duplicate mode generates duplicate idempotency behavior.
- [ ] Invalid signature mode logs failed webhook with clear error.
- [ ] ROLLBACK/WIN/BET_SETTLED payloads parse into normalized events.
- [ ] Test mode never settles real wallet balance unless explicit gates are enabled.
- [ ] Webhook logs show raw and normalized payloads safely.

### Reconciliation workflow backend

Snapshot detail UI exists. Backend should support deeper investigation.

Required behavior:

- [ ] Snapshot detail returns related game session where available.
- [ ] Snapshot detail returns related game transfers where available.
- [ ] Snapshot detail returns related risk alert where available.
- [ ] Resolve requires admin note.
- [ ] Resolve writes AdminAuditLog.
- [ ] Resolve can auto-close or link related RiskAlert.
- [ ] Review status/timeline is visible in raw payload or a dedicated model.

## QA flows to run after build passes

### Admin QA

- [ ] Create provider from Provider Setup Wizard.
- [ ] Create provider from Provider Preset Preview/Edit.
- [ ] Rotate provider credential.
- [ ] Disable and re-enable provider credential.
- [ ] Run provider health-check.
- [ ] Run Adapter Test Harness healthCheck.
- [ ] Run Adapter Test Harness launchGame.
- [ ] Run Adapter Test Harness transferIn and transferOut against simulator/sandbox only.
- [ ] Open Provider Risk and verify readiness traffic-light.
- [ ] Run Preflight.
- [ ] Open Operation Dashboard and verify queue counts render.
- [ ] Open Wallet Ledger Detail from list or transfer detail.
- [ ] Open Game Transfer Detail and verify recovery status/hints.
- [ ] Run reconciliation by session ID.
- [ ] Open Reconciliation Snapshot Detail.
- [ ] Generate mock webhook from Webhook Settlement Test Mode.
- [ ] Verify webhook appears in Webhook Logs.

### Member QA

- [ ] Member login works.
- [ ] Game lobby opens.
- [ ] Game launch creates/opens session.
- [ ] Game session page shows wallet balance.
- [ ] Transfer-in succeeds with simulator provider.
- [ ] Transfer-out succeeds with simulator provider.
- [ ] Transfer-in provider failure rolls back wallet and shows Thai copy.
- [ ] Transfer-out provider failure leaves wallet unchanged and shows Thai copy.
- [ ] Transfer history updates after each action.
- [ ] Transaction history shows correct Thai labels.

## Remaining Member UX work

### Member Home

- [ ] Build a true market-style mobile member home.
- [ ] Show available balance, pending state, latest activity, quick actions, featured games, recently played games, and promotion slots.
- [ ] Show pending cards only when relevant.
- [ ] Add notification badge for pending/approved/rejected money actions.

### Game Lobby

- [ ] Add categories: slots, casino, sports, fishing, popular, new.
- [ ] Add provider filter.
- [ ] Add game search.
- [ ] Add favorite games.
- [ ] Add recently played games.
- [ ] Add disabled/maintenance state.
- [ ] Add image fallback for missing provider assets.

### Deposit Flow

- [ ] Convert deposit into guided step flow.
- [ ] Add amount picker and quick amounts.
- [ ] Add channel selection.
- [ ] Add copy account number action.
- [ ] Add QR/PromptPay display when available.
- [ ] Add slip upload preview.
- [ ] Add deposit pending status card.
- [ ] Add clear Thai validation messages.

### Withdraw Flow

- [ ] Convert withdraw into guided step flow.
- [ ] Add bank account selector.
- [ ] Show available balance.
- [ ] Show min/max and fee if any.
- [ ] Add review step before submit.
- [ ] Prevent submit when bank account is missing or inactive.
- [ ] Show pending/rejected/approved status clearly.

### Unified History

- [ ] Add unified transaction detail drawer/page.
- [ ] Include deposit, withdraw, transfer-in, transfer-out, adjustment, bonus, and reversal.
- [ ] Add filters by type, status, and date range.
- [ ] Use Thai labels only, not raw enum names.

### Profile and Security

- [ ] Add member profile page polish.
- [ ] Add change password flow.
- [ ] Add login history.
- [ ] Add logout all devices.
- [ ] Add account status display.

## Remaining Admin Operation work

### Deposit and Withdraw Queues

- [ ] Add fast deposit detail/review drawer.
- [ ] Add fast withdraw detail/review drawer.
- [ ] Add approve/reject with note.
- [ ] Add queue claim/lock to avoid two admins processing the same item.
- [ ] Add member history and wallet summary inside review view.
- [ ] Add audit timeline to deposit and withdraw detail.

### Risk Alert Ticket Workflow

- [ ] Add assign admin.
- [ ] Add note timeline.
- [ ] Add filters by severity/status/type/provider/date.
- [ ] Add related links to transfer, ledger, webhook, snapshot, member.
- [ ] Add safe bulk actions for low-risk alerts only.
- [ ] Auto-close or suggest close when related reference is resolved.

### Idempotency Dashboard

- [ ] Add dashboard for transfer idempotency keys.
- [ ] Add dashboard for webhook idempotency keys.
- [ ] Add dashboard for ledger idempotency keys.
- [ ] Show duplicate attempts and related records.

### Webhook Operations

- [ ] Add webhook log detail page.
- [ ] Add dry-run replay action.
- [ ] Add parse test action.
- [ ] Add signature test action.
- [ ] Add duplicate event view.
- [ ] Add invalid signature view.
- [ ] Keep settlement behind explicit gates.

### Provider Operations

- [ ] Add provider endpoint editor with simple UX.
- [ ] Add credential version/history view.
- [ ] Add provider callback/IP whitelist config fields.
- [ ] Add provider outage status banner.
- [ ] Add adapter docs/sample cURL per provider.

## Market-like product features not started

### Promotion and Bonus

- [ ] Bonus wallet.
- [ ] Promotion campaign management.
- [ ] Turnover requirement tracking.
- [ ] Member bonus claim flow.
- [ ] Bonus history.
- [ ] Admin bonus approve/reject flow.

### Affiliate and Agent

- [ ] Agent code.
- [ ] Referral link.
- [ ] Commission tracking.
- [ ] Downline view.
- [ ] Agent report.
- [ ] Agent settlement workflow.

### CMS and Content

- [ ] Mobile banner management.
- [ ] Announcement management.
- [ ] Popup management.
- [ ] Maintenance notice management.
- [ ] Game category ordering.
- [ ] Featured games management.

### KYC and Risk

- [ ] Phone verification.
- [ ] Bank account verification.
- [ ] Duplicate bank detection.
- [ ] Account risk status.
- [ ] User blacklist.

### Customer Support

- [ ] Support ticket flow.
- [ ] LINE/live chat config.
- [ ] FAQ page.
- [ ] Deposit/withdraw issue templates.
- [ ] Link ticket to deposit, withdraw, transfer, or ledger.

## Work that requires real provider documents

Do not start provider-specific integration until the provider gives the required material.

Required from provider:

- [ ] API documentation.
- [ ] UAT endpoint.
- [ ] Production endpoint.
- [ ] API key / secret / merchant ID / agent ID.
- [ ] Signature algorithm.
- [ ] Request/response examples.
- [ ] Error code list.
- [ ] Webhook format.
- [ ] Webhook signature rules.
- [ ] Game list API or static game catalog.
- [ ] IP whitelist requirement.
- [ ] Callback URL requirement.

Provider-specific work after docs arrive:

- [ ] Create `<provider>.adapter.ts`.
- [ ] Register provider code in adapter registry.
- [ ] Map launchGame request/response.
- [ ] Map getBalance request/response.
- [ ] Map transferIn and transferOut request/response.
- [ ] Map syncGames.
- [ ] Map getBetHistory if supported.
- [ ] Validate webhook signature.
- [ ] Parse webhook events.
- [ ] Add provider-specific test payloads.
- [ ] Run UAT with small dry-run/sandbox amounts before real money.

## Recommended next order

1. Run `pnpm build:web-admin` again.
2. Fix the next build error until web-admin passes.
3. Run `pnpm build:api` and fix backend errors.
4. Run `pnpm build:web-member` and fix member errors.
5. Run smoke tests.
6. Verify or implement transfer manual-reverse and force-fail backend.
7. Verify Provider Preset Apply uses `enabledEndpoints` and `endpointOverrides`.
8. Verify Webhook Test Mode simulator behavior.
9. Build Member Home and Game Lobby.
10. Build Deposit/Withdraw step flows.
11. Start Promotion/Bonus.
12. Start Affiliate/Agent.
13. Start CMS Banner/Popup.
14. Start KYC/Bank Verification.
15. Start Support Ticket/LINE contact.

## Main initiative: Web Member market-style redesign

This initiative upgrades the entire Member experience to a production-grade market-style interface rather than polishing isolated pages. Shared navigation, layout, icons, wallet presentation, promotions, game discovery, and responsive behavior must be treated as one coherent system.

### Priority 0: Shared member shell and navigation

- [ ] Replace the current Member navigation with a new grouped navigation system.
- [ ] Add desktop/tablet right sidebar layout while keeping mobile bottom navigation.
- [ ] Add a square profile and wallet panel at the top of the right sidebar.
- [ ] Show avatar, display name, username, short member ID, account status, and member tier placeholder.
- [ ] Show available balance, locked balance, currency, last refresh time, and hide/show balance control.
- [ ] Add deposit, withdraw, and refresh balance actions inside the wallet panel.
- [ ] Group menu items into Main, Finance, Account, and Support sections.
- [ ] Add notification, pending-money, and promotion badges to relevant menu items.
- [ ] Add consistent active, hover, focus, disabled, and maintenance states.
- [ ] Keep safe-area support and touch targets of at least 44px.

### Priority 0: Icon system replacement

- [ ] Replace all mixed emoji and inconsistent icons with one shared icon system.
- [ ] Use consistent stroke weight, filled/outline rules, sizing, and alignment.
- [ ] Replace icons for Home, Promotions, Games, Favorites, Recent, Deposit, Withdraw, History, Bank Accounts, Notifications, Profile, Security, Sessions, Support, FAQ, Refresh, Search, Filter, Favorite, Claim, and Logout.
- [ ] Add consistent status icons for success, pending, rejected, maintenance, new, popular, featured, secure, and warning states.
- [ ] Create shared icon wrappers so pages do not import or style icons independently.

### Priority 0: Member Home redesign

- [ ] Replace the current home structure with a market-style home layout.
- [ ] Add a hero carousel supporting multiple promotional images.
- [ ] Add desktop, tablet, and mobile aspect-ratio handling for promotional assets.
- [ ] Add wallet summary strip and quick-action cards.
- [ ] Add promotion highlight, game categories, featured games, popular games, new games, recent games, announcements, and support shortcuts.
- [ ] Add countdown and campaign badge slots where campaign metadata exists.
- [ ] Add skeleton, empty, error, and retry states for every remote section.
- [ ] Ensure content order remains usable when promotions or games are unavailable.

### Priority 0: Promotions experience

- [ ] Support multiple promotion images and multiple card layouts.
- [ ] Add hero banner, horizontal carousel, card grid, and compact promotion strip variants.
- [ ] Add promotion badges such as New, Featured, Hot, and Members Only.
- [ ] Show bonus value, minimum deposit, turnover requirement, eligibility, and CTA.
- [ ] Add promotion detail page with hero image, conditions, calculation example, claim steps, and eligibility state.
- [ ] Add claim, claimed, expired, disabled, and maintenance states.
- [ ] Add responsive asset fallback and image loading placeholders.
- [ ] Prepare the UI to consume CMS-managed banner and promotion assets.

### Priority 1: Game lobby market polish

- [ ] Redesign game cards with stronger cover imagery, overlay, provider label, category, and market badges.
- [ ] Add Hot, New, Popular, Featured, Favorite, and Maintenance visuals.
- [ ] Add provider logo rail and provider quick filters.
- [ ] Improve search, category tabs, favorite, and recent filters.
- [ ] Add featured, popular, new, recently played, favorites, and all-games sections.
- [ ] Add game and provider image fallback hierarchy.
- [ ] Add loading skeletons and partial-failure handling.
- [ ] Keep launch and transfer business logic unchanged during visual refactor.

### Priority 1: Wallet and profile presentation

- [ ] Create reusable `MemberWalletCard` and `MemberProfileCard` components.
- [ ] Add hide/show balance persistence per device.
- [ ] Add wallet refresh timeout, retry, and stale-data indicator.
- [ ] Add shortcuts to profile, security, sessions, and bank accounts.
- [ ] Ensure wallet values use the same API contract and available-balance calculation everywhere.
- [ ] Add verified phone/email states where data exists.

### Priority 1: Quick actions and financial entry points

- [ ] Standardize Deposit, Withdraw, Promotions, Bank Accounts, History, and Support quick-action cards.
- [ ] Add large icons, clear Thai labels, accessible descriptions, and touch-friendly layout.
- [ ] Add pending-state badges without changing money operation rules.
- [ ] Ensure navigation from every quick action preserves the expected route and feature flag behavior.

### Priority 2: Visual system and consistency pass

- [ ] Define shared Member design tokens for surfaces, borders, radii, shadows, typography, spacing, and state colors.
- [ ] Standardize card hierarchy across Home, Games, Promotions, Finance, Profile, Notifications, and Support.
- [ ] Reduce page-level inline styles and move reusable patterns into shared components and CSS modules.
- [ ] Improve text contrast, number hierarchy, secondary labels, and Thai line wrapping.
- [ ] Add reduced-motion behavior for carousel, hover, and refresh animations.
- [ ] Add keyboard focus states and semantic labels across all interactive controls.

### Priority 2: Responsive and visual regression

- [ ] Validate 360x800, 390x844, 430x932, 768x1024, 1024x768, and 1440x900 viewports.
- [ ] Add authenticated screenshots for Home, Promotions, Games, Deposit, Withdraw, History, Bank Accounts, Profile, Notifications, and Support.
- [ ] Add baseline snapshots and CI artifacts for visual diffs.
- [ ] Verify sticky right sidebar behavior does not cover content or mobile safe areas.
- [ ] Verify loading, empty, error, disabled, maintenance, and long-content states.

### Acceptance criteria

- [ ] Member Home, Promotions, Games, Finance, Profile, Notifications, and Support share one coherent visual system.
- [ ] Desktop and tablet show the right sidebar with the profile and wallet cards at the top.
- [ ] Mobile retains a redesigned bottom navigation with consistent icons and badges.
- [ ] Promotions support multiple images and at least four display variants.
- [ ] No shared navigation or wallet logic is duplicated across pages.
- [ ] No money, auth, game launch, or feature-flag behavior changes during the visual refactor unless separately reviewed.
- [ ] All affected Member routes pass build, authenticated smoke tests, accessibility checks, and visual regression.

### Delivery order

1. Shared icon system and design tokens.
2. Right sidebar, profile card, wallet card, and navigation grouping.
3. Member Home and multi-image promotion system.
4. Promotion listing/detail experience.
5. Game Lobby visual refactor.
6. Quick actions and remaining Member page consistency pass.
7. Authenticated responsive and visual regression QA.
