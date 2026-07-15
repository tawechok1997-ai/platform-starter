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
- Wired both suites into `.github/workflows/r010-query-boundaries.yml`, followed by API typecheck.
- Evidence: `docs/evidence/r010-response-contract-snapshots.md`.

## Active work

### 12. Add EXPLAIN ANALYZE evidence for heavy queries

- [x] Identified dashboard aggregation, queue aging, wallet scan, and latest-ledger lookup as the first heavy read families.
- [x] Added `tools/r010-explain-analyze.mjs` using `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` with fixed read-only SQL.
- [x] Added `tools/audit-r010-explain-analyze-evidence.mjs` to require raw plans, planning time, execution time, and root node type for all four queries.
- [x] Added `.github/workflows/r010-explain-analyze.yml` with PostgreSQL 16, real migrations, Prisma generation, evidence validation, and artifact upload.
- [x] Added package commands `audit:r10:explain` and `audit:r10:explain:validate`.
- [x] Documented the CI-baseline limitation in `docs/evidence/r010-explain-analyze-baseline.md`.
- [ ] Observe a successful workflow artifact before closing this outcome. Connector visibility currently does not expose the push-triggered Actions run.

## Count

- Total R-010 outcomes: 13
- Closed: 11
- Remaining: 2

## Latest commits

- `86680c9f14a92a0b7f4e30b25aec4ab465eed781` — rerun EXPLAIN evidence workflow when scripts or commands change.
- `6a6a2fc1d1c59284ea62a51f265236d2121e99a7` — document the EXPLAIN ANALYZE CI baseline and limitation.
- `b055c00f31ad0aa1ebd9aa8fb0f1475c17cc9810` — add EXPLAIN evidence commands.
- `f80978a6e61b0a63cb3fb8da5ee35df876c25fde` — validate machine-readable EXPLAIN evidence.
- `e529067e8a20da3079f8c4e38a2793da93cfefa7` — add PostgreSQL EXPLAIN evidence workflow.
- `bcfbc8713c65cd26ea7301a9e8af3951f3a0014d` — capture heavy-read EXPLAIN ANALYZE plans.
