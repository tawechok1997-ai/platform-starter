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
- Centralized source limits and narrow projections.
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
- Centralized bounded limit parsing, cursor normalization, look-ahead fetch, and next-cursor construction.
- Migrated member and admin support-ticket lists.
- Evidence: `docs/evidence/r010-shared-cursor-pagination.md`.

### 6. Create shared filter parsing and sort whitelists

- Added `apps/api/src/common/query/query-filters.ts`.
- Centralized optional text normalization, enum filtering, and sort parsing.
- Migrated the admin support-ticket list.
- Added validated `sortBy` and `sortDirection` query parameters.
- Restricted sorting to `createdAt`, `updatedAt`, or `status`, with `asc` or `desc` only.
- Preserved the prior default `createdAt desc` ordering and added an `id` tie-breaker.
- Added `tools/audit-r010-filter-sort-boundaries.mjs` and wired it into `.github/workflows/r010-query-boundaries.yml`.
- Evidence: `docs/evidence/r010-filter-sort-boundaries.md`.

## Active work

### 7. Reject arbitrary sort and filter input

- [ ] Add strict rejection behavior rather than silent fallback for invalid filter/sort values.
- [ ] Add focused contract coverage for rejected inputs.
- [ ] Add a static guard preventing raw sort/filter values from reaching Prisma.

## Count

- Total R-010 outcomes: 13
- Closed: 6
- Remaining: 7

## Latest commits

- `0f0f715982d67b4f363b6c6df2b5aea02e8e8caa` — record shared filter/sort evidence.
- `24cc8a22a09f26fffe2bb5d2ebba813bf7fc3ba6` — enforce filter/sort boundaries in CI.
- `5866dc2505afff6b88f8dd726509c4678235f20e` — guard shared filter and sort boundaries.
- `5e880a53dd2b5c785f8b5a592fa129396a3c2edb` — migrate support filters and sorting to shared parsers.
- `eb249de28c8e51efd837e310c66467d21843c7ad` — whitelist support sort query parameters.
- `5c443f853933abd63e33cd4a6b7e1cb43343f25a` — add shared query filter and sort parsing.
