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
- [ ] Reduce unnecessary relation `include` usage in list endpoints.
- [ ] Create a shared cursor pagination pattern.
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
- Added `tools/audit-r010-notification-query-ownership.mjs`.
- Added repository-wide duplicate-query strict enforcement with `R010_DUPLICATE_QUERY_STRICT=1`.
- Added `.github/workflows/r010-query-ownership.yml` with duplicate-query strict mode, review-ledger validation, ownership enforcement, and API typecheck.
- Evidence: `docs/evidence/r010-notification-query-ownership.md` and `docs/evidence/r010-duplicate-query-consolidation-closure.md`.
- Railway API, Admin, and Member deployments succeeded after the ownership and strict-guard commits.

### 3. Separate list, detail, and summary projections

- Added `notification-read.projections.ts` with owner-local list, detail, and summary projection contracts.
- Moved notification-state and preference-detail Prisma reads into `NotificationFeedReadRepository`.
- Removed direct Prisma access from `NotificationsQueryService`.
- Centralized feed source/result limits and summary counting.
- Added `tools/audit-r010-notification-projection-boundaries.mjs` and wired it into `.github/workflows/r010-query-boundaries.yml`.
- Preserved the existing notification response shape: `items`, `groups`, `total`, `counts`, and `preferences`.
- Evidence: `docs/evidence/r010-notification-projection-boundaries.md`.

## Active work

### 4. Reduce unnecessary relation `include` usage in list endpoints

- [ ] Inventory broad `include` usage in list endpoints.
- [ ] Replace the first low-risk broad include with a narrow projection.
- [ ] Add a drift guard and preserve response behavior.

## Count

- Total R-010 outcomes: 13
- Closed: 3
- Remaining: 10

## Latest commits

- `c86ce2aca283689952a357c440b57805b7bebd22` — record notification projection boundary evidence.
- `e178bfb10865e31943415335e5f94a117c9d9aec` — enforce notification projection boundaries in CI.
- `06aa07cf4dfc0c33ed42370b72134e7c29827d16` — guard notification list/detail/summary projection boundaries.
- `b0d2ed5fe1be85b0d93a5076221b96dd14044118` — remove direct Prisma reads from the notification query service.
- `3f4826b21b68bb65316d253d53e587fa7a1bce9e` — route notification state and preference detail reads through the repository.
- `222f127f0acdb8d8a735a57500bbc7ca920e64ca` — add explicit notification list/detail/summary projection contracts.
