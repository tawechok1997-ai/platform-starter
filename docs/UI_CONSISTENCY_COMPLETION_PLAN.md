# UI Consistency and Completion Plan

Updated: 2026-07-16  
Related contracts: [`MEMBER_UI_PRODUCT_BRIEF.md`](./MEMBER_UI_PRODUCT_BRIEF.md), [`MEMBER_MENU_INFORMATION_ARCHITECTURE.md`](./MEMBER_MENU_INFORMATION_ARCHITECTURE.md), [`ADMIN_MENU_INFORMATION_ARCHITECTURE.md`](./ADMIN_MENU_INFORMATION_ARCHITECTURE.md), [`UI_DESIGN_REFERENCE.md`](./UI_DESIGN_REFERENCE.md), [`UI_MOTION_ANIMATION_CONTRACT.md`](./UI_MOTION_ANIMATION_CONTRACT.md), and repository [`AGENTS.md`](../AGENTS.md). Current implementation scope is Member only; Admin sections are future reference and must remain separate work items.

This is the execution plan for making Member and Admin UI coherent, easy to use, and visually consistent with the supplied reference boards. The goal is not to make every page look identical; the goal is to make equivalent concepts behave and read identically while each page keeps its correct density.

## 1. Non-negotiable consistency rules

- [ ] One source of truth per concern: route/menu, feature flag, design token, icon, state label, API query key, and component variant.
- [ ] Reuse a component when the interaction and meaning are the same; create a variant when only density, tone, or layout changes; create a new component only when the interaction or information model is genuinely different.
- [ ] Do not duplicate a route in navigation, duplicate a metric in the same viewport, or render the same API data through separate page-level mappings.
- [ ] A page may have different Desktop and Mobile layout, but it must preserve the same title, primary action, status meaning, navigation destination, and data order.
- [ ] Hide unavailable actions consistently; never leave a dead button, empty menu group, or active link to a disabled feature.
- [ ] Keep primary actions visually dominant, secondary actions quiet, and destructive actions explicit with reason/confirmation.
- [ ] Prefer short, specific Thai copy. Explain the next action, not the internal implementation.

## 2. Shared component taxonomy

### Shell and navigation

| Component                    | Use for                                        | Do not use for              | Required behavior                                                     |
| ---------------------------- | ---------------------------------------------- | --------------------------- | --------------------------------------------------------------------- |
| `MemberChrome` / Admin shell | topbar, sidebar, drawer, footer, auth boundary | page-specific cards         | derives from canonical menu and closes/updates on route change        |
| Desktop sidebar              | persistent primary/secondary navigation        | content filters             | active parent for nested routes, permission/feature aware             |
| Mobile bottom nav            | five highest-frequency destinations            | every route or utility link | fixed safe-area placement, one active item, no duplicate drawer items |
| Drawer / More menu           | secondary, utility, and lower-frequency routes | primary CTA                 | focus trap, Escape, restore focus, scroll lock                        |
| Breadcrumb / page header     | Admin deep context and detail pages            | repeated marketing headline | one canonical title and parent route                                  |

### Cards and content blocks

| Variant           | Use for                                                    | Content limit                           | Rules                                                               |
| ----------------- | ---------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------- |
| Hero card         | one campaign/benefit/action that anchors the page          | 1 title, 1 subtitle, 1 CTA              | one dominant image, fixed aspect ratio, no dense form inside        |
| Metric tile       | one number with label and optional delta                   | label ≤ 24 Thai chars; value 1–2 lines  | same number format, icon, tone, and order across Home/Admin         |
| Quick-action tile | one frequent destination                                   | label ≤ 18 Thai chars                   | icon + label only; do not duplicate the full navigation description |
| List card         | one repeated item such as transaction, ticket, alert, game | title ≤ 48 chars; metadata ≤ 2 lines    | predictable leading icon, main value, status, trailing action       |
| Detail card       | grouped fields for one entity                              | 4–8 fields per group                    | use for review/context, not a dashboard metric wall                 |
| Status card       | one state requiring explanation or next action             | title + one explanation + max 2 actions | state tone must come from shared state map                          |
| Form card         | one logical step or section                                | 3–8 related fields                      | show validation near field and one summary at top when needed       |
| Empty/error card  | no data or failed data                                     | short cause + next action               | never use a blank card or generic “เกิดข้อผิดพลาด” only             |

