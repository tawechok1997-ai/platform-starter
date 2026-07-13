# Critical Regression Test Inventory

This document records the minimum automated safety net required before structural refactors are allowed in critical domains.

| Domain | Test type | Command / file | Refactor gate |
|---|---|---|---|
| API core | unit/regression | `pnpm --filter @platform/api test -- --runInBand` | Required |
| Finance deposit/withdrawal | PostgreSQL concurrency | `pnpm --filter @platform/api test:db:finance -- --runInBand` | Required |
| Promotions settlement | PostgreSQL concurrency/idempotency | `pnpm --filter @platform/api test:db:promotions -- --runInBand` | Required |
| Phone OTP | PostgreSQL replay/brute-force/concurrency | `pnpm --filter @platform/api test:db:phone-otp -- --runInBand` | Required |
| Risk watchlist | PostgreSQL concurrency | `pnpm --filter @platform/api test:db:risk-watchlist -- --runInBand` | Required |
| KYC | PostgreSQL lifecycle/concurrency | `pnpm --filter @platform/api test:db:kyc -- --runInBand` | Required |
| Admin permissions | static policy audit | `pnpm audit:admin-permissions` | Required |
| Admin UI permissions | static route/navigation audit | `pnpm audit:admin-ui-permissions` | Required |
| Architecture inventory | static ownership audit | `pnpm audit:architecture-inventory` | Required |
| Architecture boundaries | dependency/circular audit | `pnpm audit:architecture-boundaries` | Required |
| Member/Admin smoke | browser | `pnpm test:e2e:smoke` | Required before UI structural changes |
| KYC UI | browser | `pnpm test:e2e:kyc` | Required before KYC UI structural changes |
| CMS content | browser | `pnpm test:e2e:cms-content` | Required before CMS/member-content structural changes |

## Critical files protected from skipped tests

The following database suites may not contain `describe.skip`, `test.skip`, `it.skip`, `xdescribe`, `xtest`, or `xit`:

- `apps/api/src/modules/finance/finance-concurrency.db.spec.ts`
- `apps/api/src/modules/promotions/promotion-settlement.db.spec.ts`
- `apps/api/src/modules/auth/phone-otp.db.spec.ts`
- `apps/api/src/modules/risk-alerts/risk-watchlist-concurrency.db.spec.ts`
- `apps/api/src/modules/risk-alerts/kyc-concurrency.db.spec.ts`

## Refactor rule

A structural refactor may proceed only when the relevant required suites exist, are not skipped, and are executed by CI. Missing coverage must be added before the refactor, not documented after production explains the problem in its own charming way.
