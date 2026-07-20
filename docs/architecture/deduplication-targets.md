# Deduplication Target Backlog

This backlog turns structural overlap into explicit, reviewable work. Production behavior must remain unchanged until each target has route, data-owner, permission, audit and test coverage evidence.

## Status

- Completed: 2 production targets plus 7 safe-batch tasks
- In progress: 1 production target
- Remaining production targets: 5

## Completed targets

| ID | Target | Result | Regression guard |
|---|---|---|---|
| DEDUP-06 | Shared security primitives | Centralized empty `JwtModule.register({})` ownership in `common/security/JwtAuthModule`; member and admin session policy services remain separate | `pnpm audit:jwt-registration-boundary` fails when feature modules register JWT infrastructure directly |
| DEDUP-07 | Shared frontend/platform utilities | Confirmed Admin and Member consume the existing `@platform/api-client` workspace package instead of introducing another transport layer | `pnpm audit:frontend-api-client-boundary` verifies both dependencies and blocks local redeclaration of shared API primitives |

## In progress

| ID | Target | Progress | Remaining closure evidence |
|---|---|---|---|
| DEDUP-04 | Activity projections | Declared `admin-activity` as the first-class cross-domain timeline owner; documented the narrower `/admin/operations/history` compatibility contract; exported `AdminActivityService`; moved `admin-activity` to shared JWT infrastructure | Inventory route consumers, move the compact audit query behind an `admin-activity` adapter, preserve the legacy response for one release cycle, then remove the transitional module |

## Remaining targets

| ID | Target | Current overlap | Safe completion condition |
|---|---|---|---|
| DEDUP-01 | Finance transitional modules | `finance` composes `queues`, `activity`, `risk` and `admin-members` | Classify every route as merge, promote or retain; preserve route, permission and audit contracts |
| DEDUP-02 | Risk ownership | `risk` is a legacy finance read model while `risk-alerts` owns the risk lifecycle | Rename or merge the legacy boundary after route consumers and DTOs are mapped |
| DEDUP-03 | Member query ownership | `admin-members` mixes identity queries with operations projections | Extract a public member-query contract; keep admin-only mutations behind permissioned services |
| DEDUP-04 | Activity projections | `activity` and `admin-activity` both expose operational timelines | Establish one projection owner and adapters for finance/admin views |
| DEDUP-05 | Finance mutation ownership | `wallet`, `topups`, `withdrawals`, `finance` and `money-ops` may share ledger, idempotency and state-transition responsibilities | Produce a mutation ownership matrix; one owner per mutation and lock boundary |

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
