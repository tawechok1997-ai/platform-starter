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
- [x] กำหนด lock order มาตรฐานเพื่อลด deadlock
- [x] Audit unique/foreign-key/cascade/index/idempotency constraints
- [x] Complete intent-revealing row-lock helper migration across finance legacy services
- [x] Consolidate transaction ownership for ownership transfer
- [x] Consolidate transaction ownership for KYC review/watchlist override
- [x] Consolidate transaction ownership for promotion settlement

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
- `docs/architecture/transaction-lock-order.md`
- `tools/audit-r009-lock-order.mjs`
- `docs/evidence/r009-lock-order-boundary.md`
- `tools/audit-r009-schema-constraints.mjs`
- `tools/audit-r009-critical-constraint-closure.mjs`
- `docs/evidence/r009-lock-and-constraint-closure.md`
- `apps/api/src/common/infrastructure/prisma-row-locks.ts`
- `tools/audit-r009-withdrawal-lock-snapshots.mjs`
- `tools/audit-r009-withdrawal-row-lock-migration.mjs`
- `docs/evidence/r009-withdrawal-lock-snapshot-foundation.md`
- `docs/evidence/r009-withdrawal-row-lock-migration.md`
- successful Railway API build/deployment for runtime commit `b2f3b4541b9b2c0d3db464b6ccbfaa24abb5480f`
- `apps/api/src/modules/admin-access/admin-ownership-command.service.ts`
- `apps/api/src/modules/admin-access/admin-ownership-command.service.spec.ts`
- `tools/audit-r009-ownership-transfer-transaction.mjs`
- `docs/evidence/r009-ownership-transfer-closure.md`
- ownership guard and concurrency regression in `.github/workflows/r009-parallel-boundary-closure.yml`
- successful Railway API build/deployment for runtime commit `f45090480be1f5b0aece9277fcf5ed8416899e18`
- `apps/api/src/modules/risk-alerts/kyc-review-command.service.ts`
- `apps/api/src/modules/risk-alerts/kyc-concurrency.db.spec.ts`
- `apps/api/src/modules/risk-alerts/risk-watchlist.service.ts`
- `apps/api/src/modules/risk-alerts/risk-watchlist-concurrency.db.spec.ts`
- `tools/audit-r009-kyc-watchlist-transactions.mjs`
- `docs/evidence/r009-kyc-watchlist-transaction-closure.md`
- successful Railway API build/deployment for watchlist runtime commit `e1dd8cf54ce3cb2a0ce62a9369556549d7ebdc6d`
- `apps/api/src/modules/promotions/settlement-command.service.ts`
- `apps/api/src/modules/promotions/settlement-command.service.spec.ts`
- `tools/audit-r009-promotion-settlement-transaction.mjs`
- `docs/evidence/r009-promotion-settlement-transaction-closure.md`
- promotion settlement guard and regression in `.github/workflows/r009-parallel-boundary-closure.yml`
- successful Railway API build/deployment with runtime source from commit `de3a065b3c69c014a2baf6594cbcdc4893da1a9c`, verified on commit `c3e9f3971a283b554eae7c94499dba9c1f3f9754`

## Enforced and awaiting verification

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

## Active partial work

### Deposit transaction ownership

- [x] Migrated top-up claim and release paths to shared row-lock helpers.
- [x] Moved release state mutation and admin audit into one transaction owner.
- [x] Added top-up transaction boundary audit and workflow.
- [ ] Locate and consolidate the actual approval/credit path. The current `TopUpsController` exposes only create, read, claim, and release routes.

### Query-outside-transaction boundary

- [x] Added `tools/audit-r009-transaction-context.mjs` for Prisma infrastructure.
- [x] The guard rejects nested `$transaction`, `new PrismaClient`, and unscoped `this.prisma` usage in repository infrastructure.
- [x] Added the guard to `.github/workflows/r009-parallel-boundary-closure.yml`.
- [x] Resolved top-up release read/write/audit transaction separation.
- [x] Resolved withdrawal release read/write/audit transaction separation.
- [x] Upgraded `tools/audit-r009-transaction-escapes.mjs` to method-level findings with stable review keys.
- [x] Added `docs/evidence/r009-transaction-escape-review.json` as the reviewed baseline ledger.
- [x] Added `tools/audit-r009-transaction-review-ledger.mjs` to reject invalid statuses and undocumented safe findings.
- [x] Added strict mode that fails on confirmed, unreviewed, or stale findings.
- [x] Routed production invitation creation through `AdminInvitationAdminService.create`.
- [x] Moved invitation create and reissue persistence plus audit into atomic transaction owners.
- [x] Railway API deployment succeeded for invitation runtime commit `f64be20c007a4910f69d603b9d075b9e475048c7`.
- [ ] Populate the review ledger from the remaining current method-level inventory.
- [ ] Resolve all remaining confirmed legacy service escapes.
- [ ] Enable strict mode in the required quality workflow after review reaches zero unreviewed findings.

## Pending evidence

- [ ] Confirm Prisma adapter workflows through an observable verification channel.
- [ ] Run the method-level transaction inventory and classify every remaining same-method finding.

## Remaining R-009 work

- [ ] Complete KYC/watchlist and promotion Prisma adapters and migrate services.
- [ ] Consolidate transaction ownership for deposit approval/credit.
- [ ] Resolve confirmed legacy transaction escapes.
- [ ] Add remaining deadlock and concurrency regression coverage.

## Count

- Total R-009 subtasks: 15
- Closed with durable evidence: 11
- Remaining not closed: 4
- Enforced and awaiting verification: 1
- Other partial or under active review: 2
- Not yet implemented: 1

## Verification policy

Push-triggered GitHub Actions runs are not readable through the current connector. A subtask may be closed when all of the following are available: durable source-level guards with strict failure conditions, direct source inspection, and a successful Railway API build/deployment after the guarded code was committed. Runtime behavior changes still require transaction-specific or regression evidence and are not closed by deployment alone.

## Safety decision

KYC review and watchlist override now have row locks, optimistic version checks, atomic audits, PostgreSQL concurrency evidence, and successful Railway API deployment. Promotion settlement now owns lifecycle transition, wallet and ledger mutation, bonus state, risk metadata, and admin audit under one Serializable transaction, with stable idempotency keys and rollback failure handling. No Prisma schema, production data, permission model, secret, provider, or deployment-target change was made.

## Latest commits

- `de3a065b3c69c014a2baf6594cbcdc4893da1a9c` — consolidate promotion settlement transaction ownership.
- `3699cffce9c77363bddac1c08f911e2584e694e4` — replace stale settlement tests with atomic, idempotency, and rollback coverage.
- `2e6cdfcc9993a81fed6e74bda5f1b76c9d55d333` — guard promotion settlement transaction ownership.
- `204316f98c70c2af844f9125b1c122a8853497fe` — enforce promotion settlement guard and command regression.
- `c3e9f3971a283b554eae7c94499dba9c1f3f9754` — record promotion settlement closure evidence and successful Railway deployment.
