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
- [x] All implemented adapters receive `Prisma.TransactionClient` from the transaction owner.
- [x] Implemented adapters do not instantiate `PrismaClient` or call `$transaction`.
- [x] Added compatibility and adapter coverage audits.
- [ ] Confirm adapter workflows pass.
- [ ] Resolve the real schema mappings for KYC/watchlist and promotion settlement.
- [ ] Add KYC/watchlist and promotion settlement adapters.
- [ ] Migrate critical services to use the adapters.

Current adapter coverage: **3 of 5 critical domains** (deposit, withdrawal, ownership).

### Audit unique/foreign-key/cascade/idempotency constraints

- [x] Added broad schema inventory at `tools/audit-r009-schema-constraints.mjs`.
- [x] Added semantic closure gate `tools/audit-r009-critical-constraint-closure.mjs`.
- [x] The closure gate verifies 14 critical uniqueness and index contracts across wallet, ledger, deposit, withdrawal, ownership, provider transfer, and webhook persistence.
- [x] No schema or migration change was required in this slice.
- [ ] Confirm `.github/workflows/r009-parallel-boundary-closure.yml` passes.

## Active partial work

### Intent-revealing row-lock helpers

- [x] Added `apps/api/src/common/infrastructure/prisma-row-locks.ts`.
- [x] Added helpers for deposit, withdrawal, admin-user, and active-owner locks.
- [x] Migrated finance and ownership adapters away from inline raw lock SQL.
- [x] Added `tools/audit-r009-row-lock-helpers.mjs`.
- [ ] Migrate remaining raw row locks in legacy services.
- [ ] Confirm workflow and API typecheck pass.

### Query-outside-transaction boundary

- [x] Added `tools/audit-r009-transaction-context.mjs` for Prisma infrastructure.
- [x] The guard rejects nested `$transaction`, `new PrismaClient`, and unscoped `this.prisma` usage in repository infrastructure.
- [x] Added the guard to `.github/workflows/r009-parallel-boundary-closure.yml`.
- [ ] Complete method-level review of legacy services from `tools/audit-r009-transaction-escapes.mjs`.
- [ ] Resolve confirmed legacy service escapes.

## Pending evidence

- [ ] Confirm the dedicated critical repository ports workflow completes successfully.
- [ ] Confirm the Prisma adapter workflows complete successfully.
- [ ] Confirm the parallel boundary closure workflow completes successfully.
- [ ] Confirm the latest GitHub quality workflow completes successfully.
- [ ] Confirm zero repository-boundary violations.
- [ ] Confirm zero lock inversions and zero unclassified locked tables.
- [ ] Review mixed direct/transactional write services at method level.

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
- [ ] Complete row-lock helper migration across legacy services.
- [ ] Resolve confirmed legacy transaction escapes.
- [ ] Add rollback, deadlock, and concurrency regression coverage.
- [ ] Close constraint/idempotency audit after workflow verification.

## Count

- Total R-009 subtasks: 15
- Closed with durable evidence: 2
- Remaining not closed: 13
- Enforced and awaiting workflow verification: 5
- Other partial or under active review: 6
- Not yet implemented: 2

## Safety decision

This slice adds shared lock helpers and static closure gates but does not switch existing production services to new transaction owners. It does not modify Prisma schema, production data, live finance behavior, permissions, secrets, provider gates, or deployment targets.

## Latest commits

- `16164bf2d596a797bf7aea34cd77b70a3c2fb7ee` — add intent-revealing Prisma row-lock helpers.
- `4df56109579ea0be82aa3bca9f1939ef663667c8` — migrate finance adapters to lock helpers.
- `86f582814606102d737ccd0d27103a548902861f` — migrate ownership adapter to lock helpers.
- `b8ef79988a31c733bf026f889617869b54af0f0f` — add row-lock helper closure audit.
- `de6be17c7fcf7d063d1590812171d758a67d404a` — add transaction-context guard.
- `5963cfeedd01f7d4fd8a66baa084bd34aa592d77` — add semantic constraint closure audit.
- `2be107fefeaff6f637b80d372046ea1f6afc7bb4` — add parallel boundary closure workflow.
- `27ddf1fc9723aa4594160fe1c328454ffe78ccf4` — record parallel boundary closure evidence.
