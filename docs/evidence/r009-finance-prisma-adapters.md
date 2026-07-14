# R-009 Finance Prisma Adapter Evidence

Status: ENFORCED, awaiting workflow verification

## Scope

This slice adds transaction-scoped Prisma adapters for the deposit and withdrawal critical write domains.

## Evidence

- `apps/api/src/common/infrastructure/prisma-finance-repository-adapters.ts`
- `tools/audit-r009-finance-prisma-adapters.mjs`
- `.github/workflows/r009-finance-prisma-adapters.yml`

## Safety properties

- The transaction owner injects `Prisma.TransactionClient`.
- Adapters do not instantiate `PrismaClient`.
- Adapters do not call `$transaction`.
- Locked reads use explicit `FOR UPDATE` statements.
- Repository interfaces remain Prisma-free.
- This slice does not switch existing production services to the adapters yet.

## Remaining adapter coverage

- Admin ownership transfer
- KYC review/watchlist override
- Promotion settlement
- Runtime service migration for deposit and withdrawal

## Closure rule

The full R-009 Prisma adapter subtask remains open until all five critical-domain adapters exist, API typecheck passes, and the critical write services use the adapters under a single caller-owned transaction.
