# R-009 Progress

Status: 🟡 PARTIAL

Started: 2026-07-15

## Scope

R-009 establishes repository, transaction, and persistence boundaries without changing existing business behavior, transaction semantics, idempotency, locks, claims, retries, or error contracts.

## Closed subtasks

- [x] ตรวจ controller ที่เรียก Prisma โดยตรงทั้งหมด
- [x] ย้าย Prisma access ออกจาก controller
- [x] กำหนด repository ports สำหรับ critical domains
- [x] ห้าม Prisma type หลุดผ่าน repository interface
- [x] Consolidate transaction ownership for withdrawal completion

Closure evidence:

- `docs/evidence/r009-controller-persistence-boundary.md`
- `docs/evidence/r009-controller-persistence-closure.md`
- `tools/audit-r009-controller-prisma.mjs`
- `tools/audit-r009-controller-closure.mjs`
- strict controller guard and closure audit in `.github/workflows/r006-quality.yml`
- `apps/api/src/common/application/critical-repository-ports.ts`
- `tools/audit-r009-critical-repository-ports.mjs`
- `tools/audit-r009-repository-boundaries.mjs`
- `tools/audit-r009-boundary-closure.mjs`
- `docs/evidence/r009-critical-repository-ports.md`
- `docs/evidence/r009-repository-type-boundary.md`
- `docs/evidence/r009-repository-contract-closure.md`
- `tools/audit-r009-withdrawal-completion-transaction.mjs`
- `tools/audit-r009-withdrawal-completion-rollback.mjs`
- `docs/evidence/r009-withdrawal-completion-transaction.md`
- successful Railway API build/deployment after the closure guards were committed

## Enforced and awaiting verification

### กำหนด lock order มาตรฐานเพื่อลด deadlock

- [x] Added `docs/architecture/transaction-lock-order.md`.
- [x] Defined aggregate/actor/wallet/ledger/audit lock ordering.
- [x] Added `tools/audit-r009-lock-order.mjs`.
- [x] Strict mode fails on known inversions and unclassified row-locked tables.
- [x] Enabled the strict lock-order command in the required quality workflow.
- [x] Added `docs/evidence/r009-lock-order-boundary.md`.
- [x] Added boundary closure structure audit.
- [ ] Confirm zero inversions and zero unclassified locked tables through an observable verification channel.

### ทำ Prisma repository adapters

- [x] Added transaction-scoped deposit and withdrawal adapters at `apps/api/src/common/infrastructure/prisma-finance-repository-adapters.ts`.
- [x] Added `PrismaAdminOwnershipRepositoryAdapter` using the existing `AdminUser`, `AdminUserRole`, and `Role` schema models.
- [x] All implemented adapters receive `Prisma.TransactionClient` from the transaction owner.
- [x] Implemented adapters do not instantiate `PrismaClient` or call `$transaction`.
- [x] Added compatibility and adapter coverage audits.
- [ ] Resolve the real schema mappings for KYC/watchlist and promotion settlement.
- [ ] Add KYC/watchlist and promotion settlement adapters.
- [ ] Migrate critical services to use the adapters.

Current adapter coverage: **3 of 5 critical domains** (deposit, withdrawal, ownership).

### Audit unique/foreign-key/cascade/idempotency constraints

- [x] Added broad schema inventory at `tools/audit-r009-schema-constraints.mjs`.
- [x] Added semantic closure gate `tools/audit-r009-critical-constraint-closure.mjs`.
- [x] The closure gate verifies 14 critical uniqueness and index contracts across wallet, ledger, deposit, withdrawal, ownership, provider transfer, and webhook persistence.
- [x] No schema or migration change was required in this slice.
- [ ] Confirm the semantic closure gate through an observable verification channel.

## Active partial work

### Deposit transaction ownership

