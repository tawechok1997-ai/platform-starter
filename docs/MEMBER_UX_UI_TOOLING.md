# Member UX/UI Tooling Worklist

Updated: 2026-07-16
Scope: `apps/web-member` and shared frontend contracts consumed by Member
Source of truth for Member UX/UI work: this file

Visual redesign target: [`docs/UI_DESIGN_REFERENCE.md`](./UI_DESIGN_REFERENCE.md). Active product brief: [`docs/MEMBER_UI_PRODUCT_BRIEF.md`](./MEMBER_UI_PRODUCT_BRIEF.md). Navigation source of truth: [`docs/UI_MENU_INFORMATION_ARCHITECTURE.md`](./UI_MENU_INFORMATION_ARCHITECTURE.md). Component, copy, state, duplicate-work, and execution source of truth: [`docs/UI_CONSISTENCY_COMPLETION_PLAN.md`](./UI_CONSISTENCY_COMPLETION_PLAN.md). Motion source of truth: [`docs/UI_MOTION_ANIMATION_CONTRACT.md`](./UI_MOTION_ANIMATION_CONTRACT.md). The supplied LUX88 Member boards are the acceptance reference for exact visual parity across Desktop and Mobile. Existing checked implementation items do not imply reference parity until visual evidence is retained.

> Current repository baseline: Next.js 15.5.18, React 19.2.7, TypeScript 5.7.3, custom Member components, shared CSS contracts under `packages/design-tokens`, `packages/api-client`, and Playwright. A checked item means the current implementation and repository-level verification exist. Partial work is split into checked implementation facts and unchecked remaining acceptance criteria.

## Status

- ✅ Done and verified
- 🧪 Implemented partially; acceptance criteria or regression evidence remains
- 🚧 In progress
- ⏳ Planned
- ⛔ Blocked
- 🧊 Deferred

## Verified repository snapshot

- [x] `@platform/web-member` lint passes
- [x] `@platform/web-member` TypeScript check passes
- [x] Member unit suite passes: 23/23 tests across auth/session redirect, public-route guards, refresh concurrency, finance/wallet helpers, and mutation idempotency contracts
- [x] Member production build passes: 29 App Router routes generated
- [x] R-013 token, primitive, responsive, accessibility-baseline, and visual-contract audits pass
- [x] Six named public visual viewport projects exist: 360×800, 390×844, 430×932, 768×1024, 1024×768, and 1440×900
- [ ] Run and retain current Playwright browser evidence for every Member route and required state
- [x] Add automated axe WCAG A/AA scanning for six public/auth routes with retained CI reports
- [ ] Retain a current passing axe browser artifact; local execution is blocked until a Playwright Chromium binary is available
- [x] Fix the build warning that the Next.js ESLint plugin is not detected

## Member Definition of Done

- Mobile-first and usable at all six standard viewports.
- Uses real API, authentication, settings, finance, KYC, notifications, support, and provider behavior.
- Handles loading, empty, error, offline, stale, permission, maintenance, success, retry, and session-expired states.
- Primary actions remain reachable above safe areas and the mobile keyboard.
- Keyboard, visible focus, 200% zoom, screen-reader labels, and reduced motion work.
- Long Thai text, money, IDs, filenames, and missing media do not overflow.
- Mutations prevent duplicate submit and preserve idempotency and API error semantics.
- Relevant build, unit/component, Playwright, accessibility, and visual checks pass with retained evidence.

# M0: Current foundation and debt inventory

## MEMBER-FOUNDATION-001 Current tooling

