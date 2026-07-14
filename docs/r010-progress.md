# R-010 Progress

Status: 🟡 ACTIVE

Started: 2026-07-15

Source of truth: `docs/master-project-worklist.md`

## Scope

R-010 covers query/read model and projection cleanup.

The goal is to standardize list/detail/summary reads, pagination, filters, sorting, projections, sensitive-field boundaries, and heavy-query evidence without changing mutation behavior, transaction ownership, permissions, or public response contracts unexpectedly.

## Definition of done

- [x] Inventory duplicate queries and hard-coded `take` values.
- [ ] Consolidate duplicate queries by module ownership.
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

### Query/read-model inventory

- [x] Added `tools/audit-r010-query-inventory.mjs`.
- [x] Scans API TypeScript source for numeric `take` literals and embedded page-size defaults.
- [x] Records Prisma `findMany` query shapes and duplicate groups.
- [x] Uses stable file/method/value or file/method/query keys.
- [x] Supports deterministic JSON output and future strict enforcement.
- [x] Added `docs/evidence/r010-query-inventory-foundation.md`.

## Active work

### Duplicate query consolidation by module ownership

- [x] Inventory findings include module ownership derived from `apps/api/src/modules/<owner>`.
- [x] Inventory reports findings grouped by owner and detects unreviewed/stale ledger entries.
- [x] Added `docs/evidence/r010-query-review.json` as the durable review ledger.
- [x] Added `tools/audit-r010-query-review-ledger.mjs` to validate status, owner, and reason fields.
- [x] Consolidated the member notification feed source-query family under `NotificationFeedReadRepository`.
- [x] Centralized the source limit and narrow projections for top-ups, withdrawals, support-linked alerts, and login history.
- [x] Added `tools/audit-r010-notification-query-ownership.mjs`.
- [x] Added `.github/workflows/r010-query-boundaries.yml` with the ownership guard and API typecheck.
- [x] Recorded `docs/evidence/r010-notification-query-ownership.md`.
- [x] Railway API, Admin, and Member deployments succeeded for commit `f11e31280648643efe6871e720c7f5056b7067bb`.
- [ ] Populate/classify the complete current inventory and consolidate or document every remaining duplicate family before closing outcome 2.

## Count

- Total R-010 outcomes: 13
- Closed: 1
- Remaining: 12

## Latest commits

- `f41edb78ff39b9450846d158e8fceecf4665ded2` — record notification query ownership evidence.
- `f11e31280648643efe6871e720c7f5056b7067bb` — enforce R-010 query ownership guards in CI.
- `128b6d8f8766f00b10339ebacf7ec8f9b9d3c83c` — guard notification feed query ownership.
- `37a26d8ec4824ca0cd0c1680022ebb82683dc6d8` — register the notification feed read repository.
- `292e540bf1d28ac963cdbb4abca3651178b8ff51` — route notification feed reads through the module owner.
- `c797f8e91774afe0325dcfc3c2bceb63fbc517b9` — add the notification feed read repository.
