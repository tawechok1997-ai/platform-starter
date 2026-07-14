# R-010 Progress

Status: 🟡 ACTIVE

Started: 2026-07-15

Source of truth: `docs/master-project-worklist.md`

## Scope

R-010 covers query/read model and projection cleanup.

The goal is to standardize list/detail/summary reads, pagination, filters, sorting, projections, sensitive-field boundaries, and heavy-query evidence without changing mutation behavior, transaction ownership, permissions, or public response contracts unexpectedly.

## Definition of done

- [x] Inventory duplicate queries and hard-coded `take` values.
- [x] Consolidate duplicate queries by module ownership.
- [x] Separate list, detail, and summary projections.
- [x] Reduce unnecessary relation `include` usage in list endpoints.
- [x] Create a shared cursor pagination pattern.
- [ ] Create shared filter parsing and sort whitelists.
- [ ] Reject arbitrary sort and filter input.
- [ ] Create a dashboard read model.
- [ ] Create a report read model.
- [ ] Audit sensitive fields in projections.
- [ ] Add response snapshot and contract tests.
- [ ] Add EXPLAIN ANALYZE evidence for heavy queries.
- [ ] Add N+1 and slow-query metrics.

## Execution order

1. Query inventory and stable finding keys.
2. Pagination/filter/sort foundations.
3. List/detail/summary projection cleanup by domain.
4. Dashboard and report read models.
5. Sensitive-field and response-contract enforcement.
6. Heavy-query evidence and N+1/slow-query metrics.
7. Strict CI guard and closure evidence.

## Safety rules

- Do not change mutation, transaction, wallet, settlement, or provider behavior.
- Do not expose additional sensitive fields while reducing projections.
- Preserve existing response contracts unless a versioned migration is documented.
- Do not replace indexed pagination with an unbounded query.
- Add characterization or contract coverage before changing critical list/detail responses.

## Closed outcomes

### 1. Query/read-model inventory

- Added `tools/audit-r010-query-inventory.mjs`.
- Scans API TypeScript source for numeric `take` literals, embedded page-size defaults, and duplicate Prisma `findMany` shapes.
- Uses stable finding keys and module ownership.
- Evidence: `docs/evidence/r010-query-inventory-foundation.md`.

### 2. Duplicate query consolidation by module ownership

- Consolidated member notification-feed source queries under `NotificationFeedReadRepository` in the `notifications` module.
- Centralized the source limit and narrow projections for top-ups, withdrawals, support-linked alerts, and login history.
- Added repository-wide duplicate-query strict enforcement and ownership guards.
- Evidence: `docs/evidence/r010-notification-query-ownership.md` and `docs/evidence/r010-duplicate-query-consolidation-closure.md`.

### 3. Separate list, detail, and summary projections

- Added owner-local notification list, detail, and summary projection contracts.
- Moved notification-state and preference-detail reads into `NotificationFeedReadRepository`.
- Removed direct Prisma access from `NotificationsQueryService`.
- Evidence: `docs/evidence/r010-notification-projection-boundaries.md`.

### 4. Reduce unnecessary relation `include` usage in list endpoints

- Replaced broad member-list profile/wallet includes with `MEMBER_LIST_PROJECTION`.
- Preserved the member-list response contract and left the legitimate detail query unchanged.
- Evidence: `docs/evidence/r010-admin-member-list-projection.md`.

### 5. Create a shared cursor pagination pattern

- Added `apps/api/src/common/query/cursor-pagination.ts`.
- Centralized bounded limit parsing, cursor normalization, look-ahead fetch, `hasMore`, and `nextCursor` construction.
- Migrated member and admin support-ticket lists to the shared pattern.
- Added deterministic `createdAt DESC, id DESC` ordering.
- Added `tools/audit-r010-cursor-pagination.mjs` and wired it into `.github/workflows/r010-query-boundaries.yml`.
- Preserved the existing support-list response contracts and kept detail/mutation behavior unchanged.
- Evidence: `docs/evidence/r010-shared-cursor-pagination.md`.

## Active work

### 6. Create shared filter parsing and sort whitelists

- [ ] Define reusable enum/filter normalization helpers.
- [ ] Define owner-controlled sort field/direction whitelists.
- [ ] Migrate the first low-risk list endpoint and add a drift guard.

## Count

- Total R-010 outcomes: 13
- Closed: 5
- Remaining: 8

## Latest commits

- `1fe12970ed7daa50a091f387b3eb150884ae5603` — record shared cursor pagination evidence.
- `728552cbb1b75ef61f09e54b4ea97e20a13ff1d2` — enforce the shared cursor pagination guard in CI.
- `d38adfd6d29f5005e7b8aa16857122a1c995f060` — guard the shared cursor pagination contract.
- `64c0f29197704e972bd8f737d4952a07e44a0347` — migrate support list queries to the shared cursor pattern.
- `233055412dc1bfa537309ded0f40937a719fd28f` — add the shared cursor pagination utility.
