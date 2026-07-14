# R-009 Withdrawal Row-Lock Migration Closure

Status: CLOSED

## Scope

`WithdrawalsService` no longer owns inline `FOR UPDATE` SQL. Transaction-scoped row locking is centralized through typed helpers in `apps/api/src/common/infrastructure/prisma-row-locks.ts`.

## Migrated flows

- member withdrawal creation locks and reads the wallet through `lockWalletSnapshotForUpdateByUserId`
- claim locks and reads the withdrawal through `lockWithdrawalSnapshotForUpdate`
- release locks, validates, updates, and audits inside one Prisma transaction
- approval locks and reads the withdrawal through the shared snapshot helper
- completion locks withdrawal before wallet and retains the existing ledger, wallet, request, and audit transaction ownership
- rejection locks withdrawal before wallet and retains the existing reservation-release transaction ownership

## Regression protection

`tools/audit-r009-withdrawal-row-lock-migration.mjs` fails if:

- any migrated flow stops using the typed helpers
- inline `FOR UPDATE` returns to `WithdrawalsService`
- the legacy locked-wallet row type returns
- release state mutation and audit leave the transaction owner

## Safety

This refactor preserves existing status policies, wallet calculations, idempotency keys, guarded updates, audit payloads, and lock order. It changes the ownership location of row-lock SQL, not the business behavior.
