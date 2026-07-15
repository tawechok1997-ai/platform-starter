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
- [x] Add N+1 and slow-query metrics.

## Safety rules

- Do not change mutation, transaction, wallet, settlement, or provider behavior.
- Do not expose additional sensitive fields while reducing projections.
- Preserve existing response contracts unless a versioned migration is documented.
- Do not replace indexed pagination with an unbounded query.
- Add characterization or contract coverage before changing critical list/detail responses.

## Closed outcomes

### 1-11. Query foundations, read models, and response contracts

- Query inventory, ownership, projections, pagination, filter/sort validation, dashboard/report read models, sensitive-field guards, and deterministic response snapshots are closed.
- Evidence is recorded under `docs/evidence/r010-*.md`.

### 13. Add N+1 and slow-query metrics

- Added `QueryPerformanceMonitor` with normalized SHA-256 query fingerprints.
- Added slow-query signals controlled by `PRISMA_SLOW_QUERY_MS` (default 250 ms).
- Added N+1 burst signals controlled by `PRISMA_N1_BURST_THRESHOLD` and `PRISMA_N1_WINDOW_MS` (defaults 8 queries in 1000 ms).
- Integrated Prisma query events centrally in `PrismaService`.
- Runtime logs exclude raw SQL and query parameters.
- Added focused unit tests and `tools/audit-r010-query-performance-metrics.mjs`.
- Wired the guard, tests, and API typecheck into `.github/workflows/r010-query-boundaries.yml`.

## Active work

### 12. Add EXPLAIN ANALYZE evidence for heavy queries

- [x] Identified dashboard aggregation, queue aging, wallet scan, and latest-ledger lookup as the first heavy read families.
- [x] Added `tools/r010-explain-analyze.mjs` using `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` with fixed read-only SQL.
- [x] Added `tools/audit-r010-explain-analyze-evidence.mjs` to require raw plans, planning time, execution time, and root node type for all four queries.
- [x] Added `.github/workflows/r010-explain-analyze.yml` with PostgreSQL 16, real migrations, Prisma generation, evidence validation, and artifact upload.
- [x] Added package commands `audit:r10:explain` and `audit:r10:explain:validate`.
- [x] Documented the CI-baseline limitation in `docs/evidence/r010-explain-analyze-baseline.md`.
- [x] Updated the workflow to persist validated output to `docs/evidence/generated/r010-explain-analyze.json` on `main`, outside its trigger paths.
- [ ] Close only after the generated evidence file appears and passes the existing validator.

## Count

- Total R-010 outcomes: 13
- Closed: 12
- Remaining: 1

## Latest commits

- `f5557656ccbe7d02ba2fe7a760a3a573e5542e9e` — persist validated EXPLAIN evidence back to the repository.
- `4e7fbe83fd3766557055ddb3b9c0e26f6f514bc3` — verify query performance metrics in CI.
- `9a071d8be40d42c5ce05877a55d1dd132c504835` — guard query performance instrumentation and log safety.
- `3e11af5a1729fb42b8b981a859e2e37eb4e2d7f0` — instrument Prisma query timing and burst signals.
- `4b630a58dc9a8748634eb6dea0877fc1822027a6` — test slow-query and N+1 burst contracts.
- `0f50d33fbbfdca9c2dac4188073c127c26fcc5d5` — add the query performance monitor.
