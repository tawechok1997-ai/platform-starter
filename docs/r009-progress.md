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

### Repository and persistence boundary baseline

- [x] Added `docs/architecture/r009-repository-boundaries.md`.
- [x] Defined controller, application, domain, adapter, transaction-owner, raw SQL, and schema-constraint boundaries.
- [x] Added `tools/audit-r009-repository-boundaries.mjs`.
- [x] Added human-readable, JSON, and strict repository-boundary audit commands.
- [x] Wired the repository-boundary inventory into CI.

### Transaction escape inventory

- [x] Added `tools/audit-r009-transaction-escapes.mjs`.
- [x] Inventory direct writes, transaction-owned writes, raw queries, and mixed-boundary services.
- [x] Added human-readable and JSON commands.
- [x] Wired the transaction-escape inventory into CI without strict enforcement until method-level review is complete.

### Schema constraint and idempotency inventory

- [x] Added `tools/audit-r009-schema-constraints.mjs`.
- [x] Inventory uniqueness, indexes, relations, cascades, and idempotency fields for critical models.
- [x] Added human-readable, JSON, and strict commands.
- [x] Wired the schema inventory into CI; strict mode currently checks missing or renamed critical models only.

## Pending evidence

- [ ] Confirm the latest quality workflow completes successfully.
- [ ] Download and review all five R-009 JSON artifacts.
- [ ] Record every controller with direct Prisma imports, `PrismaService`, `$transaction`, or raw query usage.
- [ ] Confirm controller-audit false positives before changing application code.
- [ ] Classify any locked table reported as unknown by the lock-order audit.
- [ ] Review repository-boundary findings and confirm current Prisma leakage baseline.
- [ ] Review mixed direct/transactional write services at method level.
- [ ] Review critical schema models, renamed models, missing indexes, cascade behavior, and idempotency coverage.
- [ ] Enable strict guards only after each reviewed baseline is safe.

## Remaining R-009 work

- [ ] Move confirmed Prisma access out of controllers.
- [ ] Define concrete repository ports for each critical domain.
- [ ] Add Prisma repository adapters without leaking Prisma types.
- [ ] Consolidate transaction ownership for deposit, withdrawal, ownership, KYC/watchlist, and promotion settlement.
- [ ] Add intent-revealing row-lock helpers and migrate raw locks safely.
- [ ] Resolve confirmed queries that escape transaction boundaries.
- [ ] Add rollback, deadlock, and concurrency regression coverage.
- [ ] Resolve confirmed unique, foreign-key, cascade, index, and idempotency gaps.

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
- `c5ed4afed2d6dc5e6cf9e3abd6b85cc091ac1512` — add repository-boundary audit.
- `3e132be8d239b085fa24b28356af6aa995265152` — add transaction-escape inventory.
- `6bf1440ec2fa89b48014e7591ae508fd6cbc2c7c` — add schema-constraint inventory.
- `15dc4f5d082c4f522fa9fd2855aaf539e5f127ac` — expose parallel R-009 audit commands.
- `5719b3fd002c6e7528ed7609f9c36561d110cf70` — publish five R-009 inventories in CI.
- `5a43938a6bd37526cec944fa09639b4883ae87f2` — define repository and persistence boundaries.
