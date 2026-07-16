# UI Design Reference and Visual Parity Contract

Updated: 2026-07-16  
Status: Required acceptance reference for Member and Admin UI redesign

This document turns the supplied LUX88 / Gaming Fintech reference boards into an implementation and QA contract. The reference is the visual target for layout, hierarchy, colors, spacing, component composition, responsive behavior, and interaction states. A route is not visually complete until its desktop and mobile evidence can be compared against the matching board.

Active Member product brief: [`docs/MEMBER_UI_PRODUCT_BRIEF.md`](./MEMBER_UI_PRODUCT_BRIEF.md). Navigation and menu source of truth: [`docs/UI_MENU_INFORMATION_ARCHITECTURE.md`](./UI_MENU_INFORMATION_ARCHITECTURE.md). Component, copy, state, duplicate-work, and execution source of truth: [`docs/UI_CONSISTENCY_COMPLETION_PLAN.md`](./UI_CONSISTENCY_COMPLETION_PLAN.md). Motion source of truth: [`docs/UI_MOTION_ANIMATION_CONTRACT.md`](./UI_MOTION_ANIMATION_CONTRACT.md). Visual parity must not preserve contradictory Desktop, Mobile, Drawer, Home, or Admin menu definitions.

## Reference boards

| Board                                 | Product area                                             | Required route groups                                              |
| ------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------ |
| Member Authentication                 | Member Login and Register                                | `/login`, `/register`, password recovery/public auth states        |
| Member Home & Wallet                  | Member dashboard, wallet, transactions                   | `/`, `/transactions`, wallet surfaces, mobile bottom navigation    |
| Member Deposit Flow                   | Deposit journey and deposit history                      | `/deposit`, deposit detail/history states                          |
| Member Withdraw & Bank Accounts       | Withdrawal and bank-account management                   | `/withdraw`, `/bank-accounts`                                      |
| Member Games, Promotions & Bonus      | Games, campaigns, promotion detail, bonus wallet         | `/games`, `/promotions`, `/bonus`                                  |
| Member Account, Security & Support    | Profile, security, notifications, support                | `/profile*`, `/notifications`, `/support`, `/kyc`                  |
| Admin Dashboard & Operations          | Admin dashboard and operational queue                    | `/dashboard`, queue/detail surfaces                                |
| Admin Review Flow                     | Deposit, withdrawal, member, KYC, bank review            | `/topups`, `/withdrawals`, `/members`, `/kyc`, bank review         |
| Admin Finance, Risk & Reports         | Wallets, ledger, risk, reports, analytics                | `/wallets`, `/ledgers`, `/risk`, `/reports`, `/activity`           |
| Admin Providers, Marketing & Settings | Providers, transfers, promotions, KYC, support, settings | `/providers`, `/transfers`, `/promotions`, `/settings`, `/support` |

The original image attachments remain the visual source supplied with the task. Their attachment identifiers are recorded in the task context; repository evidence must use retained screenshots/traces rather than relying on an unavailable local attachment path.

## Shared visual language

- [ ] Use the dark product shell as the default authenticated theme: deep navy background (`#0B1420` / `#0D1420`), elevated panel (`#0F1A2B`), white text (`#FFFFFF`), muted blue-gray text, and gold primary accent (`#F0C15A`–`#F5C86A`).
- [ ] Use gold for primary actions, active navigation, key amounts, focus rings, selected tabs, and important headings; use green, amber, and red only for semantic status.
- [ ] Use thin gold/blue-gray borders, restrained radii, layered cards, and subtle circuit/line decoration. Do not introduce unrelated purple, bright gradients, or a second visual language.
- [ ] Apply one Thai/Latin typography scale with strong display headings, readable Thai body text, tabular money figures, and consistent line height. Prevent long Thai labels and IDs from overflowing.
- [ ] Use one outline icon family with consistent stroke weight and semantic icon mapping: home, wallet, deposit, withdrawal, promotion, game, profile, security, support, shield, gift, headset, eye, lock, and status icons.
- [ ] Keep branding, top bar, sidebar, mobile bottom navigation, card, metric tile, badge, tab, filter, timeline, modal, and sticky-action patterns shared across routes.
- [ ] Match the reference composition at six standard viewports: 360×800, 390×844, 430×932, 768×1024, 1024×768, and 1440×900.
- [ ] Compare visual evidence at the same content density, not only the same colors: column widths, panel order, whitespace, card height, image ratio, control height, and action placement must match the board.

