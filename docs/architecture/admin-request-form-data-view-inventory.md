# Admin Request, Form, and Data-View Inventory

Updated: 2026-07-21  
Status: Active baseline  
Scope: `apps/web-admin` only

## Purpose

This inventory records the current Admin implementation patterns that must be normalized before adding query, form, or table dependencies. It is a pattern-level inventory for Batch 1, grounded in representative high-risk routes and the canonical Admin route map.

No Member, API, Prisma, wallet, provider, finance-contract, or permission behavior is changed by this document.

## Sources inspected

Verified implementation files:

- `apps/web-admin/app/(admin)/topups/page.tsx`
- `apps/web-admin/app/(admin)/withdrawals/page.tsx`
- `apps/web-admin/app/(admin)/members/page.tsx`
- `docs/ADMIN_MENU_INFORMATION_ARCHITECTURE.md`
- `docs/architecture/admin-server-state-policy.md`
- `docs/architecture/admin-form-mutation-safety.md`
- `docs/architecture/admin-data-view-contract.md`

The three inspected routes represent the highest-risk recurring Admin patterns:

- financial review queue with claim/release and staged approval;
- financial payment queue with file upload and verification;
- searchable member directory with permission masking and status mutation.

## 1. Request orchestration inventory

| Pattern | Current implementation | Verified routes | Risk | Batch 1 direction |
| --- | --- | --- | --- | --- |
| Page-owned initial fetch | `useEffect` invokes a local async loader | topups, withdrawals, members | duplicated loading/error/cache behavior | central policy first; dependency ADR later |
| Filter-driven fetch | local `status`, `page`, search state in effect dependencies | topups, withdrawals, members | URL is not canonical; refresh/back may lose state | move filter state to URL contract |
| Permission fetch | separate `/admin/auth/me` request | members | repeated permission loading and stale access risk | central session/permission owner |
| Secondary asset fetch | fan-out requests after primary list load | topup slips, withdrawal proofs | duplicate requests, race conditions, unbounded fan-out | cancellation, dedupe, bounded concurrency |
| Manual refresh | button calls page loader directly | all inspected routes | refresh behavior varies by page | shared refresh semantics |
| Mutation refresh | mutation either patches local list or reloads page | all inspected routes | inconsistent rollback and stale-state handling | mutation contract plus targeted invalidation |
| Error mapping | response JSON read locally and message selected inline | all inspected routes | inconsistent session, permission and conflict handling | central error-code mapping |
| Loading state | local boolean or notice text | all inspected routes | inconsistent skeleton/empty transition | shared request state model |
| Cancellation | absent in inspected loaders | all inspected routes | stale response may overwrite newer filter result | AbortSignal required by policy |
| Retry | manual user refresh only | all inspected routes | no centralized retry classification | policy-based retry only for safe reads |

### Request ownership conclusion

The current implementation has enough duplicated orchestration to justify a central request abstraction, but this inventory alone does not justify installing TanStack Query. The ADR must compare:

1. a small internal `adminRequest`/hook layer;
2. framework-native fetch and server boundaries;
3. TanStack Query bundle and migration cost.

## 2. Forms and mutation inventory

| Mutation/form type | Current validation | Confirmation | Duplicate-submit control | Mandatory reason | Verified routes |
| --- | --- | --- | --- | --- | --- |
| Top-up approve/confirm/reject | local string checks | `AdminConfirmDialog` | `busyId` | reject only | topups |
| Claim/release queue item | none beyond item state | direct action | `busyId` | no | topups, withdrawals |
| Withdrawal approve/verify/reject | local checks | `AdminConfirmDialog` | `busyId` | reject only | withdrawals |
| Payment-proof upload | MIME, size, image and transaction reference checks | direct action | `busyId` | operational note optional | withdrawals |
| Member search/filter | browser form submit plus trim | none needed | not applicable | no | members |
| Member status change | local required-string check | `AdminConfirmDialog` | `busyId` | yes | members |

### Repeated form characteristics