- [x] Next.js 15.5.18, React 19.2.7, TypeScript 5.7.3
- [x] Custom Member React components and feature views
- [x] Shared CSS token and primitive contracts imported by the Member root layout
- [x] Responsive CSS, safe-area rules, animations, transitions, and `prefers-reduced-motion`
- [x] Shared `packages/api-client`
- [x] Playwright smoke, visual, authenticated-visual, KYC, and CMS configurations
- [x] Route build inventory: 29 generated routes, including 27 Member `page.tsx` files
- [x] Inventory every Member/Public/Auth route, feature flag, API dependency, page owner, deep link, and state gap in `docs/MEMBER_ROUTE_MATRIX.md`
- [ ] Inventory shared React components and duplicate variants
- [ ] Inventory and migrate 180 inline-style occurrences in Member TSX
- [ ] Replace 17 selectors coupled to `[style*="..."]` with semantic classes
- [ ] Define ownership for shared tokens, global CSS, component CSS, layout utilities, and route-specific styles

## MEMBER-FOUNDATION-002 Tooling decisions

- [x] Shared CSS contracts retained as the current design-system foundation
- [ ] Evaluate `react-hook-form` plus `zod`; current forms use local React state and manual validation
- [ ] Evaluate `@tanstack/react-query`; current server state primarily uses `useEffect`, `useState`, and `memberApiFetch`
- [ ] Evaluate `motion` only where CSS cannot handle mount/unmount transitions
- [x] Add `@axe-core/playwright` and JSX accessibility lint rules
- [ ] Evaluate `lucide-react`; current Member icons use the custom `MemberIcon` implementation
- [ ] Evaluate carousel, upload, image-compression, drawer, virtualization, and table libraries only where measured need exists
- [ ] Record an ADR, bundle impact, migration scope, owner, and rollback plan for every accepted dependency
- [ ] Do not add another design system or state/form layer without an approved ADR and demonstrated need

# M1: Shared Member systems

## MEMBER-FOUNDATION-003 Reference-driven visual redesign

- [ ] Adopt the shared LUX88 visual language: deep navy shell, elevated navy panels, gold primary accent, white/muted text, thin borders, restrained radii, and outline icons.
- [ ] Map the shared brand header, desktop sidebar, mobile bottom navigation, topbar, metric tile, card, badge, tab, filter, timeline, modal, and sticky-action patterns to reusable Member components.
- [ ] Match typography, Thai/Latin hierarchy, money figures, icon stroke, spacing, control heights, card density, image ratios, and decoration against `docs/UI_DESIGN_REFERENCE.md`.
- [ ] Produce approved Desktop and Mobile visual baselines for every Member reference route at all six standard viewports.
- [ ] Require visual-diff review for any change to tokens, shared CSS, imagery, fonts, layout primitives, or route shell.

## MEMBER-FOUNDATION-004 Menu and information architecture consistency

- [ ] Replace separate Desktop, Mobile, Drawer, Home quick-action, and category-rail definitions with the canonical menu model in `docs/UI_MENU_INFORMATION_ARCHITECTURE.md`.
- [ ] Normalize labels (`ฝากเงิน`, `ถอนเงิน`, `กระเป๋าเงิน/รายการ`, `โปรโมชัน`, `โปรไฟล์`) and icon semantics across all surfaces.
- [ ] Move Mobile to the reference order: หน้าแรก, กระเป๋าเงิน/รายการ, ฝากเงิน, โปรโมชัน, โปรไฟล์; expose secondary actions through More/Drawer.
- [ ] Resolve the bank-account feature-flag mismatch and document the dedicated capability contract.
- [ ] Add menu route, active-state, feature-flag, permission, deep-link, and alias tests before visual approval.

## MEMBER-SYSTEM-001 Design tokens and primitives

