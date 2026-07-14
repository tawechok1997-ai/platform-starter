# R-009 Safe Parallel Adapter Evidence

## Scope

This slice advances three independent persistence-boundary tracks without changing runtime service wiring:

1. Admin ownership Prisma adapter.
2. Adapter-to-schema compatibility inventory.
3. Prisma adapter coverage enforcement.

## Implemented

- `PrismaAdminOwnershipRepositoryAdapter` uses the existing `AdminUser`, `AdminUserRole`, and `Role` schema models.
- Owner rows are locked before counting; aggregate locking is deliberately avoided because PostgreSQL does not allow `FOR UPDATE` on aggregate results.
- The adapter receives `Prisma.TransactionClient` from the transaction owner and never opens a nested transaction.
- The schema compatibility audit confirms direct model coverage for deposit, withdrawal, and ownership.
- KYC/watchlist and promotion settlement remain explicitly unmapped because the current Prisma schema does not expose `KycRequest`, `WatchlistMatch`, or `PromotionSettlement` models under those names.
- The coverage audit enforces the currently implemented deposit, withdrawal, and ownership adapters and rejects nested transaction ownership inside adapters.

## Safety

No service has been switched to these adapters in this slice. No schema migration, production data mutation, permission change, provider gate, or financial behavior change is included.

## Verification gate

`.github/workflows/r009-parallel-safe-adapters.yml` runs:

- schema compatibility audit;
- adapter coverage audit;
- repository type-boundary strict audit;
- API typecheck;
- JSON evidence upload.

## Honest status

Prisma adapters are implemented for 3 of 5 critical domains. The R-009 Prisma-adapter subtask remains partial until KYC/watchlist and promotion settlement mappings are confirmed, their adapters are implemented, and runtime services are migrated safely.
