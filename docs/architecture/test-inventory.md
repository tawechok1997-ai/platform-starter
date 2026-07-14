# Critical Regression Test Inventory

R-003 status: **DONE**  
Closure evidence: `docs/architecture/r003-closure.md`

This document records the automated safety net required before structural refactors are allowed in critical domains.

## Test classes

| Class | Purpose | Current evidence |
|---|---|---|
| Unit | Isolated service, guard, policy and adapter behavior | Jest suites under `apps/api/src/**/*.spec.ts` |
| Integration | Multiple services/modules with mocked or local dependencies | API Jest suite and controller/service integration specs |
| Contract | Stable request, response and error behavior | DTO/type audits and critical error-contract audit |
| Database | Real PostgreSQL state, rollback, locking and persistence behavior | Dedicated `*.db.spec.ts` suites |
| Browser | Authenticated route and user-flow behavior | Playwright smoke, KYC and CMS suites |
| Visual | Responsive rendering and snapshot comparison | Playwright visual suite |
| Concurrency | Duplicate requests, row locking, replay and idempotency | Finance, promotion, OTP, watchlist, KYC and webhook DB suites |

## Required regression commands

| Domain | Test type | Command / file | Refactor gate |
|---|---|---|---|
| API core | unit/integration/regression | `pnpm --filter @platform/api test -- --runInBand` | Required |
| Finance deposit/withdrawal | PostgreSQL state-transition/concurrency/rollback | `pnpm --filter @platform/api test:db:finance -- --runInBand` | Required |
| Promotions settlement | PostgreSQL concurrency/idempotency | `pnpm --filter @platform/api test:db:promotions -- --runInBand` | Required |
| Phone OTP | PostgreSQL replay/brute-force/concurrency | `pnpm --filter @platform/api test:db:phone-otp -- --runInBand` | Required |
| Risk watchlist | PostgreSQL concurrency | `pnpm --filter @platform/api test:db:risk-watchlist -- --runInBand` | Required |
| KYC | PostgreSQL lifecycle/concurrency | `pnpm --filter @platform/api test:db:kyc -- --runInBand` | Required |
| Support lifecycle | state-transition characterization | `apps/api/src/modules/support/support-command.service.spec.ts` | Required before support refactor |
| Admin account lifecycle | idempotency/transaction rollback characterization | `apps/api/src/modules/admin-access/admin-account-lifecycle.service.spec.ts` | Required before lifecycle refactor |
| Regression safety inventory | static refactor gate | `pnpm audit:critical-test-safety` | Required |
| Admin permissions | static policy audit | `pnpm audit:admin-permissions` | Required |
| Admin UI permissions | static route/navigation audit | `pnpm audit:admin-ui-permissions` | Required |
| Architecture inventory | static ownership audit | `pnpm audit:architecture-inventory` | Required |
| Architecture boundaries | dependency/circular audit | `pnpm audit:architecture-boundaries` | Required |
| Mutation DTO coverage | contract/static audit | `pnpm audit:mutation-dto-coverage` | Required before controller refactor |
| Critical controller types | type/static audit | `pnpm audit:critical-controller-types` | Required before controller refactor |
| Critical service types | type/static audit | `pnpm audit:critical-service-types` | Required before service refactor |
| Critical error contracts | contract/static audit | `pnpm audit:critical-error-contracts` | Required before API contract changes |
| Member/Admin smoke | browser | `pnpm test:e2e:smoke` | Required before UI structural changes |
| KYC UI | browser | `pnpm test:e2e:kyc` | Required before KYC UI structural changes |
| CMS content | browser | `pnpm test:e2e:cms-content` | Required before CMS/member-content structural changes |
| Responsive UI | visual | `pnpm test:e2e:visual` | Required before layout-wide refactors |

## Critical-flow coverage matrix

| Critical flow | Unit/integration | Database/concurrency | Browser | Current gap |
|---|---:|---:|---:|---|
| Deposit lifecycle | Yes | Yes | Partial | Credentialed deployed regression |
| Withdrawal lifecycle | Yes | Yes | Partial | Credentialed deployed regression |
| KYC lifecycle | Yes | Yes | Yes | Authenticated deployed regression |
| Watchlist lifecycle | Yes | Yes | Partial | Authenticated UI regression |
| Support lifecycle | Yes, including reopen/review/resolve transitions | No dedicated DB suite | Partial | Real PostgreSQL rollback and browser evidence |
| Admin account lifecycle | Yes, including no-op and rollback characterization | No dedicated DB suite | Partial | Ownership-transfer PostgreSQL rollback and credentialed browser evidence |
| Promotion settlement | Yes | Yes | Partial | Authenticated browser evidence |
| Provider webhook/settlement | Yes | Yes | Partial | Vendor-specific contract/UAT |

A gap in this table is a refactor blocker for the affected behavior. It is not permission to remove the row, rename the problem, or wait for production to provide an unusually expensive tutorial.

## Critical files protected from skipped tests

The following database and characterization suites may not contain `describe.skip`, `test.skip`, `it.skip`, `xdescribe`, `xtest`, or `xit`:

- `apps/api/src/modules/finance/finance-concurrency.db.spec.ts`
- `apps/api/src/modules/promotions/promotion-settlement.db.spec.ts`
- `apps/api/src/modules/auth/phone-otp.db.spec.ts`
- `apps/api/src/modules/risk-alerts/risk-watchlist-concurrency.db.spec.ts`
- `apps/api/src/modules/risk-alerts/kyc-concurrency.db.spec.ts`
- `apps/api/src/modules/support/support-command.service.spec.ts`
- `apps/api/src/modules/admin-access/admin-account-lifecycle.service.spec.ts`

## Refactor rule

A structural refactor may proceed only when the relevant required suites exist, are not skipped, and are executed by CI. Missing coverage must be added before the refactor. Every refactor change must identify:

1. The protected domain and behavior.
2. The commands run before and after the change.
3. Any known regression gap that remains.
4. The owner of follow-up coverage work.
