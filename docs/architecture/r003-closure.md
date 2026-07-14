# R-003 Closure — Regression Safety Net

Status: **DONE**

Closed on: **2026-07-14**

## Scope completed

- Test inventory classifies unit, integration, contract, database, browser, visual, and concurrency coverage.
- Critical-flow coverage matrix records Deposit, Withdrawal, KYC, Watchlist, Support, Admin lifecycle, Promotion, and Provider webhook/settlement coverage.
- Characterization/state-transition tests protect Support and Admin account lifecycle behavior before structural refactors.
- Finance, promotion, phone OTP, watchlist, KYC, and webhook suites cover transaction, concurrency, replay, rollback, or idempotency behavior where applicable.
- Static permission audits protect critical admin mutations.
- Critical error-contract and DTO/type audits protect API contract changes.
- `audit:critical-test-safety` fails when required suites, scripts, workflow steps, inventory entries, or refactor rules are missing or skipped.
- CI writes an always-run regression summary to `GITHUB_STEP_SUMMARY`, showing the outcome of each critical API/database suite.
- Structural refactors remain blocked for any domain whose documented browser, deployed, vendor, or production-specific evidence is incomplete. Those environment-specific gaps remain tracked in their owning P0–P3 work items and do not invalidate the repository-level R-003 safety net.

## Required verification

```bash
pnpm audit:critical-test-safety
pnpm audit:critical-error-contracts
pnpm audit:admin-permissions
pnpm audit:admin-ui-permissions
pnpm --filter @platform/api test -- --runInBand
pnpm --filter @platform/api test:db:finance -- --runInBand
pnpm --filter @platform/api test:db:promotions -- --runInBand
pnpm --filter @platform/api test:db:phone-otp -- --runInBand
pnpm --filter @platform/api test:db:risk-watchlist -- --runInBand
pnpm --filter @platform/api test:db:kyc -- --runInBand
```

## Closure rule

R-003 establishes the minimum repository-level regression gate required before structural refactoring. It does not claim that credentialed production, authenticated browser, or vendor UAT work is complete; those remain separate acceptance gates under their corresponding project work items.