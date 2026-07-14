# R-009 KYC and Watchlist Transaction Closure

## Scope

This evidence covers KYC document review, KYC case review, risk-watchlist creation, and risk-watchlist release.

## KYC review contracts

- `KycReviewCommandService.reviewDocument` owns a Serializable Prisma transaction.
- The KYC document row is locked with `FOR UPDATE`.
- The requested version is checked before mutation and in the guarded update.
- The document mutation and `REVIEW_KYC_DOCUMENT` audit write use the same transaction client.
- `KycReviewCommandService.reviewCase` owns a Serializable Prisma transaction.
- The KYC case row is locked with `FOR UPDATE`.
- Case transition policy and required review reasons are revalidated after locking.
- Approval rechecks all non-deleted documents through the transaction client.
- The case mutation and `REVIEW_KYC_CASE` audit write use the same transaction client.
- `kyc-concurrency.db.spec.ts` verifies that only one reviewer can transition a given case version and that stale retries fail.

## Watchlist contracts

- `RiskWatchlistService.create` owns a Serializable Prisma transaction.
- Entry insertion and `CREATE_RISK_WATCHLIST_ENTRY` audit persistence use the same transaction client.
- The existing unique active-entry constraint remains the duplicate-creation concurrency arbiter.
- PostgreSQL unique violations continue to map to the existing `ConflictException` contract.
- `RiskWatchlistService.release` locks the entry with `FOR UPDATE` and revalidates status and version.
- The guarded release update and `RELEASE_RISK_WATCHLIST_ENTRY` audit persistence use the same transaction client.
- `risk-watchlist-concurrency.db.spec.ts` verifies that only one active duplicate is created and only one release succeeds for a given version.

## Enforcement

- `tools/audit-r009-kyc-watchlist-transactions.mjs` provides strict source-level checks for all four command paths.
- `.github/workflows/r009-parallel-boundary-closure.yml` runs the source guard and watches the KYC/watchlist command and regression files.
- Database concurrency suites remain environment-gated and require an isolated `FINANCE_TEST_DATABASE_URL`; skipped execution is not treated as runtime proof.

## Remaining verification

The watchlist creation runtime change requires a successful Railway API build/deployment after commit `e1dd8cf54ce3cb2a0ce62a9369556549d7ebdc6d` before the R-009 KYC/watchlist transaction-ownership subtask is closed.