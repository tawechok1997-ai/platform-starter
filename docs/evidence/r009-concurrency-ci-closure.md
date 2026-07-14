# R-009 PostgreSQL Concurrency CI Closure

## Scope

This evidence closes the remaining R-009 deadlock and concurrency regression coverage gap.

## Enforced CI contract

`.github/workflows/r009-parallel-boundary-closure.yml` now provisions an isolated PostgreSQL 16 service with:

- database `platform_ci`
- PostgreSQL health checks
- `DATABASE_URL` and `FINANCE_TEST_DATABASE_URL` scoped to the CI database
- Prisma migration deployment before database tests

The required workflow executes these PostgreSQL-backed suites serially:

1. finance concurrency
2. promotion settlement concurrency
3. KYC review concurrency
4. risk-watchlist concurrency

The workflow also continues to run ownership and promotion command regression suites.

## Fail-closed guard

`tools/audit-r009-concurrency-ci-closure.mjs` validates the PostgreSQL service, health check, isolated database URLs, migration ordering, all four workflow commands, and their package scripts. The guard is itself required by the workflow and is included in workflow path triggers.

## Safety

Database-backed tests require `FINANCE_TEST_DATABASE_URL`. Each suite rejects unsafe database targets unless the host is local/containerized or the database name clearly identifies a test/CI database.

## Verification

- PostgreSQL CI workflow source committed in `2ab2688b278609e80f5c49d38cfa58adbb3b6945`.
- Fail-closed CI contract guard committed in `a4bdf3136153a90a984285c25dafa7828878b50b`.
- Guard enforced in the required workflow in `9441816e706b6052e9c536aa33dc3f79e05634e0`.
- Railway API, admin, and member deployments for `9441816e706b6052e9c536aa33dc3f79e05634e0` succeeded.

The current GitHub connector only exposes pull-request-triggered workflow runs, so push-run logs are not observable through this channel. Closure follows the repository verification policy: direct source inspection, fail-closed durable guards, existing PostgreSQL regression suites, and successful deployment after the guarded workflow change.