- [x] Shared color, spacing, radius, shadow, typography, motion, breakpoint, content-width, and z-index contracts
- [x] Shared CSS contracts for Button, Input, Select, TextArea, Modal, Drawer, ConfirmDialog, Table, Pagination, Tabs, Badge, Toast, Alert, Skeleton, Empty, Error, and responsive layout
- [x] Shared focus-visible, invalid-field, screen-reader-only, skip-link, reduced-motion, and forced-colors baselines
- [x] Member-level `MemberButton`, `MemberCard`, `MemberNotice`, `MemberEmptyState`, and link-button components
- [x] Finance step indicator, cards, action bar, confirm dialog, empty state, info rows, and status badge
- [ ] Migrate remaining route CSS and hard-coded values to shared semantic tokens
- [ ] Consolidate React Input, Select, TextArea, Checkbox, Radio, OTP, Field, BalanceCard, Toast, Skeleton, Error, and Success components
- [ ] Consolidate BottomSheet, Tabs, Timeline, Pagination, FilterBar, and StickyActionBar React components
- [ ] Create FileUpload, FilePreview, Progress, cancel/retry, and secure-download feedback components
- [ ] Create reusable carousel/rail behavior with swipe and keyboard support
- [ ] Remove duplicate Member/Finance control and state implementations
- [ ] Add component tests for critical primitives; the current Member suite covers auth redirect and finance/wallet helpers only

## MEMBER-SYSTEM-002 Motion and interaction

- [x] Shared duration, easing, breakpoint, and reduced-motion tokens
- [x] CSS handles hover, focus, press, skeleton, shimmer, drawer, and simple state transitions
- [x] Finance confirm dialog traps focus, closes with Escape, and restores focus
- [x] Member drawer closes with Escape and locks document scrolling
- [ ] Add drawer focus trap, initial focus, and focus restoration
- [ ] Prevent remaining layout shifts during content, media, and status transitions
- [ ] Verify reduced motion and keyboard-only interaction in browser tests
- [ ] Verify animation performance on iPhone-class viewports
- [ ] Add a motion library only if measured interaction requirements cannot be met with CSS
- [ ] Apply the approved motion map from `docs/UI_MOTION_ANIMATION_CONTRACT.md` to auth focus/validation, Home hero/cards, drawers, finance steps, upload progress, timelines, and carousel controls
- [ ] Add explicit reduced-motion browser evidence for Member shell, finance flow, promotions, and support interactions
- [ ] Verify motion does not cause layout shift, duplicate fetches, focus loss, touch-target movement, or delayed financial/security actions

## MEMBER-SYSTEM-003 Forms and validation

- [x] Deposit form parsing, selection validation, serialization, API-message fallback, and unit coverage
- [x] Unsaved-change detection and optimistic snapshot/rollback helpers
- [x] Login/Register use autocomplete, show/hide password, manual inline validation, anti-bot, loading, timeout, and server feedback
- [x] Critical mutations generally disable controls and show progress text
- [ ] Create shared field adapters after the RHF/Zod decision
- [ ] Map server error codes without parsing raw error text; Register still parses message content
- [ ] Add focus-first-error and validation-summary behavior
- [ ] Apply dirty-state and unsaved-change behavior to actual editable routes
- [ ] Add Caps Lock, password-strength, OTP countdown/resend, and attempt-exhaustion patterns
- [ ] Standardize upload type/size/content validation, preview, progress, cancel, and retry
- [ ] Add idempotency-aware duplicate-submit protection for all financial and account mutations; Deposit and Withdrawal are covered
- [ ] Add form component and browser regression tests

## MEMBER-SYSTEM-004 Server state

- [x] Auth-aware `MemberSessionProvider` and centralized `memberApiFetch`
- [x] Finance query-key and invalidation contracts exist
- [x] Notifications implement optimistic read/archive/preference updates with rollback
- [x] Support implements 60-second ticket refresh and reply states
- [x] Restore and validate the intended internal `?next=` destination after Login, with unsafe/external destinations rejected
- [ ] Define shared stale-time, retry, cancellation, invalidation, and polling policies
- [x] Serialize concurrent refresh-token requests and route invalid sessions through `/session-expired` with a validated return destination
- [x] Preserve stored sessions and the last known wallet during transient network or 5xx failures instead of logging the Member out
- [ ] Present a shared offline/reconnected state and retry policy across Member routes
- [ ] Standardize optimistic rollback and version-conflict handling across domains
- [ ] Migrate page-level `useEffect + useState + fetch` orchestration by domain if TanStack Query is approved

