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

## Enforced and awaiting verification

### กำหนด repository ports สำหรับ critical domains

- [x] Added `apps/api/src/common/application/critical-repository-ports.ts`.
- [x] Defined ports for deposit, withdrawal, ownership, KYC/watchlist, and promotion settlement.
- [x] Added intent-revealing locked-read operations.
- [x] Kept all contracts persistence-agnostic.
- [x] Added `tools/audit-r009-critical-repository-ports.mjs`.
- [x] Added dedicated workflow `.github/workflows/r009-critical-repository-ports.yml` with port audit, repository strict guard, and API typecheck.
- [x] Added `docs/evidence/r009-critical-repository-ports.md`.
- [ ] Confirm the dedicated workflow passes.

### ห้าม Prisma type หลุดผ่าน repository interface

- [x] Added `tools/audit-r009-repository-boundaries.mjs`.
- [x] Scans domain/application and repository/port contracts for Prisma imports, `PrismaService`, and `Prisma.*` types.
- [x] Enabled `pnpm audit:r9-repository-boundaries:strict` in required workflows.
- [x] Added `docs/evidence/r009-repository-type-boundary.md`.
- [x] Added boundary closure structure audit.
- [ ] Confirm the latest GitHub workflow reports zero repository-boundary violations.

### กำหนด lock order มาตรฐานเพื่อลด deadlock

- [x] Added `docs/architecture/transaction-lock-order.md`.
- [x] Defined aggregate/actor/wallet/ledger/audit lock ordering.
- [x] Added `tools/audit-r009-lock-order.mjs`.
- [x] Strict mode fails on known inversions and unclassified row-locked tables.
- [x] Enabled the strict lock-order command in the required quality workflow.
- [x] Added `docs/evidence/r009-lock-order-boundary.md`.
- [x] Added boundary closure structure audit.
- [ ] Confirm the latest GitHub quality workflow reports zero inversions and zero unclassified locked tables.

### ทำ Prisma repository adapters

- [x] Added transaction-scoped deposit and withdrawal adapters at `apps/api/src/common/infrastructure/prisma-finance-repository-adapters.ts`.
- [x] Adapters implement persistence-agnostic ports.
- [x] Transaction ownership remains with the caller through injected `Prisma.TransactionClient`.
- [x] Adapters do not instantiate `PrismaClient` or call `$transaction`.
- [x] Added explicit row locks for `top_up_requests` and `withdrawal_requests`.
- [x] Added `tools/audit-r009-finance-prisma-adapters.mjs`.
- [x] Added `.github/workflows/r009-finance-prisma-adapters.yml` with adapter audit, repository-boundary strict guard, and API typecheck.
- [x] Added `docs/evidence/r009-finance-prisma-adapters.md`.
- [ ] Add ownership, KYC/watchlist, and promotion settlement adapters.
- [ ] Migrate critical services to use the adapters.
- [ ] Confirm the dedicated workflow passes.

## Implemented baselines

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

- [ ] Confirm the dedicated critical repository ports workflow completes successfully.
- [ ] Confirm the dedicated finance Prisma adapter workflow completes successfully.
- [ ] Confirm the latest GitHub quality workflow completes successfully.
- [ ] Confirm zero repository-boundary violations.
- [ ] Confirm zero lock inversions and zero unclassified locked tables.
- [ ] Review mixed direct/transactional write services at method level.
- [ ] Review critical schema models, missing indexes, cascade behavior, and idempotency coverage.

## Remaining R-009 work

- [ ] Close critical repository ports after workflow verification.
- [ ] Complete ownership, KYC/watchlist, and promotion Prisma adapters and migrate services.
- [ ] Close Prisma-type repository boundary after workflow evidence.
- [ ] Consolidate transaction ownership for deposit approval.
- [ ] Consolidate transaction ownership for withdrawal completion.
- [ ] Consolidate transaction ownership for ownership transfer.
- [ ] Consolidate transaction ownership for KYC review/watchlist override.
- [ ] Consolidate transaction ownership for promotion settlement.
- [ ] Close lock-order evidence after workflow verification.
- [ ] Add intent-revealing row-lock helpers and migrate raw locks safely.
- [ ] Resolve confirmed queries that escape transaction boundaries.
- [ ] Add rollback, deadlock, and concurrency regression coverage.
- [ ] Resolve confirmed unique, foreign-key, cascade, index, and idempotency gaps.

## Count

- Total R-009 subtasks: 15
- Closed with durable evidence: 2
- Remaining not closed: 13
- Enforced and awaiting workflow verification: 4
- Other partial or under active review: 6
- Not yet implemented: 3

## Safety decision

This slice adds adapters but does not switch existing production services to them. It does not modify Prisma schema, production data, live transaction boundaries, finance behavior, permissions, secrets, provider gates, or deployment targets.

## Latest commits

- `40776104d1e899b11b0aae36b7bcc971557213f7` — add transaction-scoped deposit and withdrawal Prisma adapters.
- `9c9fdc5a09efc811bf1d849eafb0908dc899ac99` — audit finance Prisma adapter structure.
- `77381fb8f4cc12ae6b78e3ec6d9fb4533ab484ba` — verify finance adapters with dedicated workflow.
- `811aba0fb1f767301dda4da457aeff3890c074a6` — record finance Prisma adapter evidence.