- [ ] Add typed variants to the existing Member/Admin card primitives instead of adding route-specific card clones.
- [ ] Standardize card padding, border, radius, heading spacing, action alignment, and responsive collapse through tokens.
- [ ] Keep card content density appropriate: Home and marketing can breathe; Admin queues and finance history can be dense; neither should use the other’s density accidentally.
- [ ] Give every repeated card a stable key, accessible name, keyboard action, and predictable focus order.

### Actions, badges, and data display

- [ ] Define one Button hierarchy: primary gold, secondary outlined, quiet/text, danger red, and disabled/loading; do not invent route-specific button colors.
- [ ] Define one Badge/Status map for pending, reviewing, processing, completed, rejected, expired, cancelled, duplicate, failed, reversed, blocked, and maintenance.
- [ ] Use signed money colors only for direction; use status colors only for status. Never use green/red merely as decoration.
- [ ] Use one money formatter, date formatter, masked-value formatter, ID truncation rule, and long-text wrapping rule across Member and Admin.
- [ ] Use one icon map and stroke weight. Do not mix emoji, text glyphs, custom SVG, and outline icons for the same concept.
- [ ] Use a single table-to-card fallback pattern for mobile Admin queues and Member histories.

## 3. Content and copy budget

- [ ] Page title: one clear noun/verb, normally ≤ 32 Thai characters.
- [ ] Subtitle/description: one sentence, normally ≤ 120 characters; explain purpose or next step.
- [ ] Card title: ≤ 48 characters; no repeated page title prefix.
- [ ] Button: 1–4 words when possible; start with an action (`ฝากเงิน`, `ถอนเงิน`, `ดูรายละเอียด`, `ลองใหม่`).
- [ ] Field help: one sentence or one constraint; put policy details in an expandable/help link.
- [ ] Error: what happened + what the user can do next; never expose raw API, provider, risk, or SQL text.
- [ ] Empty state: what is empty + how to create/find the first item.
- [ ] Success state: confirmation + next destination; avoid repeating the whole submitted payload.
- [ ] Badge: short status only; put detail in the card/timeline.
- [ ] Avoid duplicate promotional claims, repeated “ปลอดภัย/มั่นใจ” blocks, and multiple CTAs that lead to the same route.

## 4. Data and state consistency

- [ ] Create one typed state registry consumed by Home, detail, history, notification, support context, and Admin review.
- [ ] Every route must define loading, empty, partial, error, offline, stale, maintenance, permission, success, retry, conflict, and session-expired behavior.
- [ ] Every mutation must define disabled/loading text, duplicate protection, server error mapping, retry safety, success destination, and rollback behavior.
- [ ] Every list must define pagination/infinite loading, stable ordering, filter reset, no-result state, and stale refresh behavior.
- [ ] Never show a metric tile from a different query snapshot than the list below it without a timestamp or refresh contract.
- [ ] Keep sensitive values masked by default and avoid persisting slips, KYC documents, passwords, OTPs, or raw payloads in UI state/storage/logs.

## 5. Duplicate and missing-work cleanup

### Consolidate or remove

- [ ] Consolidate Member Desktop, Mobile, Drawer, Home quick actions, and category rail into the canonical menu model.
- [ ] Consolidate Member/Admin card, metric, badge, notice, empty, error, loading, and action variants before adding new route-specific components.
- [ ] Consolidate duplicate wallet/ledger/transaction labels and route aliases; keep one canonical destination with redirects for legacy links.
- [ ] Consolidate icon rendering through `MemberIcon`/`AdminIcon`; remove emoji/glyph substitutes for production navigation.
- [ ] Consolidate duplicated fetch/mapping/formatting logic into feature boundaries and shared contracts.

### Add only where the product has a real gap

