# R-009 Withdrawal Lock Snapshot Foundation

Status: IMPLEMENTED, SERVICE MIGRATION PENDING

## What changed

- Added `LockedWithdrawalSnapshot` and `LockedWalletSnapshot` persistence records.
- Added `lockWithdrawalSnapshotForUpdate`.
- Added `lockWalletSnapshotForUpdateByUserId`.
- Both helpers use the caller-owned `Prisma.TransactionClient`.
- Both helpers acquire PostgreSQL `FOR UPDATE` locks and map snake_case database fields to intent-revealing TypeScript fields.
- Added `tools/audit-r009-withdrawal-lock-snapshots.mjs` to prevent the snapshot contracts and lock behavior from disappearing silently.

## Safety

This change does not modify withdrawal calculations, lifecycle policies, request state transitions, ledger writes, wallet writes, production data, or schema. Existing service call sites remain unchanged until the migration commit.

## Remaining closure work

- Replace inline withdrawal request locks in claim, approve, complete, and reject flows.
- Replace inline wallet locks in create, complete, and reject flows.
- Move withdrawal release read/write/audit into one transaction owner.
- Verify API build/deployment after service migration.