# M2: Public and authentication

## MEMBER-AUTH-001 Login and registration

- [x] Responsive Login with desktop split layout and mobile single-column layout
- [x] Username/phone/email identifier, password-manager autocomplete, show/hide password, anti-bot, timeout, loading, and server feedback
- [x] Multi-step Registration with legal name, bank selection, referral, terms, review, and success handling
- [x] Login/Register visual specs are configured for the six standard public viewports
- [ ] Add Caps Lock warning, remember-me decision, lockout messaging, and focus-first-error
- [x] Restore a validated internal destination after successful Login
- [ ] Add contact verification/OTP and expired/exhausted verification states
- [ ] Add confirm-password and password-strength behavior
- [ ] Verify 200% zoom, long Thai text, keyboard, screen reader, and accessibility in browsers

## MEMBER-AUTH-002 Password recovery and public states

- [x] Legal index/detail, Contact, Maintenance, and Session-expired routes
- [x] Public responsive and safe-area CSS
- [x] CMS-backed public content and fallback layouts exist
- [ ] Implement Forgot password and Reset password routes
- [ ] Handle expired, already-used, invalid, retry, and session-revoke reset states
- [ ] Verify broken media, long CMS content, mobile keyboard, visual, and accessibility regressions

# M3: Member route worklist

## MEMBER-ROUTE-001 Home and navigation

- [x] Active navigation, desktop navigation, Member drawer, mobile bottom navigation, feature-flag blocking, and auth redirect
- [x] Home promotion hero, announcements, quick actions, pending requests, game rails, categories, FAQ, and recent activity
- [x] Home recent activity supports loading, empty, error, and retry states
- [x] Safe-area rules and pending notification/transaction badge behavior
- [x] Replace the hard-coded topbar wallet value with session wallet data, including loading, focus refresh, and post-withdraw refresh
- [ ] Add scroll restoration, route loading, stale timestamp, complete partial-failure handling, and skeletons
- [ ] Complete six-viewport authenticated Home/navigation evidence
- [ ] Match the Member Home & Wallet reference: desktop sidebar/topbar/dashboard, balance tiles, quick actions, promotion/game rails, activity list, mobile wallet summary, and fixed bottom navigation

## MEMBER-ROUTE-002 Games lobby and launch

- [x] Search, provider/category filters, local favorites, recent games, featured/new/popular sections
- [x] Lazy media, fallback media, unavailable state, maintenance label, no-result state, and duplicate-launch disabling
- [ ] Add search debounce and URL/deep-link filter state
- [ ] Add swipe and keyboard carousel/rail behavior
- [ ] Add provider-down, popup-blocked, session-expired, and retry states
- [ ] Persist favorites through the real API with optimistic rollback if supported
- [ ] Measure large-catalog performance before adding virtualization
- [ ] Add authenticated browser and performance regression
- [ ] Match the Games, Promotions & Bonus reference composition across desktop and mobile, including hero, provider chips, category rails, card density, and bottom navigation

## MEMBER-ROUTE-003 Deposit

- [x] Staged select, transfer, review, submit, waiting, and create-another flow
- [x] Real receiving-account selection, min/max account matching, copy feedback, and 15-minute expiry
- [x] Image-only slip validation, resize/compression, preview, confirm dialog, duplicate result, and history
- [x] Loading controls and mobile sticky-action CSS
- [ ] Add explicit file-size and content validation
- [ ] Add upload progress, cancel, and retry
- [ ] Add currency-formatting input and clearer min/max feedback
- [x] Add request idempotency and recovery when top-up creation succeeds but evidence upload fails
- [ ] Complete pending, approved, rejected, expired, retry, duplicate, and timeline browser evidence
- [ ] Match the Deposit Flow reference: four-step indicator, account/QR/instructions layout, upload/review panels, sticky mobile actions, and status timeline