- [ ] Add a dedicated wallet overview route/component only if `/transactions` cannot represent available, locked, bonus, and total movement clearly.
- [ ] Add a dedicated bank capability flag only when bank-account visibility must be independently controlled from KYC.
- [ ] Add a timeline component where a lifecycle has three or more meaningful states; do not add timelines to simple static settings.
- [ ] Add a data table only for sortable/filterable multi-column Admin data; use cards/lists for small Member collections.
- [ ] Add a chart only when a trend/comparison supports a decision and an accessible text summary is provided.
- [ ] Add a new dependency only after an ADR records measured need, bundle impact, owner, migration boundary, and rollback.

## 6. Execution order and ownership

### P0 — correctness and navigation safety

- [ ] Canonicalize menu model, route aliases, active matching, feature gates, permission hiding, and badge ownership.
- [ ] Fix bank-account feature gating and any dead/duplicate links.
- [ ] Centralize finance/session/error/idempotency contracts before visual polish.

### P1 — shared visual system and high-frequency pages

- [ ] Finalize tokens, typography, icon map, shell, sidebar, bottom nav, card variants, buttons, badges, formatters, and state registry.
- [ ] Implement reference parity for Authentication, Home/Wallet, Deposit, Withdrawal, and Transactions.
- [ ] Implement Admin Dashboard, Operations, Review, and Finance surfaces using the same component taxonomy.

### P2 — completeness and accessibility

- [ ] Complete Games, Promotions/Bonus, Profile/Security, Notifications, Support, KYC, Providers, Settings, and Reports.
- [ ] Add all required loading/error/empty/offline/stale/permission states, keyboard/focus behavior, 200% zoom, reduced motion, and mobile keyboard coverage.

### P3 — polish and performance

- [ ] Remove remaining inline-style debt and brittle selectors after component ownership is stable.
- [ ] Tune imagery, micro-spacing, transitions, lazy loading, LCP/CLS, and bundle size against measured budgets.
- [ ] Retain visual baselines and mismatch ledger for every reference route.

## 7. Tool and skill routing

| Task                          | Use                                                       | Why                                                       | Output                                      |
| ----------------------------- | --------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------- |
| Inventory routes/components   | `rg`, `rg --files`, route audit scripts                   | fast repository-wide evidence                             | source-of-truth inventory                   |
| Refactor React components     | `apply_patch`, TypeScript, existing primitives            | small auditable edits                                     | shared component + unit tests               |
| React/Next performance review | `build-web-apps:react-best-practices`                     | avoid waterfalls, duplicate renders, bundle regressions   | performance notes and targeted fixes        |
| Rendered visual debugging     | `build-web-apps:frontend-testing-debugging`               | verify actual layout, not only build output               | screenshot, DOM, console, interaction proof |
| Browser verification          | Browser plugin if available; otherwise Playwright         | exercise menu, filters, drawers, forms, responsive states | desktop/mobile evidence                     |
| Accessibility                 | `@axe-core/playwright`, JSX a11y ESLint                   | catch rendered WCAG and keyboard defects                  | axe report + keyboard checklist             |
| Design system                 | `packages/design-tokens`, CSS contract audit              | prevent palette/spacing drift                             | token/variant inventory                     |
| Icon/media consistency        | existing icon components and CMS/storage contracts        | avoid visual and security drift                           | icon/media map, fallback evidence           |
| Performance budget            | bundle analyzer; Lighthouse CI only with stable staging   | measure before adding tools                               | JS/CSS/media/LCP budget report              |
| Release verification          | CI, route matrix, feature-flag audit, deployment metadata | prevent incomplete UI rollout                             | commit/evidence/rollback record             |

## 8. Completion gate

- [ ] No duplicate visible menu item or canonical route alias.
- [ ] Equivalent cards, badges, buttons, labels, formatters, and states look and behave the same.
- [ ] Copy fits the defined budget without clipping or excessive explanation.
- [ ] Desktop and Mobile preserve information priority while using the reference composition.
- [ ] All required state, accessibility, visual, browser, performance, and release evidence is retained.
- [ ] The worklist records intentional deviations, owner, reason, and follow-up instead of silently accepting inconsistency.
- [ ] Motion follows [`UI_MOTION_ANIMATION_CONTRACT.md`](./UI_MOTION_ANIMATION_CONTRACT.md) with reduced-motion and performance evidence.
