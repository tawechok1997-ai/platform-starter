# R-009 Repository and Persistence Boundaries

## Purpose

Critical domains must expose persistence-agnostic contracts. Prisma belongs in infrastructure adapters and transaction owners, not in controllers, domain rules, or application-facing repository interfaces.

## Boundary rules

1. Controllers call application services only.
2. Domain and application repository contracts must not import `@prisma/client`, `PrismaService`, generated Prisma model types, or Prisma transaction types.
3. Prisma adapters may translate database records into domain/application data structures.
4. Critical mutations must have one explicit transaction owner.
5. Repository methods called inside a transaction must receive an application-owned transaction context or be implemented by the transaction owner; Prisma transaction clients must not leak through public interfaces.
6. Raw SQL and row locks remain infrastructure concerns and must preserve the lock order documented in `transaction-lock-order.md`.
7. Schema constraints and idempotency keys are part of the persistence contract and require audit evidence before a critical flow is considered closed.

## Critical domains

- Deposit and wallet credit
- Withdrawal reservation and completion
- Admin ownership transfer
- KYC review and watchlist override
- Promotion settlement
- Support and notification lifecycle mutations

## Current enforcement

- `audit:r9-controller-prisma` inventories direct Prisma use in controllers.
- `audit:r9-repository-boundaries` detects Prisma leakage in domain/application repository contracts.
- `audit:r9-transaction-escapes` inventories mixed direct and transactional writes for method-level review.
- `audit:r9-lock-order:strict` rejects known lock-order inversions.
- `audit:r9-schema-constraints` inventories uniqueness, indexes, relations, cascades, and idempotency fields for critical models.

Strict enforcement remains limited to checks whose current baseline has been reviewed. Inventory findings must be inspected before code is moved, especially in financial flows.
