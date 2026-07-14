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
- [x] Resolved real schema mappings for KYC documents, KYC cases, risk-watchlist entries, and bonus-ledger settlements.
- [x] Added `PrismaKycWatchlistRepositoryAdapter` and `PrismaPromotionSettlementRepositoryAdapter`.
- [x] All adapters receive `Prisma.TransactionClient` from the transaction owner.
- [x] Adapters do not instantiate `PrismaClient` or call `$transaction`.
- [x] Migrated KYC document review, KYC case review, and watchlist release production paths to transaction-scoped adapters.
- [x] Preserved KYC/watchlist response snapshots and optimistic-version behavior.
- [x] Added `tools/audit-r009-risk-promotion-adapters.mjs` and required-workflow enforcement.
- [x] Successful Railway API build/deployment after KYC/watchlist adapter migration on commit `43680f8b0184726d7027f5f8fc51bfec1c5e5145`.
- [ ] Migrate promotion settlement bonus-ledger lock/read/final persistence through `PrismaPromotionSettlementRepositoryAdapter`.
- [ ] Tighten the adapter audit to reject direct promotion bonus-ledger locking after migration.

Implemented adapter coverage: **5 of 5 critical domains**.
Production service migration coverage: **4 of 5 critical domains** (deposit, withdrawal, ownership, KYC/watchlist).

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

- [ ] Complete promotion settlement production wiring through its transaction-scoped adapter.
- [ ] Run the method-level transaction inventory and classify every remaining same-method finding.

## Remaining R-009 work

- [ ] Complete promotion settlement adapter migration.
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

KYC review and watchlist override now use transaction-scoped repository adapters while preserving row locks, optimistic version checks, response fields, atomic audits, and PostgreSQL concurrency behavior. Promotion settlement has a schema-correct adapter, but its production command still owns bonus-ledger SQL directly and remains the final adapter-wiring gap. No Prisma schema, production data, permission model, secret, provider, or deployment-target change was made.

## Latest commits

- `43680f8b0184726d7027f5f8fc51bfec1c5e5145` — enforce risk/promotion adapter guard in the required workflow and verify Railway deployment.
- `ab4d442225b76b1e1918b61e2f5b6510eaf2d73a` — add risk/promotion adapter boundary audit.
- `450694e0715f28488a178bb8bef82ac6900116aa` — migrate watchlist release through the transaction-scoped adapter.
- `eb3080e54da9b56add4e5f00c007903bf382e993` — preserve full KYC response snapshots after adapter migration.
- `66efe8b573e8518b20950946b545f23b06072cf4` — add KYC/watchlist and promotion settlement Prisma adapters.