- state is owned directly by the page with `useState`;
- validation is imperative and message-only;
- there is no shared field-error model;
- focus-first-error is not implemented in the inspected routes;
- validation summary is not implemented;
- dirty-state and navigation protection are not implemented;
- duplicate submission is guarded by page-specific busy flags;
- mandatory reason rules exist but are implemented independently;
- server error codes are converted to generic page messages;
- ambiguous network outcomes have no shared recovery state;
- no inspected form needs schema composition complex enough to prove RHF/Zod necessity yet.

### Form dependency conclusion

React Hook Form and Zod must not be installed until the ADR demonstrates one or more of these measured needs:

- repeated nested form structures;
- conditional schema branches that are difficult to maintain imperatively;
- reusable field arrays;
- cross-route schema reuse;
- measurable rerender or testability problems;
- bundle impact acceptable against the Admin performance budget.

## 3. Queue and data-view inventory

| Capability | Topups | Withdrawals | Members | Current inconsistency |
| --- | --- | --- | --- | --- |
| Filtering | status select | status select | search + status | local state only |
| URL state | no | no | no | refresh/back/share are not canonical |
| Pagination | page/pageCount | page/pageCount | page/pageCount | repeated controls and labels |
| Sorting | server/default only | server/default only | server/default only | no visible sort contract |
| Loading | notice text | skeleton + notice | empty-style loading | three different patterns |
| Empty state | `AdminEmpty` | `AdminEmpty` | `AdminEmpty` | mostly aligned |
| Error state | notice | notice | notice | tone and recovery vary |
| Masking | limited identity display | account mask | permission-based phone/email/balance masking | masking ownership differs |
| Row/card actions | card-level actions | card-level actions | card-level actions | no shared action menu contract |
| Bulk actions | absent | absent | absent | future queues need explicit partial-failure model |
| Mobile fallback | cards already used | cards already used | cards already used | no canonical breakpoint/priority contract |
| Export | absent in inspected routes | absent | absent | exports must preserve filters and masking |
| Partial failure | secondary asset failure silently ignored or page notice | proof preview non-blocking | not applicable | no shared result summary |

### Data-view conclusion

The current Admin surfaces are card-based operational queues rather than conventional generic tables. A shared Admin data-view contract is justified immediately; TanStack Table is not justified until route inventory proves a meaningful number of column-heavy, sortable, selectable tables that cannot be served by the existing card/primitive system.

## 4. Route-family coverage

The canonical Admin route map groups the remaining surfaces into these migration families:

- overview: dashboard, operations, activity;
- finance: topups, withdrawals, wallets, ledgers, bank accounts, reconciliation, exports;
- members and risk: members, member detail, KYC, risk alerts, audit risk;
- growth: promotions, claims, bonus, affiliate, commission;
- games and integration: games, providers, transfers, adapters, webhooks;
- support and content;
- settings, access, roles, security, audit.

For Batch 1, every family must adopt the same contracts when touched. New route-specific orchestration, validation, pagination, masking, or mutation conventions are prohibited unless the owning contract is amended first.

## 5. Required migration order

1. Centralize error-code/session/permission interpretation.
2. Introduce a small shared request-state adapter with cancellation.
3. Move list filters and pagination into URL state.
4. Normalize loading, empty, stale and error rendering.
5. Normalize mutation busy, reason, confirmation and ambiguous-result states.
6. Measure remaining complexity.
7. Record dependency ADRs only after measurement.

## 6. Acceptance status

- [x] Page-level fetch/effect orchestration patterns inventoried.
- [x] Mutation forms and manual validation patterns inventoried.
- [x] Queue and data-view implementations inventoried at Batch 1 pattern level.
- [x] Representative finance and member routes inspected directly.
- [x] No dependency installation authorized by this inventory.
- [x] No runtime behavior changed.

## Remaining risk

- This is a pattern-level inventory, not a claim that every route has been individually rewritten or browser-verified.
- Route-by-route migration evidence remains required when implementation begins.
- Bundle, browser, accessibility and CI gates remain open.