## MEMBER-ROUTE-004 Withdrawal

- [x] Available/locked wallet, active bank selection, insufficient-balance validation, review dialog, and history
- [x] Bonus-turnover blocking and mutation progress
- [ ] Add configured min/max, presets, fee, and net-amount calculation
- [ ] Add step-up/OTP, KYC-required, watchlist-blocked, and explicit session-expired states
- [ ] Add cancel/retry actions and complete status timeline
- [x] Add idempotency-aware duplicate-submit protection
- [ ] Complete responsive withdrawal regression
- [ ] Match the Withdraw & Bank Accounts reference: wallet summary, selected/verified bank cards, presets, fee/net calculation, confirmation CTA, and mobile flow

## MEMBER-ROUTE-005 Transactions, wallet, and bank accounts

- [x] Transaction list with credit/debit summaries and before/after balances
- [x] Bank-account list/add flow, primary/status display, loading, empty, and error feedback
- [x] Profile and Home expose wallet information from real API responses
- [ ] Add transaction type/status/date filters with URL state
- [ ] Add pagination and transaction detail/timeline
- [ ] Add fee, reference, masked account, and long-value handling
- [ ] Add wallet available/locked/bonus/total movement summary screen
- [ ] Add bank verify, edit, set-default, disable, duplicate detection, re-authentication, and cooling-policy flows
- [ ] Add accessibility and responsive regression
- [ ] Match the Wallet Overview and Transaction History reference: balance tiles, masking affordance, segmented filters, date control, signed amounts, and mobile list layout

## MEMBER-ROUTE-006 Profile and security

- [x] Profile summary, edit profile, password, security center, session list, current-device marker, revoke-one, revoke-others, and login history routes
- [x] KYC status is exposed from Profile
- [ ] Add independent section saves and actual dirty-state protection
- [ ] Add phone/email verification, OTP resend, exhaustion, and duplicate-value states
- [ ] Complete password requirements, current-password errors, success feedback, and optional 2FA decision
- [ ] Add privacy-safe blocked states and authenticated keyboard/zoom regression
- [ ] Match the Account, Security & Support reference across profile, security, notifications, support, and mobile navigation compositions

## MEMBER-ROUTE-007 KYC

- [x] Status summary, requirement checklist, document upload, document list, and submission panel
- [x] Identity/selfie completeness check, submit lock, loading, empty, and API error states
- [x] Four-viewport KYC regression exists for 390, 768, 1024, and 1440 widths
- [ ] Add explicit file type/size/content validation and image/PDF preview
- [ ] Add upload progress, cancel, retry, and navigation blocking during upload
- [ ] Complete pending, approved, rejected, expired, and resubmit presentation
- [ ] Highlight rejected documents and review notes consistently
- [ ] Explain privacy, retention, and secure access
- [ ] Extend KYC regression to all six standard viewports and accessibility scanning

## MEMBER-ROUTE-008 Promotions and bonus

- [x] Promotion campaign list, eligibility from approved deposits, claim flow, claim status, bonus ledger, turnover progress, and history
- [x] Loading/error fallback and responsive promotion grid
- [ ] Add explicit available, claimed, active, expired, and ineligible filtering/presentation
- [ ] Add terms summary, expiry countdown, and claim confirmation
- [ ] Add optimistic claim feedback with rollback
- [ ] Remove remaining inline styles from Bonus
- [ ] Add responsive authenticated regression

## MEMBER-ROUTE-009 Notifications

- [x] Unread state, type filters, mark-one, mark-all, archive, preferences, loading, empty, optimistic feedback, and rollback
- [x] Accessible labels and status announcements exist for primary notification actions
- [ ] Group notifications by date
- [ ] Add missing/expired deep-link state
- [ ] Add channel-unavailable and explicit session-expired states
- [ ] Add API-backed pagination or infinite loading when required
- [ ] Verify badge consistency and screen-reader announcements in browser tests

