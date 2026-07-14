# R-009 Parallel Boundary Closure Evidence

This slice advances three independent R-009 boundaries without changing production transaction ownership or business behavior.

## Row-lock helpers

- Added `apps/api/src/common/infrastructure/prisma-row-locks.ts`.
- Migrated deposit, withdrawal, and ownership Prisma adapters away from inline raw lock SQL.
- Added `tools/audit-r009-row-lock-helpers.mjs` to prevent direct raw row-lock SQL from returning to those adapters.

## Transaction context

- Added `tools/audit-r009-transaction-context.mjs`.
- The guard rejects Prisma infrastructure that instantiates `PrismaClient`, opens nested `$transaction` calls, or uses an unscoped `this.prisma` client.
- Transaction ownership remains with the caller through `Prisma.TransactionClient`.

## Constraint and idempotency closure

- Added `tools/audit-r009-critical-constraint-closure.mjs`.
- The audit checks critical uniqueness and indexes for wallet, ledger, deposit, withdrawal, ownership, provider transfer, and webhook persistence.
- No Prisma schema or migration was changed in this slice.

## Verification

The required workflow is `.github/workflows/r009-parallel-boundary-closure.yml` and runs all three audits plus repository-boundary strict mode and API typecheck.

Local execution could not be obtained in the current tool environment because DNS resolution for `github.com` was unavailable. Therefore workflow success must be recorded before the related subtasks are marked closed.
