# R-009 PostgreSQL Concurrency CI

## Scope

The remaining R-009 concurrency coverage is wired into `.github/workflows/r009-parallel-boundary-closure.yml` using an isolated PostgreSQL 16 service.

## CI database safety

- Database: `platform_ci`
- Host: `localhost`
- Credentials exist only inside the GitHub Actions service container.
- `DATABASE_URL` and `FINANCE_TEST_DATABASE_URL` both point to the isolated CI database.
- The database specs independently reject unsafe database targets.

## Execution order

1. Install dependencies.
2. Run `pnpm db:migrate` against the isolated PostgreSQL service.
3. Run source and transaction boundary guards.
4. Run unit concurrency coverage for ownership transfer.
5. Run PostgreSQL concurrency suites serially:
   - finance
   - promotion settlement
   - KYC review
   - risk watchlist
6. Run repository, constraint, and API type checks.

## Required suites

- `pnpm --filter @platform/api test:db:finance`
- `pnpm --filter @platform/api test:db:promotions`
- `pnpm --filter @platform/api test:db:kyc`
- `pnpm --filter @platform/api test:db:risk-watchlist`

## Commit

Workflow wiring commit: `2ab2688b278609e80f5c49d38cfa58adbb3b6945`.

Railway API, admin, and member deployments succeeded for the commit. Push-triggered GitHub Actions run results are not exposed through the current connector, so final R-009 closure remains pending observable workflow evidence rather than being inferred.
