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
- [x] Audit sensitive fields in projections.
- [x] Add response snapshot and contract tests.
- [ ] Add EXPLAIN ANALYZE evidence for heavy queries.
- [ ] Add N+1 and slow-query metrics.

## Safety rules

- Do not change mutation, transaction, wallet, settlement, or provider behavior.
- Do not expose additional sensitive fields while reducing projections.
- Preserve existing response contracts unless a versioned migration is documented.
- Do not replace indexed pagination with an unbounded query.
- Add characterization or contract coverage before changing critical list/detail responses.

## Closed outcomes

### 1-10. Query foundations and read-model boundaries

- Query inventory, ownership, projections, pagination, filter/sort validation, dashboard/report read models, and sensitive-field guards are closed.
- Evidence is recorded under `docs/evidence/r010-*.md`.

### 11. Add response snapshot and contract tests

- Added `apps/api/src/modules/reports/report-response-contracts.spec.ts`.
- Added `apps/api/src/modules/notifications/notification-response-contracts.spec.ts`.
- Dashboard, queue-aging, reconciliation, and notification public responses use deterministic inline snapshots.
- Notification coverage includes items, date groups, total, counts, read state, and preferences.
- Wired both suites into `.github/workflows/r010-query-boundaries.yml`, followed by API typecheck.
- Evidence: `docs/evidence/r010-response-contract-snapshots.md`.

## Active work

### 12. Add EXPLAIN ANALYZE evidence for heavy queries

- [ ] Identify heavy report/dashboard query families.
- [ ] Add reproducible EXPLAIN ANALYZE scripts or captured evidence.
- [ ] Document indexes and observed plan risks without changing production data.

## Count

- Total R-010 outcomes: 13
- Closed: 11
- Remaining: 2

## Latest commits

- `2dbae01acdc425ad894da9b366af75558473c206` — record response contract snapshot evidence.
- `07656fdbb30d17f291c90db9e1ed697882c2b381` — run response snapshots in CI.
- `095d6a30e226c3e7b82bb6df89ef1f465cf4f99d` — snapshot notification response contract.
- `472f01809586ea47c388cc73a569ca63b7daedea` — snapshot dashboard and report response contracts.