## MEMBER-ROUTE-010 Support and FAQ

- [x] FAQ search/category/no-result states
- [x] Ticket create validation, preview, linked finance context, list filtering, reply states, polling, and automatic reopen behavior
- [x] Mobile composer and responsive Support CSS exist
- [ ] Add ticket draft restoration
- [ ] Add attachment type/size/progress/cancel/retry flows
- [ ] Add explicit polling disconnect/reconnect feedback
- [ ] Measure long-thread performance and add regression coverage
- [ ] Complete keyboard-overlap and accessibility browser testing

# M4: Accessibility and QA

## MEMBER-QA-001 Accessibility automation

- [x] Shared focus, invalid-field, reduced-motion, forced-colors, skip-link, dialog semantics, contrast, and static audit contracts
- [x] Add `@axe-core/playwright` for the public/auth accessibility gate; authenticated route coverage remains
- [x] Fail the Member UI quality workflow on WCAG A/AA axe violations for the initial public/auth route set
- [ ] Verify headings, labels, ARIA live regions, dialogs, drawers, bottom sheets, file inputs, and icon-only buttons in rendered pages
- [ ] Verify keyboard navigation, focus trap/restore, 200% zoom, reflow, contrast, and reduced motion in rendered pages

## MEMBER-QA-002 Visual and interaction evidence

- [x] Public visual configuration covers all six standard viewports
- [x] Authenticated visual fixture and KYC responsive fixtures exist
- [x] Browser-quality fixture can fail on console errors, page errors, failed requests, and HTTP 5xx responses
- [x] CI workflows can upload screenshots, traces, console, network, and HTML reports
- [ ] Persist approved visual baselines; the R-013 workflow currently generates and compares baselines in the same run
- [ ] Expand authenticated Member visual coverage from two projects to all six standard viewports
- [ ] Cover every Member route and loading, empty, error, offline, stale, permission, maintenance, success, and session-expired states
- [ ] Ensure all relevant suites use the browser-quality failure fixture
- [ ] Retain final evidence links in this document
- [ ] Use `docs/UI_DESIGN_REFERENCE.md` as the visual parity gate and retain approved baselines for every Member reference board

# M5: Product and operational contracts

## MEMBER-CONTRACT-001 Work-item metadata and closure

- [ ] Assign every remaining item a priority: P0 correctness/security/money, P1 core flow, P2 quality/accessibility, or P3 polish
- [ ] Record owner, dependency, target milestone, API readiness, and evidence link for every P0/P1 item
- [x] Record priority, frontend/API owner, milestone, API readiness, and evidence for all 27 current Member routes
- [ ] Separate current implementation facts, known defects, remaining work, and verification gates in progress summaries
- [ ] Do not close a parent item when only one sub-state or viewport is implemented
- [ ] Require code, automated check, retained artifact, and rollback note where the change affects money, identity, or session behavior

## MEMBER-CONTRACT-002 Route, API, feature-flag, and state matrix

- [x] Maintain one table covering every Member route, page owner, primary APIs, feature flags, permissions, CMS/settings dependencies, and deep links
- [x] Record loading, empty, partial-failure, error, offline, stale, maintenance, success, retry, and session-expired behavior per route
- [ ] Verify navigation, direct URL access, and server behavior remain consistent when each Member feature flag is disabled
- [ ] Verify branding, long CMS content, missing settings, broken media, and runtime setting changes do not break layout or expose disabled actions
- [x] Audit the route matrix in Member UI CI so new `page.tsx` files cannot bypass ownership and state requirements

## MEMBER-CONTRACT-003 Security and privacy UX

