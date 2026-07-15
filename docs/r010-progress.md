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
- Added `apps/api/src/common/query/query-filters.spec.ts` covering defaults, valid input, invalid sort fields/directions, invalid enums, `ALL`, and oversized text.
- Expanded `tools/audit-r010-filter-sort-boundaries.mjs` to prevent silent fallback or raw input drift.
- Wired the executable contract test into `.github/workflows/r010-query-boundaries.yml`.
- Evidence: `docs/evidence/r010-arbitrary-query-rejection.md`.

## Active work

### 8. Create a dashboard read model

- [ ] Identify the first dashboard endpoint assembled from multiple owner queries.
- [ ] Create an owner-local dashboard read model with narrow projections.
- [ ] Preserve response contracts and add a drift guard.

## Count

- Total R-010 outcomes: 13
- Closed: 7
- Remaining: 6

## Latest commits

- `6752ebbbef79d271020d78540998d0543dc52c6c` — run strict query rejection contracts in CI.
- `33db6d3290c2a6f19586a03bd2a112bf91321207` — add executable strict query rejection contracts.
- `04209229bbd83922dafd550e6e05015006200773` — record arbitrary query rejection evidence.
- `832ead7aee5ee59d6a17ce2929ae4bc045bcd14c` — guard strict query rejection behavior.
- `e4802d113e274ba7c37588025a77dee2fb640d27` — enforce strict support query filters.
- `45fbe39d888986127a8a254293f5aed4915d69c1` — whitelist support category filters.
- `e952d3b5b9ae04ae85d8b190b11ada8c07a069fd` — reject invalid shared query input.