## Member parity requirements

### Authentication

- [ ] Desktop Login uses a split hero/form composition with premium finance imagery, brand header, support/language controls, dark form card, gold primary CTA, secondary register CTA, and trust/security notes.
- [ ] Desktop Register uses the same shell with a benefits/bonus panel beside the registration form; form fields, password confirmation, terms, and CTA follow the reference hierarchy.
- [ ] Mobile Login/Register collapse to a single-column flow with compact brand header, no horizontal overflow, thumb-reachable CTA, keyboard-safe spacing, and the same visual hierarchy.

### Home, wallet, and transactions

- [ ] Desktop Home uses fixed left navigation, topbar member/wallet summary, balance metric tiles, quick actions, promotion panel, game rail, and recent-activity list in the reference order.
- [ ] Mobile Home uses compact topbar, balance summary, stacked metric cards, quick-action icons, promotion/game cards, recent activity, and fixed bottom navigation matching the reference.
- [ ] Wallet Overview exposes available, locked, bonus, and total movement with the same tile/card hierarchy and eye/masking affordance.
- [ ] Transaction History uses segmented filters, date/filter controls, status badges, signed color-coded amounts, and a readable timeline/list on mobile.

### Finance flows

- [ ] Deposit follows the four reference steps: choose receiving account/method, transfer details, upload slip, review/submit, then status timeline/history.
- [ ] Deposit desktop uses the reference multi-column layout (account choice, payment instructions/QR, reference/amount form); mobile becomes one focused step per screen with sticky action.
- [ ] Withdrawal and Bank Accounts use the same dark card language, selected/verified account treatment, available-balance summary, presets, fee/net summary, and gold confirmation CTA.
- [ ] Finance states cover loading, empty, error, retry, pending review, approved, completed, rejected, expired, duplicate, cancelled, and session-expired with the same badge/timeline vocabulary.

### Games, promotions, account, and support

- [ ] Games desktop/mobile match the reference hero, search/filter controls, provider chips, category rails, featured cards, game grid, and mobile bottom navigation.
- [ ] Promotions and Bonus match campaign cards, detail layout, eligibility/terms, claim CTA, progress meter, history, expired/ineligible states, and gold emphasis.
- [ ] Profile/Security/Notifications/Support match the reference section cards, security controls, device/session list, notification timeline, ticket conversation, composer, and mobile navigation.

## Admin parity requirements

- [ ] Admin uses the Gaming Fintech brand shell, dark navy background, gold accent, fixed desktop sidebar, compact mobile header/bottom navigation, and responsive card/table fallback.
- [ ] Dashboard matches KPI tiles, business trend chart, alert/risk panel, action center, system health, and mobile summary ordering.
- [ ] Operations Queue and Case Detail match queue tabs, filters, SLA/status badges, table density, evidence/document panel, timeline, permission-aware actions, and sticky action bar.
- [ ] Review Flow matches deposit slip review, withdrawal/risk review, member detail, KYC review, and bank-account review compositions with mandatory reason, secure preview, conflict, and audit states.
- [ ] Finance/Risk/Reports match wallet overview, ledger filters/table, risk alert timeline, report builder steps, analytics charts, export states, and mobile card fallback.
- [ ] Providers/Transfers/Promotions/KYC/Support/Settings match the reference section navigation, dense tables, status taxonomy, form hierarchy, credential masking, audit log, and responsive behavior.

## Visual QA gate

- [ ] Store an approved baseline screenshot for every reference route at desktop and mobile sizes.
- [ ] Run pixel/visual comparison after every layout, token, image, font, or shared-component change; review intentional differences explicitly.
- [ ] Verify loading, empty, error, partial, stale, permission, maintenance, success, retry, conflict, and session-expired states against the same shell and component language.
- [ ] Verify keyboard navigation, focus-visible, 200% zoom, reduced motion, mobile keyboard, safe areas, long Thai text, missing media, and offline/reconnected behavior.
- [ ] Retain screenshots, traces, console/network results, viewport, commit SHA, and approval notes as CI artifacts.
- [ ] Do not mark a route “redesign complete” from static implementation alone; it requires visual evidence and responsive acceptance.
