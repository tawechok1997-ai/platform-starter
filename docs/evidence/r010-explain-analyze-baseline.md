# R-010 EXPLAIN ANALYZE baseline

## Scope

The R-010 performance evidence workflow runs against an ephemeral PostgreSQL 16 database created by GitHub Actions. It applies the repository migrations, generates Prisma Client, and executes fixed read-only statements with:

`EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`

Covered query families:

- dashboard top-up aggregation by status and date range
- pending top-up queue aging ordered by creation time
- reconciliation wallet scan ordered by update time
- latest wallet-ledger lookup ordered by creation time

## Evidence contract

`tools/r010-explain-analyze.mjs` writes `artifacts/r010-explain-analyze.json`.

`tools/audit-r010-explain-analyze-evidence.mjs` rejects the artifact unless every query contains:

- the raw PostgreSQL plan document
- planning time
- execution time
- root plan node type

The workflow uploads the validated JSON as the `r010-explain-analyze` artifact.

## Important limitation

This artifact is a repeatable empty-schema CI baseline. It verifies that the SQL is executable and preserves machine-readable plan evidence, but it is not a production-volume benchmark. Production plan capture must use a read-only connection and representative statistics before making index decisions.
