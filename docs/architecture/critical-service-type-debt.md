# Critical service type-debt ratchet

This document records the temporary type-debt budgets for critical API services.
The budgets are enforced by `pnpm audit:critical-service-types`.

## Rules

1. Budgets may only move downward during normal refactors.
2. A budget increase requires an architecture note explaining the regression and a follow-up owner.
3. New critical services must start with zero explicit `any`, zero `as any`, and zero non-null assertions.
4. A service budget must be lowered in the same change that removes debt.
5. Type cleanup must preserve behavior and have regression evidence before business logic is moved.

## Current targets

| Service | Explicit `any` ceiling | `as any` ceiling | Non-null ceiling | First cleanup target |
|---|---:|---:|---:|---|
| Risk alerts | 40 | 18 | 3 | actor types, Prisma filters, metadata parsing |
| Promotions | 25 | 10 | 3 | command types, metadata parsing, formatted projections |
| Withdrawal workflow | 3 | 1 | 1 | unknown error narrowing and proof state rows |
| Money operations | 24 | 12 | 2 | simulator payloads and ledger mutation parsing |

The ceilings are guardrails, not acceptable end states. The P4 definition of done remains zero unsafe casts in critical paths.

## Reduction order

1. Replace actor and request `any` with shared actor types.
2. Replace Prisma `where` and enum casts with generated Prisma types.
3. Parse JSON metadata from `unknown` through typed helpers.
4. Replace generic arrays and formatters with inferred Prisma payload types.
5. Remove non-null assertions by narrowing before access.
6. Lower the ratchet after every verified reduction.
