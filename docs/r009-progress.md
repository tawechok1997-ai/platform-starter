# R-009 Progress

Status: 🟡 PARTIAL

Started: 2026-07-15

## Scope

R-009 establishes repository, transaction, and persistence boundaries without changing existing business behavior, transaction semantics, idempotency, locks, claims, retries, or error contracts.

## Closed subtasks

- [x] ตรวจ controller ที่เรียก Prisma โดยตรงทั้งหมด
- [x] ย้าย Prisma access ออกจาก controller

Closure evidence:

- `docs/evidence/r009-controller-persistence-boundary.md`
- `docs/evidence/r009-controller-persistence-closure.md`
- `tools/audit-r009-controller-prisma.mjs`
- `tools/audit-r009-controller-closure.mjs`
- strict controller guard and closure audit in `.github/workflows/r006-quality.yml`

## Implemented

### Controller persistence boundary — DONE

- [x] Added `tools/audit-r009-controller-prisma.mjs`.
- [x] Added human-readable, JSON, and strict audit commands.
- [x] Wired the controller persistence inventory into `.github/workflows/r006-quality.yml`.
- [x] Enabled `audit:r9-controller-prisma:strict` in CI.
- [x] Repository source search returned zero controller matches for `PrismaService`, `this.prisma`, and `@prisma/client`.
- [x] Added `tools/audit-r009-controller-closure.mjs` to verify zero offenders and permanent CI wiring.
- [x] Added durable closure evidence under `docs/evidence/`.

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

- [ ] Confirm the latest GitHub quality workflow completes successfully after the controller closure audit was added.
- [ ] Download and review the remaining lock-order, repository-boundary, transaction-escape, and schema JSON artifacts.
- [ ] Classify any locked table reported as unknown by the lock-order audit.
- [ ] Review repository-boundary findings and confirm current Prisma leakage baseline.
- [ ] Review mixed direct/transactional write services at method level.
- [ ] Review critical schema models, renamed models, missing indexes, cascade behavior, and idempotency coverage.
- [ ] Enable remaining strict guards only after each reviewed baseline is safe.

## Remaining R-009 work

- [ ] Define concrete repository ports for each critical domain.
- [ ] Add Prisma repository adapters without leaking Prisma types.
- [ ] Consolidate transaction ownership for deposit approval.
- [ ] Consolidate transaction ownership for withdrawal completion.
- [ ] Consolidate transaction ownership for ownership transfer.
- [ ] Consolidate transaction ownership for KYC review/watchlist override.
- [ ] Consolidate transaction ownership for promotion settlement.
- [ ] Close lock-order evidence.
- [ ] Add intent-revealing row-lock helpers and migrate raw locks safely.
- [ ] Resolve confirmed queries that escape transaction boundaries.
- [ ] Add rollback, deadlock, and concurrency regression coverage.
- [ ] Resolve confirmed unique, foreign-key, cascade, index, and idempotency gaps.

## Count

- Total R-009 subtasks: 15
- Closed with durable evidence: 2
- Remaining not closed: 13
- Partial or under active review: 9
- Not yet implemented: 4

## Safety decision

These slices do not modify Prisma schema, production data, transaction boundaries, finance behavior, permissions, secrets, provider gates, or deployment targets.

## Latest commits

- `71ae3ff748aaa04d9c2fb05fffc2213284dd650a` — enforce zero direct Prisma usage in controllers.
- `0e8b2fd9c45a54d7cc7610a74f71019aa3ca3aa9` — record controller-boundary evidence and closure rule.
- `b417893b9aa86169e2db0fdf08de8a3e1952eae5` — add controller persistence closure audit.
- `9fe460060021e1995a186e5d661bd389145c8a1d` — record controller closure evidence.
- `4aace75ec76295ac6bb42b1b5b1888dff335559e` — enforce controller closure audit in CI.
