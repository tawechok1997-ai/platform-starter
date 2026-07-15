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
- [x] Create shared filter parsing and sort whitelists.
- [x] Reject arbitrary sort and filter input.
- [x] Create a dashboard read model.
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

- Consolidated member notification-feed source queries under `NotificationFeedReadRepository`.
- Added repository-wide duplicate-query strict enforcement and ownership guards.
- Evidence: `docs/evidence/r010-notification-query-ownership.md` and `docs/evidence/r010-duplicate-query-consolidation-closure.md`.

### 3. Separate list, detail, and summary projections

- Added owner-local notification list, detail, and summary projection contracts.
- Removed direct Prisma access from `NotificationsQueryService`.
- Evidence: `docs/evidence/r010-notification-projection-boundaries.md`.

### 4. Reduce unnecessary relation `include` usage in list endpoints

- Replaced broad member-list profile/wallet includes with `MEMBER_LIST_PROJECTION`.
- Preserved the member-list response contract and left the legitimate detail query unchanged.
- Evidence: `docs/evidence/r010-admin-member-list-projection.md`.

### 5. Create a shared cursor pagination pattern

- Added `apps/api/src/common/query/cursor-pagination.ts`.
- Migrated member and admin support-ticket lists.
- Evidence: `docs/evidence/r010-shared-cursor-pagination.md`.

### 6. Create shared filter parsing and sort whitelists

- Added `apps/api/src/common/query/query-filters.ts`.
- Migrated the admin support-ticket list.
- Restricted sorting to owner-controlled fields and directions.
- Evidence: `docs/evidence/r010-filter-sort-boundaries.md`.

### 7. Reject arbitrary sort and filter input

- Query helpers now throw `BadRequestException` for invalid enum filters, sort fields, sort directions, and oversized text.
- Invalid values no longer silently fall back or truncate.
- Added explicit support category allowlists at both DTO and service boundaries.
- Added executable contract tests and CI enforcement.
- Evidence: `docs/evidence/r010-arbitrary-query-rejection.md`.

### 8. Create a dashboard read model

- Added `AdminDashboardReadModel` under the `reports` module.
- Moved daily dashboard aggregates for top-ups, withdrawals, adjustments, wallets, ledgers, and pending queues out of `ReportsQueryService`.
- Kept `GET /admin/reports/daily` and its response contract unchanged.
- Added `tools/audit-r010-dashboard-read-model.mjs` and wired it into `.github/workflows/r010-query-boundaries.yml`.
- Evidence: `docs/evidence/r010-dashboard-read-model.md`.

## Active work

### 9. Create a report read model

- [ ] Select the first report family with mixed query and mapping responsibilities.
- [ ] Move report-specific reads and projections behind an owner-local read model.
- [ ] Preserve endpoint contracts and add a drift guard.

## Count

- Total R-010 outcomes: 13
- Closed: 8
- Remaining: 5

## Latest commits

- `3cc42e26aeed176a194f61ce9acc787b8e9b46f4` — record dashboard read-model evidence.
- `c4a4fc49edc870fa97cf4ba6624dee6b3c29f9bd` — enforce the dashboard read-model boundary in CI.
- `f98ef3d23e8fd80ddb87f63606dc3980115f69f3` — guard dashboard read-model ownership and response keys.
- `77c326165e8a839621fe517911444aca721612ca` — register the dashboard read model.
- `1be68174318288982e45035965185c38d1964bb6` — route daily dashboard reads through the read model.
- `d2bbb21a135e818e38e66fef59296e197e2be90f` — add the admin dashboard read model.
