# R-009 Progress

Status: 🟡 PARTIAL

Started: 2026-07-15

## Scope

R-009 establishes repository, transaction, and persistence boundaries without changing existing business behavior, transaction semantics, idempotency, locks, claims, retries, or error contracts.

## Implemented

### Controller persistence inventory

- [x] Added `tools/audit-r009-controller-prisma.mjs`.
- [x] Added human-readable, JSON, and strict audit commands.
- [x] Wired the non-strict controller persistence inventory into `.github/workflows/r006-quality.yml`.
- [x] Configured CI to upload the controller inventory for review.
- [x] Kept controller strict enforcement disabled until the current baseline is reviewed and confirmed at zero.

### Transaction lock-order policy

- [x] Added `docs/architecture/transaction-lock-order.md`.
- [x] Defined aggregate/actor/wallet/ledger/audit lock ordering.
- [x] Documented the wallet-first exception for workflow creation where no aggregate row exists yet.
- [x] Added `tools/audit-r009-lock-order.mjs`.
- [x] Added human-readable, JSON, and strict lock-order audit commands.
- [x] Wired strict known-order inversion detection into CI.
- [x] Configured CI to upload the lock-order inventory with the controller inventory.

## Pending evidence

- [ ] Confirm the latest quality workflow completes successfully.
- [ ] Download and review the controller and lock-order JSON artifacts.
- [ ] Record every controller with direct Prisma imports, `PrismaService`, `$transaction`, or raw query usage.
- [ ] Confirm controller-audit false positives before changing application code.
- [ ] Classify any locked table reported as unknown by the lock-order audit.
- [ ] Enable controller strict mode only after the reviewed baseline reaches zero.

## Remaining R-009 work

- [ ] Move confirmed Prisma access out of controllers.
- [ ] Define repository ports for critical domains.
- [ ] Add Prisma repository adapters without leaking Prisma types.
- [ ] Consolidate transaction ownership for deposit, withdrawal, ownership, KYC/watchlist, and promotion settlement.
- [ ] Add intent-revealing row-lock helpers and migrate raw locks safely.
- [ ] Audit queries that escape transaction boundaries.
- [ ] Add rollback, deadlock, and concurrency regression coverage.
- [ ] Audit unique, foreign-key, cascade, and idempotency constraints.

## Safety decision

These slices are read-only with respect to runtime persistence. They do not modify Prisma schema, production data, transaction boundaries, finance behavior, permissions, secrets, provider gates, or deployment targets.

## Commits

- `141a476ee44ed95056c0dd75b259f8797736d45a` — add controller Prisma inventory audit.
- `c514f96558eccec2100f4c0efdd47172afee5cd8` — expose controller audit commands.
- `813e06e2a974465505f4aa6063755851a82a36e7` — publish controller inventory artifact in CI.
- `3f9587fc5538315e02825f0676d172ec20cdeb0e` — define transaction lock-order policy.
- `29678773b14b47599be7ac774caf797194d79216` — add lock-order audit.
- `257d70f1f1757685cedff175faad98475f83ca21` — expose lock-order audit commands.
- `3751ba5a06a7e320fb6441d91657e062894b31fc` — enforce known lock order and publish inventories in CI.