- [ ] Mask bank accounts, phone numbers, email addresses, references, and identity values according to one shared display policy
- [ ] Require re-authentication or step-up verification before sensitive profile, bank, session, and withdrawal actions
- [ ] Clear sensitive cached UI state after logout, session expiry, account switching, and permission/feature reduction
- [ ] Never persist slips, KYC documents, OTP values, passwords, or raw sensitive payloads in local storage or browser logs
- [ ] Map safe public error codes and prevent raw backend, risk, watchlist, or provider details from reaching Member UI
- [ ] Define secure-download, expired-link, revoked-file, privacy, and retention feedback for KYC and financial evidence
- [ ] Add browser checks for token leakage, sensitive console output, unsafe URLs, and post-logout back-navigation

## MEMBER-CONTRACT-004 Finance state contract

- [ ] Maintain one typed UI mapping for Deposit, Withdrawal, Bonus, Wallet, and reconciliation states
- [ ] Define Thai label, tone, icon, description, available actions, polling policy, retry/cancel policy, and destination route for every state
- [ ] Distinguish pending, reviewing, approved, processing, completed, rejected, expired, cancelled, duplicate, failed, reversed, and reconciliation-required states
- [ ] Use the same state mapping in Home, detail, history, notification, support context, and finance flows
- [ ] Add contract tests that fail when the API introduces an unmapped finance status

## MEMBER-CONTRACT-005 Performance budget

- [ ] Establish an approved baseline from the current 102 kB shared first-load JS build output
- [ ] Set route-level JavaScript, CSS, image, request-count, LCP, CLS, and interaction budgets for Login, Home, Games, Deposit, and Withdrawal
- [ ] Measure dependency and bundle impact before accepting a new Member runtime package
- [ ] Enforce stable media dimensions, image compression limits, lazy loading, and missing-media fallbacks
- [ ] Measure Games catalog and Support long-thread performance before adding virtualization
- [ ] Store bundle and performance reports as CI artifacts and fail only on agreed regression thresholds

## MEMBER-CONTRACT-006 Browser, test-data, release, and rollback matrix

- [ ] Define supported iOS Safari, Android Chrome, desktop Chrome, Safari, and Edge versions
- [ ] Cover portrait, landscape, mobile keyboard, 200% zoom, reduced motion, slow network, offline, and session-expiry behavior
- [ ] Create deterministic fixtures for new Member, active Member, empty history, KYC states, bonus blocking, insufficient balance, duplicate slip, provider maintenance, long notifications, and long support threads
- [ ] Keep production-like credentials outside the repository and scope them to isolated staging data
- [ ] Define feature-flag rollout, smoke checks, monitoring window, rollback trigger, and rollback procedure for every P0/P1 release
- [ ] Record the deployed commit identity and verify Member/API compatibility before accepting production evidence

# M6: Tool adoption plan

## MEMBER-TOOLING-001 Add now

- [x] Add `eslint-config-next` to the existing ESLint flat configuration to enable Next.js, React, and React Hooks rules and remove the current build warning
- [x] Add `eslint-plugin-jsx-a11y` with an explicit flat-config ruleset for fast JSX accessibility feedback
- [x] Add `@axe-core/playwright` to the existing Playwright stack and fail on WCAG A/AA violations across the initial public/auth route set
- [x] Add `@next/bundle-analyzer` plus reproducible `analyze:web-member` / Member `analyze` commands and a manually triggered retained CI artifact
- [ ] Reuse the existing Playwright browser-quality fixture, six-viewport projects, traces, screenshots, and network evidence instead of introducing another E2E runner

## MEMBER-TOOLING-002 Pilot behind an ADR

- [ ] Pilot `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/user-event`, and `@testing-library/jest-dom` on shared Client Components before replacing or expanding the current Node test runner
- [ ] Pilot `msw` only if reusable API-state fixtures reduce duplicated `page.route` and component-test mocks
- [ ] Pilot `@lhci/cli` after stable staging data exists, then enforce agreed performance budgets rather than default Lighthouse scores
- [ ] Evaluate Storybook only after shared React primitives are consolidated and a maintained component-state catalog has an owner
- [ ] Evaluate client error monitoring only after confirming existing production observability cannot capture Member route, release, and session context

