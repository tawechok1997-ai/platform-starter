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
- [ ] Separate list, detail, and summary projections.
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

## Active work

### 3. Separate list, detail, and summary projections

- [ ] Inventory list/detail/summary reads that currently share broad or inline projections.
- [ ] Define owner-local projection constants/types without exposing Prisma types outside infrastructure/query layers.
- [ ] Migrate the first low-risk read family and add a drift guard.
- [ ] Preserve response contracts with focused regression evidence.

## Count

- Total R-010 outcomes: 13
- Closed: 2
- Remaining: 11

## Latest commits

- `7298721e2fe2d53e4fa6c47b4231285e47c8efe9` — record duplicate-query consolidation closure evidence.
- `2e3667ca4ea7a675f2c529d0c9cceddc66020301` — add repository-wide R-010 duplicate-query ownership workflow.
- `96aa259ba7430a00e38847b056c64d30da534672` — add duplicate-query strict mode.
- `f41edb78ff39b9450846d158e8fceecf4665ded2` — record notification query ownership evidence.
- `f11e31280648643efe6871e720c7f5056b7067bb` — enforce R-010 query ownership guards in CI.
- `128b6d8f8766f00b10339ebacf7ec8f9b9d3c83c` — guard notification feed query ownership.
- `37a26d8ec4824ca0cd0c1680022ebb82683dc6d8` — register the notification feed read repository.
- `292e540bf1d28ac963cdbb4abca3651178b8ff51` — route notification feed reads through the module owner.
- `c797f8e91774afe0325dcfc3c2bceb63fbc517b9` — add the notification feed read repository.
