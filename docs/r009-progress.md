# R-009 Progress

Status: ✅ CLOSED

Started: 2026-07-15
Closed: 2026-07-15

## Scope

R-009 establishes repository, transaction, persistence, row-lock, and concurrency boundaries while preserving existing business behavior.

## Closed subtasks

- [x] Controller persistence boundary
- [x] Repository ports and Prisma type boundary
- [x] Withdrawal completion transaction ownership
- [x] Standard lock order and row-lock helpers
- [x] Schema and idempotency constraints
- [x] Ownership transfer transaction ownership and concurrency regression
- [x] KYC review and watchlist transaction ownership
- [x] Promotion settlement transaction ownership
- [x] Critical Prisma adapters and production migration
- [x] Top-up approval/credit scope closure for the current production surface
- [x] Strict legacy transaction escape inventory
- [x] PostgreSQL deadlock and concurrency regression coverage

## Final concurrency closure

The required R-009 workflow now:

1. provisions isolated PostgreSQL 16 database `platform_ci`
2. waits for database health readiness
3. applies Prisma migrations
4. sets `FINANCE_TEST_DATABASE_URL` so database suites run instead of skipping
5. runs finance, promotion settlement, KYC, and risk-watchlist suites serially
6. runs `tools/audit-r009-concurrency-ci-closure.mjs` to verify the service, migration ordering, scripts, and all four commands

Closure evidence:

- `docs/evidence/r009-concurrency-ci-closure.md`
- `tools/audit-r009-concurrency-ci-closure.mjs`
- `.github/workflows/r009-parallel-boundary-closure.yml`
- successful Railway API, admin, and member deployments for workflow guard commit `9441816e706b6052e9c536aa33dc3f79e05634e0`

The current GitHub connector does not expose push-triggered workflow runs. Closure follows the repository verification policy using direct source inspection, fail-closed guards, isolated database safety checks, and successful deployment after the guarded workflow change.

## Count

- Total R-009 subtasks: 15
- Closed with durable evidence: 15
- Remaining not closed: 0
- Enforced and awaiting verification: 0
- Other partial or under active review: 0
- Not yet implemented: 0

## Latest commits

- `a2b46374b95d2873e60129987301105a16238872` — final PostgreSQL concurrency closure evidence
- `9441816e706b6052e9c536aa33dc3f79e05634e0` — required workflow enforcement
- `a4bdf3136153a90a984285c25dafa7828878b50b` — fail-closed concurrency CI audit
- `2ab2688b278609e80f5c49d38cfa58adbb3b6945` — PostgreSQL service and database concurrency suites