## MEMBER-TOOLING-003 Do not add yet

- [ ] Do not add Cypress while Playwright remains the repository E2E and visual standard
- [ ] Do not add React Hook Form/Zod until form inventory proves shared adapters will replace, rather than duplicate, current validation
- [ ] Do not add TanStack Query until query ownership, cache policy, auth refresh, and migration boundaries are approved
- [ ] Do not add Motion until CSS transitions fail a measured interaction requirement
- [ ] Do not add Lucide until icon inventory, CMS icon behavior, and migration cost are recorded
- [ ] Do not add Tailwind, shadcn, Radix, MUI, Ant Design, or another design system while the shared CSS contracts remain authoritative

# Execution order

1. Adopt `docs/UI_DESIGN_REFERENCE.md`, `docs/UI_MENU_INFORMATION_ARCHITECTURE.md`, and `docs/UI_CONSISTENCY_COMPLETION_PLAN.md`
2. Normalize the canonical Member menu and route aliases before styling each route
3. Inventory shared cards, buttons, badges, formatters, state mappings, copy, and duplicate implementations
4. Add priority/owner/dependency metadata and create the route/API/feature/state matrix
5. Fix P0/P1 correctness gaps: wallet header, Login destination, finance idempotency/recovery, session handling, and password recovery
6. Add Next.js ESLint rules, JSX accessibility linting, axe Playwright, persistent visual baselines, and bundle analysis
7. Complete MEMBER-FOUNDATION-001 inventory and removal of brittle style selectors
8. Consolidate React primitives, finance state mapping, privacy/masking rules, copy budgets, and inline-style migration
9. Implement Member reference parity route by route, starting with Authentication, Home/Wallet, and Finance
10. Approve forms and server-state ADRs only after inventory and pilot evidence
11. Close Deposit, Withdrawal, Transactions/Wallet/Bank, Profile/Security, and KYC gaps
12. Close Games, Promotions/Bonus, Notifications, and Support gaps
13. Enforce browser/test-data/performance matrices, six-viewport authenticated regression, release, rollback, and final visual parity review

# Evidence log

- Repository commit audited: `eff5bf8622d9492f845bfe98e2c514c0e3682bac`
- Member lint: passed with Next.js/Core Web Vitals and JSX accessibility rules on 2026-07-16; 38 existing migration warnings are now visible
- Member typecheck: passed on 2026-07-16
- Member unit tests: 23/23 passed on 2026-07-16
- Member production build: passed; 29 routes generated on 2026-07-16
- Member route matrix audit: 27/27 `page.tsx` routes classified with 22 P0/P1 routes and 24 routes carrying explicit state gaps on 2026-07-16
- R-013 static contracts: token, primitive, responsive, accessibility baseline, and visual contract passed on 2026-07-16
- Railway commit statuses: Member, API, and Admin succeeded for the audited commit
- Visual artifact: current full browser run not attached
- Accessibility artifact: static contract passed; axe CI gate covers six public/auth routes, while a current passing browser artifact remains pending
- Bundle report: Next.js build reports 102 kB shared first-load JS; route-specific output recorded in build log
- Installed immediate dev tools: `eslint-config-next`, `eslint-plugin-jsx-a11y`, `@axe-core/playwright`, and `@next/bundle-analyzer`
- Recommended pilot tools: Vitest + Testing Library + jsdom, MSW, and Lighthouse CI; adoption requires ADR and measured value
- Remaining blockers: priority/ownership metadata, route/API/state matrix, persistent approved visual baselines, full authenticated six-viewport/state coverage, current passing axe browser evidence, and production-like credentials for full browser flows
- Visual redesign blocker: supplied reference parity is specified in `docs/UI_DESIGN_REFERENCE.md`, but approved route-by-route screenshots have not yet been retained
