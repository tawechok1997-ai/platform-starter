# Current Execution Status

Last updated: 2026-07-11

This file is the short operational worklist for the current implementation cycle. The broader product backlog remains in `docs/remaining-work-backlog.md`.

## Current checkpoint

- [x] Prisma finance schema aligned with staged deposit and withdrawal migrations.
- [x] Duplicate-slip and payment-audit migrations split into safe enum/object phases.
- [x] Deposit credit path uses wallet row locking and an idempotent ledger key.
- [x] Withdrawal reservation and payout paths use request/wallet locking.
- [x] Deposit-slip and withdrawal-proof storage compensation added.
- [x] Legacy money-changing endpoints disabled or removed.
- [x] Deposit and withdrawal claim ownership added.
- [x] Finance worklist foundation added.
- [x] Risk Alert Operations UI expanded with member filtering, duplicate-slip types, and target links.
- [x] Risk Alert backend aligned with staged finance statuses and strict filters.
- [x] Audit Log regression coverage added.
- [x] Admin and Member refresh tokens rotate atomically and detected token reuse revokes remaining sessions.
- [x] Admin API requests disable browser caching and clear the frontend session after privilege-denied responses.
- [x] Local-storage delete regression coverage added.
- [x] Strict production smoke-test environment guard added.
- [x] `pnpm-lock.yaml` generated and CI switched to `--frozen-lockfile`.
- [x] Manifest dependencies pinned instead of using `latest`.
- [x] Next.js upgraded from vulnerable `14.2.32` to patched `14.2.35` in both web apps and the root override.
- [x] Railway security scan blocker for Next.js addressed in the committed lockfile.
- [x] CI now supplies a non-production `DATABASE_URL` for Prisma validate/generate/build steps.
- [x] Migration regression test updated to inspect both split migration files.
- [x] Admin login-defense test doubles fixed for unknown-user IP throttling.
- [x] Privileged-admin 2FA test configuration fixed without weakening production enforcement.
- [x] Risk Alert assignment, assignee permissions, and investigation notes/timeline added.
- [x] Audit Log Risk target links corrected to the Risk Alert detail route.
- [x] GitHub Actions Build #270 completed successfully for commit `c7edec0`.

## CI checkpoint

Confirmed by GitHub Actions Build #270:

- [x] `pnpm install --frozen-lockfile`
- [x] `pnpm prisma validate`
- [x] `pnpm prisma generate`
- [x] `pnpm --filter @platform/api test -- --runInBand`
- [x] `pnpm build:api`
- [x] `pnpm build:web-admin`
- [x] `pnpm build:web-member`

Still requires direct deployment verification:

- [ ] Railway redeploy succeeds for API, Admin, and Member on the latest commit.
- [ ] Railway dependency/security scan no longer reports `next@14.2.32`.
- [ ] `/health` responds successfully after the latest API deployment.
- [ ] `/version` reports the expected commit/build.

## Immediate next milestone: PostgreSQL-backed finance concurrency tests

### CI integration

- [ ] Add a PostgreSQL 16 service to `.github/workflows/build.yml`.
- [ ] Use a dedicated test database such as `platform_test`.
- [ ] Set both `DATABASE_URL` and `FINANCE_TEST_DATABASE_URL` to the CI test database.
- [ ] Wait for PostgreSQL health readiness before migrations/tests.
- [ ] Run `pnpm prisma migrate deploy` against the CI test database.
- [ ] Run `pnpm --filter @platform/api test:db:finance` after fast unit tests.
- [ ] Keep database-backed finance tests separate from fast unit tests for clearer failures.

### Database test harness

- [x] Test harness guarded by `FINANCE_TEST_DATABASE_URL`.
- [x] Production-like database names are rejected by the test safety guard.
- [x] Concurrent deposit credit confirmation test added.
- [x] Deposit test verifies one wallet mutation, one ledger row, one idempotency key, and terminal `COMPLETED` state.
- [ ] Add deterministic fixture builders for user, wallet, deposit, withdrawal, and admin records.
- [ ] Add cleanup helpers that remove only test-owned rows.
- [ ] Ensure every test uses isolated identifiers and can run repeatedly.

### Remaining concurrency cases

- [ ] Concurrent withdrawal reservation cannot over-lock or overspend the wallet.
- [ ] Two admins cannot claim the same deposit request.
- [ ] Two admins cannot claim the same withdrawal request.
- [ ] Concurrent payout verification creates only one terminal ledger entry.
- [ ] Retry after timeout preserves idempotency.
- [ ] Wallet `balance` and `lockedBalance` invariants remain valid after concurrent failure paths.
- [ ] Failed/losing concurrent operations leave no orphan ledger or stale lock state.

## Finance end-to-end flow still required

- [ ] Member creates a deposit request.
- [ ] Member uploads a deposit slip.
- [ ] Admin claims the deposit request.
- [ ] Admin reviews the slip.
- [ ] Admin confirms credit.
- [ ] Wallet and ledger balances are verified.
- [ ] Member creates a withdrawal request.
- [ ] Admin claims and approves it for payment.
- [ ] Admin uploads payment proof.
- [ ] Admin verifies payment.
- [ ] Final wallet, locked balance, request state, and ledger are verified.

## Risk and audit operations remaining

- [x] Assign a risk alert to an active admin.
- [x] Add risk-alert investigation notes to the audit timeline.
- [ ] Add provider filter where provider context exists.
- [ ] Add safe bulk actions for low-risk alerts.
- [ ] Add auto-close suggestions linked to resolved finance/provider records.
- [ ] Finish Audit Log target links for all supported modules.
- [ ] Verify Audit Log pagination, long JSON diff rendering, empty state, and mobile regression.

## Deployment and monitoring remaining

- [ ] Verify Railway deployment status for API, Admin, and Member on the latest commit.
- [ ] Verify `/health` after the latest API deployment.
- [ ] Verify `/version` reports the expected commit/build.
- [ ] Run strict staged finance smoke tests with production-safe credentials.
- [ ] Verify private storage access for deposit slips and withdrawal proofs.
- [ ] Add deployment alerts for migration, build, smoke-test, and health-check failures.

## Safe parallel execution groups

The following groups can proceed in parallel because they should not modify the same core files:

1. **Finance DB test harness**
   - fixture builders
   - cleanup helpers
   - withdrawal concurrency cases
   - claim-conflict cases

2. **Risk and Audit UI**
   - assignment/timeline UI
   - target links
   - responsive and empty-state regression

3. **Deployment hardening**
   - health/version verification
   - strict smoke-test wiring
   - failure alerts

Avoid parallel edits to the same workflow, Prisma schema, lockfile, or finance service file.

## Recommended execution order

1. Add PostgreSQL service and migration step to CI.
2. Make `test:db:finance` run reliably in CI.
3. Add withdrawal reservation concurrency coverage.
4. Add deposit and withdrawal claim-conflict coverage.
5. Add payout verification and retry/idempotency coverage.
6. Verify Railway deployment, security scan, `/health`, and `/version`.
7. Complete the full finance E2E flow.
8. Continue Risk/Audit workflow polish in parallel where files do not overlap.

## Safety rules

- Never run `pnpm prisma db push --force-reset`.
- Stop on destructive Prisma warnings or `--accept-data-loss` prompts.
- Never run database-backed concurrency tests against production.
- Every money-changing operation must be idempotent and auditable.
- Never claim CI, Railway, or database tests passed without actual run evidence.
