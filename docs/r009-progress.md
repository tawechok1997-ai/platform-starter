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
- [x] Complete critical Prisma repository adapters and production migration
- [x] Close deposit approval/credit transaction ownership as N/A for the current production surface
- [x] Resolve and strictly enforce the legacy transaction escape inventory

## Closure evidence

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
- `apps/api/src/common/infrastructure/prisma-finance-repository-adapters.ts`
- `apps/api/src/common/infrastructure/prisma-risk-promotion-repository-adapters.ts`
- KYC review, watchlist release, and promotion settlement production paths use transaction-scoped adapters.
- `tools/audit-r009-risk-promotion-adapters.mjs` enforces adapter ownership, release metadata preservation, and rejects direct promotion bonus-ledger row locks in migrated helpers.
- successful Railway API build/deployment for promotion adapter wiring and guard commit `fcf379c4f371d639eb942bbf778367902c561a2d`
- `docs/evidence/r009-topup-approval-credit-scope.md`
- `tools/audit-r009-topup-transaction-boundary.mjs` fails closed if a top-up approval/credit/completion path appears without an explicit transaction contract.
- current `TopUpsController` exposes only create/read/claim/release and current `TopUpsService` performs no wallet or wallet-ledger mutation.
- `docs/evidence/r009-legacy-transaction-escape-closure.md`
- `docs/evidence/r009-transaction-escape-review.json`
- `tools/audit-r009-transaction-review-ledger.mjs`
- strict method-level inventory enforcement in `.github/workflows/r009-parallel-boundary-closure.yml` with `R009_TRANSACTION_STRICT=1`
- successful Railway API, admin, and member deployments for strict-enforcement commit `e4b244bc21a8941c14f8fbabc059a35e975b82ae`

## Remaining R-009 work

- [ ] Add remaining deadlock and concurrency regression coverage.

## Count

- Total R-009 subtasks: 15
- Closed with durable evidence: 14
- Remaining not closed: 1
- Enforced and awaiting verification: 0
- Other partial or under active review: 1
- Not yet implemented: 0

## Verification policy

Push-triggered GitHub Actions runs are not readable through the current connector. A subtask may be closed when all of the following are available: durable source-level guards with strict failure conditions, direct source inspection, and a successful Railway API build/deployment after the guarded code was committed. Runtime behavior changes still require transaction-specific or regression evidence and are not closed by deployment alone.

## Safety decision

The current method-level inventory contains one reviewed legacy invitation finding. It is safe because the production controller routes invitation create/reissue commands through atomic transaction owners, and dedicated guards reject routing regressions. The required R-009 workflow now runs strict inventory mode and fails on confirmed, unreviewed, or stale findings. No schema, production data, permission model, secret, provider, wallet behavior, or deployment target was changed.

## Latest commits

- `50b6fdad3ed1388072c2210d59151a4c10890b7d` — record strict legacy transaction escape closure evidence.
- `e4b244bc21a8941c14f8fbabc059a35e975b82ae` — enable strict method-level transaction escape inventory in the required workflow.
- `41c69935671ac43af89bd778021a5924e44e6459` — document the absent top-up approval/credit production path and future atomic contract.
- `edb5dc44aa4fae18f819a280d5e244c909402e22` — fail closed if an unguarded top-up approval/credit path is introduced.
- `fcf379c4f371d639eb942bbf778367902c561a2d` — enforce promotion adapter production wiring and reject direct bonus-ledger locks in migrated helpers.
