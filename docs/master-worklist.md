# UX/UI Execution Worklist

Updated: **2026-07-15**  
Project-wide source of truth: [`docs/master-project-worklist.md`](./master-project-worklist.md)

This file is the active **UX/UI-only execution tracker** for Member Web, Admin Web and Public/Auth. It is subordinate to the project master and must not redefine backend, security, finance, provider or architecture completion.

## Current context

- ✅ Backend architecture R-001 through R-011 is complete.
- 🚧 R-012 frontend feature/page decomposition is in progress.
- 🚧 R-013 shared UI system, accessibility and visual regression is in progress.
- ⏳ R-014 observability/documentation/cleanup remains mostly open.
- ⏸️ Authenticated browser evidence requires safe seeded credentials and approved deployed environments.

## Standard viewports

- 360×800
- 390×844
- 430×932
- 768×1024
- 1024×768
- 1440×900

## UX/UI definition of done

A route or surface is complete only when all applicable checks pass:

- Uses the real shared API client, authentication, permissions and domain behavior.
- Uses shared types, design tokens and UI primitives or documents an approved exception.
- Covers loading, empty, error, disabled, success, conflict, maintenance, stale-data and retry states where relevant.
- Works at all six standard viewport sizes without critical horizontal scrolling.
- Supports keyboard navigation, visible focus, reduced motion, 200% zoom and useful ARIA semantics.
- Handles long Thai text, long identifiers, large money values and missing/oversized media.
- Preserves idempotency, locks, retries, deep links, pagination, filters and normalized errors.
- Passes the relevant build, component, browser and visual checks.
- Records commit, test, screenshot/trace or deployment evidence.

# Active queue

## R-012 — Frontend feature architecture

Status: **🚧 IN PROGRESS**

- [x] Begin container/presentation separation in critical Member finance flows.
- [ ] Complete Admin feature/domain folder organization and public exports.
- [ ] Complete Member feature/domain folder organization and public exports.
- [ ] Finish register, deposit, withdrawal, provider, CMS, promotion, security, KYC and support page decomposition.
- [ ] Separate schemas, defaults, serialization and error mapping from page components.
- [ ] Separate server state from UI state and standardize query keys/invalidation.
- [ ] Add component/unit regression for extracted boundaries.
- [ ] Verify unsaved-change and optimistic rollback behavior.

## R-013 — UI system and accessibility

Status: **🚧 IN PROGRESS**

- [x] Remove unused legacy UI files and the empty unused UI package.
- [x] Establish shared semantic design-token foundation and begin Admin/Member adoption.
- [ ] Finish color, spacing, radius, shadow, typography, motion, breakpoint and z-index token adoption.
- [ ] Consolidate Button/Input/Select/TextArea primitives.
- [ ] Consolidate Modal/Drawer/ConfirmDialog primitives.
- [ ] Consolidate Table/Pagination/Tabs/Badge primitives.
- [ ] Consolidate Toast/Alert/Skeleton/Empty/Error state primitives.
- [ ] Standardize mobile-first table→card, modal→bottom-sheet and sidebar→drawer patterns.
- [ ] Complete keyboard/focus/ARIA, reduced-motion and contrast baseline.
- [ ] Complete authenticated six-viewport visual regression.
- [ ] Store screenshot, trace, console and network artifacts in CI.

## Authenticated regression queue

Status: **⏸️ EXTERNALLY BLOCKED until safe credentials/environment are available**

Minimum Admin coverage:

- Dashboard, Reports, Activity, Risk, Deposits, Withdrawals, Wallets, Ledgers, Providers, Games, Support, Settings and KYC.

Minimum Member coverage:

- Home, Deposit, Withdrawal, Transactions, Bank Accounts, Games, Promotions, Profile, Security, Notifications, Support and KYC.

Required checks:

- six standard viewports
- keyboard-only operation and visible focus
- 200% zoom and long Thai text
- permission-hidden/blocked mutations
- loading/empty/error/retry/conflict states
- browser console and failed-network gates
- no credentials, tokens or private media in artifacts

## Public/Auth baseline

Status: **⏸️ BLOCKED in environments where Playwright browsers cannot be installed**

Routes:

- Login
- Register
- Maintenance
- Session expired
- Legal
- Contact

Commands:

```bash
pnpm test:e2e:visual:update
pnpm test:e2e:visual
pnpm build:web-admin
pnpm build:web-member
```

## UX priorities after R-012/R-013

1. Finish authenticated Admin/Member regression with seeded non-production accounts.
2. Close responsive money-flow duplicate/retry/error-state coverage.
3. Verify provider-down and game-launch failure states.
4. Verify Support threads, Notifications rollback and CMS/settings flows.
5. Record the final six-viewport matrix in the project evidence documents.

## Execution rules

- Do not create duplicate API transports, responsive routes, validation, permission or finance logic.
- Do not change shared shells, tokens or primitives in parallel without explicit ownership.
- Do not mark visual/browser work complete without artifacts from an actual run.
- Do not run destructive database commands or real-money flows for UI verification.
- Update [`docs/master-project-worklist.md`](./master-project-worklist.md) whenever an item changes project-wide status.
