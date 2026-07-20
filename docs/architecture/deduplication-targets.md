# Deduplication Target Backlog

This backlog turns structural overlap into explicit, reviewable work. Production behavior must remain unchanged until each target has route, data-owner, permission, audit and test coverage evidence.

## Status

- Completed: 6 production targets plus 11 safe-batch tasks
- In progress: 1 production target
- Remaining production targets: 1

## Completed targets

| ID | Target | Result | Regression guard |
|---|---|---|---|
| DEDUP-01 | Finance transitional modules | `FinanceModule` now owns only `/admin/finance` reporting projections; queues, activity, risk and admin-members are promoted to direct `AppModule` composition while all routes and permissions remain unchanged | `node tools/audit-finance-module-boundary.mjs` prevents unrelated operational modules from returning to Finance composition |
| DEDUP-02 | Risk ownership | `risk-alerts` now owns the risk lifecycle and the explicitly named finance-risk summary projection; `/admin/risk/summary` remains a compatibility route with its original permission and response contract | `node tools/audit-risk-ownership-boundary.mjs` verifies the legacy module only delegates and prevents the removed query implementation from returning |
| DEDUP-03 | Member query ownership | Added the read-only `MEMBER_QUERY` contract and token for cross-module consumers while retaining current admin list, insights and detail projections; status mutations remain owned by `AdminMembersCommandService` | `node tools/audit-member-query-boundary.mjs` blocks mutation APIs from the public query contract and verifies the module token binding |
| DEDUP-04 | Activity projections | `admin-activity` now owns both the cross-domain timeline and compact audit-history query; `/admin/operations/history` remains a compatibility route with its original permission and response contract | `activity` imports `AdminActivityModule` and delegates to its exported query service; the duplicate local query implementation was removed |
| DEDUP-06 | Shared security primitives | Centralized empty `JwtModule.register({})` ownership in `common/security/JwtAuthModule`; member and admin session policy services remain separate; wallet, topups, withdrawals, money-ops and risk-alerts were also migrated to the shared module | `pnpm audit:jwt-registration-boundary` fails when feature modules register JWT infrastructure directly |
| DEDUP-07 | Shared frontend/platform utilities | Confirmed Admin and Member consume the existing `@platform/api-client` workspace package instead of introducing another transport layer | `pnpm audit:frontend-api-client-boundary` verifies both dependencies and blocks local redeclaration of shared API primitives |

## In progress

| ID | Target | Progress | Remaining closure evidence |
|---|---|---|---|
| DEDUP-05 | Finance mutation ownership | Added an explicit mutation ownership matrix and an automated guard that blocks new direct wallet mutations outside approved owners; identified `MoneyOpsService.mutateLedger()` as an existing gated duplicate mutation path | Preserve its feature gate, endpoint response, references, idempotency, permission and audit behavior while delegating the mutation to WalletService; then remove the temporary audit exception |

## Required evidence before module moves

1. Route inventory with method, path and controller.
2. Data mutation owner and transaction boundary.
3. Permission and actor contract.
4. Audit event owner.
5. Public imports and consumers.
6. Unit, integration and smoke coverage.
7. Rollback plan with compatibility exports when needed.

## Rules

- Do not merge modules solely because names look similar.
- Do not move Prisma mutations before lock and idempotency ownership is documented.
- Do not remove compatibility exports in the same change that moves implementation.
- Keep each production refactor behind a focused pull request after this inventory PR is merged.
