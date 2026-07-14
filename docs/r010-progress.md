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

### Reviewed baseline and module ownership

- [ ] Run/classify current findings by module.
- [ ] Persist a reviewed baseline ledger.
- [ ] Select the first duplicate query family for consolidation.

## Count

- Total R-010 outcomes: 13
- Closed: 1
- Remaining: 12

## Latest commits

- `734560e31007b4258cf5c2b4025082c0273c81e1` — record query inventory foundation evidence.
- `14049883c7e768a3e9dffc223b78615999871d7e` — add query/read-model inventory with stable findings.
