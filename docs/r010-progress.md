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

### 4. Reduce unnecessary relation `include` usage in list endpoints

- Replaced `AdminMembersQueryService.listMembers()` broad `profile` and `wallet` relation includes with `MEMBER_LIST_PROJECTION`.
- Limited profile data to `displayName` and wallet data to `balance` and `lockedBalance`.
- Preserved member-list response keys, search, status filtering, ordering, offset pagination, totals, and page counts.
- Kept the broader detail query unchanged because the detail response legitimately requires it.
- Added `tools/audit-r010-admin-member-list-projection.mjs` and wired it into `.github/workflows/r010-query-boundaries.yml`.
- Evidence: `docs/evidence/r010-admin-member-list-projection.md`.

## Active work

### 5. Create a shared cursor pagination pattern

- [ ] Define normalized cursor and bounded limit helpers.
- [ ] Migrate the first existing cursor list without changing response semantics.
- [ ] Add invalid-cursor and boundary regression guards.

## Count

- Total R-010 outcomes: 13
- Closed: 4
- Remaining: 9

## Latest commits

- `104b0f4d454d46fe902a0aa8c2c083cff3ad5a36` — record admin member list projection evidence.
- `777a22799fb86550042eab483ea84a160eea6ea4` — enforce narrow admin member list projection in CI.
- `1596c0e07064f0082a47279ec901d5ef0c7024e7` — guard the admin member list projection contract.
- `db230ed85538478c88d1b3c787e014cf2060d2b4` — replace broad admin member list includes with a narrow select projection.
- `c86ce2aca283689952a357c440b57805b7bebd22` — record notification projection boundary evidence.
- `e178bfb10865e31943415335e5f94a117c9d9aec` — enforce notification projection boundaries in CI.
- `06aa07cf4dfc0c33ed42370b72134e7c29827d16` — guard notification list/detail/summary projection boundaries.
- `b0d2ed5fe1be85b0d93a5076221b96dd14044118` — remove direct Prisma reads from the notification query service.
