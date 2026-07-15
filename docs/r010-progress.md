# R-010 Progress

Status: ✅ DONE

Started: 2026-07-15
Closed: 2026-07-15

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
- [x] Add EXPLAIN ANALYZE evidence for heavy queries.
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

### 12. EXPLAIN ANALYZE evidence

- Added `tools/r010-explain-analyze.mjs` using PostgreSQL `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`.
- Covered dashboard aggregation, pending queue aging, wallet reconciliation scan, and latest-ledger lookup.
- Added `tools/audit-r010-explain-analyze-evidence.mjs` requiring raw plans, planning time, execution time, and root node type.
- Verification-only PR #30 ran `R-010 EXPLAIN ANALYZE` workflow run `29380355683` (run #7).
- Job `87242466884` completed successfully, including schema creation, Prisma generation, plan capture, artifact upload, and validator success.
- Artifact `8329415192` from the preceding inspection run was downloaded and inspected; it contained all four PostgreSQL plans and measured timing/buffer fields.
- The CI baseline is an empty-schema PostgreSQL 16 verification, not a production-volume benchmark.

### 13. N+1 and slow-query metrics

- Added `QueryPerformanceMonitor` with normalized SHA-256 query fingerprints.
- Added slow-query signals controlled by `PRISMA_SLOW_QUERY_MS` (default 250 ms).
- Added N+1 burst signals controlled by `PRISMA_N1_BURST_THRESHOLD` and `PRISMA_N1_WINDOW_MS` (defaults 8 queries in 1000 ms).
- Integrated Prisma query events centrally in `PrismaService`.
- Runtime logs exclude raw SQL and query parameters.
- Added focused unit tests and `tools/audit-r010-query-performance-metrics.mjs`.
- Wired the guard, tests, and API typecheck into `.github/workflows/r010-query-boundaries.yml`.

## Count

- Total R-010 outcomes: 13
- Closed: 13
- Remaining: 0

## Closure commits

- `a21deacb46f4cb78d1937cda0e3ce048a15fbfad` — build EXPLAIN verification schema from the Prisma model.
- `c3069188c1c50500dffbc6fdd509dadda8aeddbe` — accept pnpm argument separators in the evidence validator.
- `1c7c0f6b7d100a73a8e712de31de5fb15e293a3e` — close N+1 and slow-query metrics.
