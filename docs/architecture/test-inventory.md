# Critical Regression Test Inventory

This document is the enforced safety net required before structural refactors are allowed in critical domains.

## Automated coverage inventory

| Domain | Test type | Command / file | Protected behavior | Refactor gate |
|---|---|---|---|---|
| API core | unit / characterization / contract | `pnpm --filter @platform/api test -- --runInBand` | service behavior, state transitions, validation and stable error contracts | Required |
| Finance deposit/withdrawal | PostgreSQL concurrency / rollback / idempotency | `pnpm --filter @platform/api test:db:finance -- --runInBand` and `apps/api/src/modules/finance/finance-concurrency.db.spec.ts` | row locks, claim ownership, rollback, duplicate settlement and completion idempotency | Required |
| Promotions settlement | PostgreSQL concurrency / idempotency | `pnpm --filter @platform/api test:db:promotions -- --runInBand` and `apps/api/src/modules/promotions/promotion-settlement.db.spec.ts` | duplicate claim/settlement prevention and wallet settlement atomicity | Required |
| Phone OTP | PostgreSQL security / concurrency | `pnpm --filter @platform/api test:db:phone-otp -- --runInBand` and `apps/api/src/modules/auth/phone-otp.db.spec.ts` | replay, brute force, expiry and concurrent verification | Required |
| Risk watchlist | PostgreSQL lifecycle / concurrency | `pnpm --filter @platform/api test:db:risk-watchlist -- --runInBand` and `apps/api/src/modules/risk-alerts/risk-watchlist-concurrency.db.spec.ts` | matching, duplicate protection, release and override lifecycle | Required |
| KYC | PostgreSQL lifecycle / concurrency | `pnpm --filter @platform/api test:db:kyc -- --runInBand` and `apps/api/src/modules/risk-alerts/kyc-concurrency.db.spec.ts` | document/review state transitions and review conflicts | Required |
| Support | unit / characterization | API Jest suite, including support service and attachment policy specs | ticket lifecycle, ownership, attachment policy and cleanup compensation | Required before support refactor |
| Admin lifecycle | unit / permission policy | API Jest suite plus `pnpm audit:admin-permissions` | owner transfer, last-owner protection, step-up and mutation authorization | Required before auth/admin refactor |
| Critical API errors | contract audit | `pnpm audit:critical-error-contracts` and `pnpm audit:error-code-catalog` | stable error codes and payload shape without message parsing | Required |
| Mutation DTOs | static contract audit | `pnpm audit:mutation-dto-coverage` | DTO presence on body-bearing mutations | Required |
| Admin permissions | static policy audit | `pnpm audit:admin-permissions` | API mutation permission metadata | Required |
| Admin UI permissions | static route/navigation audit | `pnpm audit:admin-ui-permissions` | hidden/blocked controls and permission-aware navigation | Required |
| Finance workflow | static invariant audit | `pnpm audit:finance-workflows` | transition, idempotency and legacy-path invariants | Required |
| Architecture inventory | static ownership audit | `pnpm audit:architecture-inventory` | module, route and job ownership | Required |
| Architecture boundaries | dependency/circular audit | `pnpm audit:architecture-boundaries` | circular and forbidden cross-app imports | Required |
| Member/Admin smoke | browser | `pnpm test:e2e:smoke` | route-level integration and critical browser paths | Required before UI structural changes when credentials are available |
| KYC UI | browser | `pnpm test:e2e:kyc` | member upload and admin review responsive states | Required before KYC UI structural changes |
| CMS content | browser | `pnpm test:e2e:cms-content` | CMS upload/content/member rendering states | Required before CMS/member-content structural changes |

## Known environment-gated coverage

The following suites exist but require deployed URLs, seeded credentials, or browser binaries. Their absence in a local shell is not permission to bypass them:

- authenticated Admin/Member browser regression
- deployed cookie/session rotation regression
- provider-specific UAT
- production migration/rollback verification

These gaps block production verification, but do not block code-only refactors whose affected domain is fully covered by the non-deployed gates above.

## Critical files protected from skipped tests

The following database suites may not contain `describe.skip`, `test.skip`, `it.skip`, `xdescribe`, `xtest`, or `xit`:

- `apps/api/src/modules/finance/finance-concurrency.db.spec.ts`
- `apps/api/src/modules/promotions/promotion-settlement.db.spec.ts`
- `apps/api/src/modules/auth/phone-otp.db.spec.ts`
- `apps/api/src/modules/risk-alerts/risk-watchlist-concurrency.db.spec.ts`
- `apps/api/src/modules/risk-alerts/kyc-concurrency.db.spec.ts`

## Refactor rule

A structural refactor may proceed only when:

1. the affected domain is listed above;
2. required suites and audits exist and are not skipped;
3. CI executes the gates;
4. the PR records before/after regression evidence;
5. new behavior or a discovered gap adds a characterization test before code movement.

Missing coverage must be added before the refactor, not documented after production explains the problem in its own charming way.