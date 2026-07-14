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

### KYC review and risk-watchlist transaction ownership

- [x] `KycReviewCommandService.reviewDocument` locks the document, validates version, mutates, and audits through one Serializable transaction owner.
- [x] `KycReviewCommandService.reviewCase` locks the case, validates transition and documents, mutates, and audits through one Serializable transaction owner.
- [x] `kyc-concurrency.db.spec.ts` verifies that only one reviewer can transition a case version and stale retries fail.
- [x] `RiskWatchlistService.release` locks and revalidates the entry, performs the guarded update, and audits through one Serializable transaction owner.
- [x] `risk-watchlist-concurrency.db.spec.ts` verifies one active duplicate and one successful release per version.
- [x] Moved risk-watchlist creation and `CREATE_RISK_WATCHLIST_ENTRY` audit persistence into one Serializable transaction owner.
- [x] Preserved the existing PostgreSQL unique-violation to `ConflictException` contract.
- [x] Added `tools/audit-r009-kyc-watchlist-transactions.mjs` and required workflow enforcement.
- [x] Added `docs/evidence/r009-kyc-watchlist-transaction-closure.md`.
- [ ] Confirm successful Railway API deployment for watchlist runtime commit `e1dd8cf54ce3cb2a0ce62a9369556549d7ebdc6d`.

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
- [x] Moved invitation account creation, verification-token persistence, and `CREATE_ADMIN_INVITATION` audit persistence into one transaction owner.
- [x] Moved invitation reissue token replacement and `REISSUE_ADMIN_INVITATION` audit persistence into one transaction owner.
- [x] Updated `tools/audit-r009-admin-invitation-transaction.mjs` to guard controller routing and both atomic invitation commands.
- [x] Reclassified the legacy finding as `safe-direct-write` because the production route no longer calls the legacy method.
- [x] Railway API deployment succeeded for invitation runtime commit `f64be20c007a4910f69d603b9d075b9e475048c7`.
- [ ] Populate the review ledger from the remaining current method-level inventory.
- [ ] Resolve all remaining confirmed legacy service escapes.
- [ ] Enable strict mode in the required quality workflow after review reaches zero unreviewed findings.

## Pending evidence

- [ ] Confirm Prisma adapter workflows through an observable verification channel.
- [ ] Confirm Railway API deployment for risk-watchlist creation transaction ownership.
- [ ] Run the method-level transaction inventory and classify every remaining same-method finding.

## Remaining R-009 work

- [ ] Complete KYC/watchlist and promotion Prisma adapters and migrate services.
- [ ] Consolidate transaction ownership for deposit approval/credit.
- [ ] Close KYC review/watchlist override after deployment verification.
- [ ] Consolidate transaction ownership for promotion settlement.
- [ ] Resolve confirmed legacy transaction escapes.
- [ ] Add remaining deadlock and concurrency regression coverage.

## Count

- Total R-009 subtasks: 15
- Closed with durable evidence: 9
- Remaining not closed: 6
- Enforced and awaiting verification: 2
- Other partial or under active review: 2
- Not yet implemented: 2

## Verification policy

Push-triggered GitHub Actions runs are not readable through the current connector. A subtask may be closed when all of the following are available: durable source-level guards with strict failure conditions, direct source inspection, and a successful Railway API build/deployment after the guarded code was committed. Runtime behavior changes still require transaction-specific or regression evidence and are not closed by deployment alone.

## Safety decision

KYC document and case reviews already use Serializable transaction owners with row locks, optimistic version checks, atomic audits, and isolated-database concurrency coverage. Risk-watchlist release already had equivalent transaction and concurrency protection. Risk-watchlist creation now persists the entry and audit atomically while preserving duplicate-conflict behavior. Railway API verification remains before closure. No Prisma schema, production data, permission model, secret, provider, or deployment-target change was made.

## Latest commits

- `e1dd8cf54ce3cb2a0ce62a9369556549d7ebdc6d` — make risk-watchlist creation and audit persistence atomic.
- `7fe2f1f9932e666c883e2de9d6e02ee2070cdacd` — guard KYC and watchlist transaction ownership.
- `1c2b850da6fea5600a548425a6fb53683ea47fb8` — enforce KYC/watchlist transaction contracts in the required workflow.
- `3573197b9b800af4af7c218227466bb0bc3ee319` — record KYC/watchlist transaction closure evidence.
- `89685bf94a6f716515a4baa5bdbe1236bd2e2536` — run ownership transaction guard and concurrency regression in the required workflow.