- [x] Migrated top-up claim and release paths to shared row-lock helpers.
- [x] Moved release state mutation and admin audit into one transaction owner.
- [x] Added top-up transaction boundary audit and workflow.
- [ ] Locate and consolidate the actual approval/credit path. The current `TopUpsController` exposes only create, read, claim, and release routes.

### Ownership transfer transaction ownership

- [x] Located the production flow in `AdminAccessService.transferOwnership`.
- [x] Confirmed role removal, role assignment, and audit writing share one transaction client.
- [x] Added `tools/audit-r009-ownership-transfer-transaction.mjs`.
- [x] Added `docs/evidence/r009-ownership-transfer-gap.md`.
- [ ] Lock and revalidate actor and target rows inside the transaction in deterministic order.
- [ ] Add rollback and concurrent-transfer regression coverage.

### Intent-revealing row-lock helpers

- [x] Added `apps/api/src/common/infrastructure/prisma-row-locks.ts`.
- [x] Added helpers for deposit, withdrawal, wallet, admin-user, and active-owner locks.
- [x] Migrated finance and ownership adapters away from inline raw lock SQL.
- [x] Migrated top-up claim/release legacy service paths.
- [x] Added `tools/audit-r009-row-lock-helpers.mjs`.
- [ ] Migrate remaining raw row locks in withdrawal and other legacy services.

### Query-outside-transaction boundary

- [x] Added `tools/audit-r009-transaction-context.mjs` for Prisma infrastructure.
- [x] The guard rejects nested `$transaction`, `new PrismaClient`, and unscoped `this.prisma` usage in repository infrastructure.
- [x] Added the guard to `.github/workflows/r009-parallel-boundary-closure.yml`.
- [x] Resolved top-up release read/write/audit transaction separation.
- [ ] Complete method-level review of legacy services from `tools/audit-r009-transaction-escapes.mjs`.
- [ ] Resolve remaining confirmed legacy service escapes.

## Pending evidence

- [ ] Confirm Prisma adapter workflows through an observable verification channel.
- [ ] Confirm lock-order strict audit through an observable verification channel.
- [ ] Confirm constraint/idempotency semantic audit through an observable verification channel.
- [ ] Review remaining mixed direct/transactional write services at method level.

## Remaining R-009 work

- [ ] Complete KYC/watchlist and promotion Prisma adapters and migrate services.
- [ ] Consolidate transaction ownership for deposit approval/credit.
- [ ] Consolidate transaction ownership for ownership transfer.
- [ ] Consolidate transaction ownership for KYC review/watchlist override.
- [ ] Consolidate transaction ownership for promotion settlement.
- [ ] Close lock-order evidence.
- [ ] Complete row-lock helper migration across legacy services.
- [ ] Resolve confirmed legacy transaction escapes.
- [ ] Add remaining deadlock and concurrency regression coverage.
- [ ] Close constraint/idempotency audit.

## Count

- Total R-009 subtasks: 15
- Closed with durable evidence: 5
- Remaining not closed: 10
- Enforced and awaiting verification: 3
- Other partial or under active review: 5
- Not yet implemented: 2

## Verification policy

Push-triggered GitHub Actions runs are not readable through the current connector. A subtask may be closed when all of the following are available: durable source-level guards with strict failure conditions, direct source inspection, and a successful Railway API build/deployment after the guarded code was committed. Runtime behavior changes still require transaction-specific or regression evidence and are not closed by deployment alone.

## Safety decision

Repository ports and Prisma type isolation are closed as contract-level tasks only. Runtime service migration remains separate. Ownership transfer still has a documented concurrency gap and is not closed. No Prisma schema, production data, finance calculation, permission, secret, provider, or deployment-target change was made.

## Latest commits

- `79be0945524c6ff8e4ec98d4de11e592341bd219` — audit ownership transfer transaction boundary.
- `8c7e3ee94cc474549077810a38bb11007c35a707` — record ownership transfer concurrency gap.
- `c5b82508470d2ee377a7c1841192ce77f8760e81` — close repository contract boundaries.
