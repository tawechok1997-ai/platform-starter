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
- [x] Create a report read model.
- [ ] Audit sensitive fields in projections.
- [ ] Add response snapshot and contract tests.
- [ ] Add EXPLAIN ANALYZE evidence for heavy queries.
- [ ] Add N+1 and slow-query metrics.

## Safety rules

- Do not change mutation, transaction, wallet, settlement, or provider behavior.
- Do not expose additional sensitive fields while reducing projections.
- Preserve existing response contracts unless a versioned migration is documented.
- Do not replace indexed pagination with an unbounded query.
- Add characterization or contract coverage before changing critical list/detail responses.

## Closed outcomes

### 1. Query/read-model inventory

- Added `tools/audit-r010-query-inventory.mjs`.
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
- Evidence: `docs/evidence/r010-admin-member-list-projection.md`.

### 5. Create a shared cursor pagination pattern

- Added `apps/api/src/common/query/cursor-pagination.ts`.
- Migrated member and admin support-ticket lists.
- Evidence: `docs/evidence/r010-shared-cursor-pagination.md`.

### 6. Create shared filter parsing and sort whitelists

- Added `apps/api/src/common/query/query-filters.ts`.
- Migrated the admin support-ticket list.
- Evidence: `docs/evidence/r010-filter-sort-boundaries.md`.

### 7. Reject arbitrary sort and filter input

- Invalid enum filters, sort fields, sort directions, and oversized text now return `BadRequestException`.
- Added executable contract tests and CI enforcement.
- Evidence: `docs/evidence/r010-arbitrary-query-rejection.md`.

### 8. Create a dashboard read model

- Added `AdminDashboardReadModel` under the `reports` module.
- Kept `GET /admin/reports/daily` and its response contract unchanged.
- Evidence: `docs/evidence/r010-dashboard-read-model.md`.

### 9. Create a report read model

- Added `AdminReportReadModel` under the `reports` module.
- Moved trends, queue-aging, and reconciliation reads out of `ReportsQueryService`.
- Removed direct Prisma access from `ReportsQueryService`.
- Preserved all existing report routes and response keys.
- Added `tools/audit-r010-report-read-model.mjs` and CI enforcement.
- Evidence: `docs/evidence/r010-report-read-model.md`.

## Active work

### 10. Audit sensitive fields in projections

- [ ] Inventory projection fields that can expose credentials, tokens, storage keys, bank details, contact data, or internal notes.
- [ ] Tighten one high-value read family without changing intended response behavior.
- [ ] Add a static sensitive-field drift guard.

## Count

- Total R-010 outcomes: 13
- Closed: 9
- Remaining: 4

## Latest commits

- `7c0fcb3386f633021bc3c6b72d96e5ba6420e6e4` — record report read-model evidence.
- `d9084673d254670b0f8a2501856d393f1aed9fbd` — enforce report read-model boundaries in CI.
- `44b319bac39ee389fca431b832f0b740175ccb1d` — guard report read-model ownership and response keys.
- `278ad9be7d3d511857e9e1e64f1775a2ee578fcc` — register the report read model.
- `dafec6deaac7b0a7603798b86b65b820401011e0` — route report reads through the read model.
- `3d44cca24503845f20abacc545890b6db5d1d51a` — add the admin report read model.
