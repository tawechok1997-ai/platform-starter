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
- [x] Enabled the strict repository boundary in required workflows.
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
- [x] Added `PrismaAdminOwnershipRepositoryAdapter` using the existing `AdminUser`, `AdminUserRole`, and `Role` schema models.
- [x] Ownership adapter locks owner rows before counting and avoids invalid aggregate row locking.
- [x] All implemented adapters receive `Prisma.TransactionClient` from the transaction owner.
- [x] Implemented adapters do not instantiate `PrismaClient` or call `$transaction`.
- [x] Added `tools/audit-r009-adapter-schema-compatibility.mjs`.
- [x] Added `tools/audit-r009-prisma-adapter-coverage.mjs`.
- [x] Added `.github/workflows/r009-parallel-safe-adapters.yml` with compatibility, coverage, repository-boundary, API typecheck, and evidence upload steps.
- [x] Added `docs/evidence/r009-safe-parallel-adapters.md`.
- [ ] Confirm the safe-parallel adapter workflow passes.
- [ ] Resolve the real schema mappings for KYC/watchlist and promotion settlement.
- [ ] Add KYC/watchlist and promotion settlement adapters.
- [ ] Migrate critical services to use the adapters.

Current adapter coverage: **3 of 5 critical domains** (deposit, withdrawal, ownership).

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
- [ ] Confirm the finance and safe-parallel Prisma adapter workflows complete successfully.
- [ ] Confirm the latest GitHub quality workflow completes successfully.
- [ ] Confirm zero repository-boundary violations.
- [ ] Confirm zero lock inversions and zero unclassified locked tables.
- [ ] Review mixed direct/transactional write services at method level.
- [ ] Review critical schema models, missing indexes, cascade behavior, and idempotency coverage.

## Remaining R-009 work

- [ ] Close critical repository ports after workflow verification.
- [ ] Complete KYC/watchlist and promotion Prisma adapters and migrate services.
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
- Other partial or under active review: 7
- Not yet implemented: 2

## Safety decision

This slice adds an ownership adapter and verification gates but does not switch existing production services to adapters. It does not modify Prisma schema, production data, live transaction boundaries, finance behavior, permissions, secrets, provider gates, or deployment targets.

## Latest commits

- `9bb963cea883959acf82a3125d60fa2d11f5898f` — add transaction-scoped ownership Prisma adapter.
- `f40bbb24e3bb3c4519fc63c5fc3f437f20f1c15c` — fix owner locking before counting.
- `400f3fe27281914bd41af0f2c1e6bc65cb132677` — inventory adapter-to-schema compatibility.
- `b01c55a63819e7c12b5b5771cbb295685c99ad14` — enforce implemented adapter coverage.
- `c3c935397915614a7ed87223e3faea5127a45c6e` — add safe parallel adapter verification workflow.
- `23c5345ce019e5ad9fb16c0918593d4f6f13b07c` — record safe parallel adapter evidence.
