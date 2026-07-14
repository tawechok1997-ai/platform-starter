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

### Ownership transfer transaction ownership

- [x] Production route uses `AdminOwnershipCommandService.transferOwnership`.
- [x] Step-up authentication runs before the transaction begins.
- [x] Actor and target admin rows are locked in deterministic UUID order through `lockAdminUserForUpdate`.
- [x] Actor authority, target active status, target 2FA, and protected-role state are revalidated through the transaction client.
- [x] Owner role removal, assignment, and `TRANSFER_ADMIN_OWNERSHIP` audit persistence share one transaction owner.
- [x] Updated `tools/audit-r009-ownership-transfer-transaction.mjs` with strict production-route and transaction checks.
- [x] Added `docs/evidence/r009-ownership-transfer-closure.md`.
- [ ] Confirm successful Railway API deployment for runtime commit `f45090480be1f5b0aece9277fcf5ed8416899e18`.
- [ ] Add explicit concurrent-transfer regression coverage.

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
- [ ] Confirm Railway API deployment for ownership transfer transaction ownership.
- [ ] Run the method-level transaction inventory and classify every remaining same-method finding.

## Remaining R-009 work

- [ ] Complete KYC/watchlist and promotion Prisma adapters and migrate services.
- [ ] Consolidate transaction ownership for deposit approval/credit.
- [ ] Close ownership transfer after deployment and concurrency verification.
- [ ] Consolidate transaction ownership for KYC review/watchlist override.
- [ ] Consolidate transaction ownership for promotion settlement.
- [ ] Resolve confirmed legacy transaction escapes.
- [ ] Add remaining deadlock and concurrency regression coverage.

## Count

- Total R-009 subtasks: 15
- Closed with durable evidence: 8
- Remaining not closed: 7
- Enforced and awaiting verification: 2
- Other partial or under active review: 3
- Not yet implemented: 2

## Verification policy

Push-triggered GitHub Actions runs are not readable through the current connector. A subtask may be closed when all of the following are available: durable source-level guards with strict failure conditions, direct source inspection, and a successful Railway API build/deployment after the guarded code was committed. Runtime behavior changes still require transaction-specific or regression evidence and are not closed by deployment alone.

## Safety decision

Invitation create and reissue transaction ownership are verified through successful Railway API deployment. Ownership transfer now has a focused production transaction owner with deterministic row locks and in-transaction revalidation; deployment and explicit concurrency evidence remain before closure. No Prisma schema, production data, finance formula, permission model, secret, provider, or deployment-target change was made.

## Latest commits

- `f45090480be1f5b0aece9277fcf5ed8416899e18` — make ownership transfer atomic with deterministic locks and in-transaction revalidation.
- `b719d7aecacaebec9c8adb93bfbaf9df892d7404` — guard the production ownership transaction contract.
- `20d227d713aa17d7f60d8239665f7452dec79dc3` — record ownership transfer closure evidence.
- `629047983b08ca64035c35f50d5ca7f4cf539beb` — make invitation create and reissue commands atomic.
- `f64be20c007a4910f69d603b9d075b9e475048c7` — route invitation creation through the atomic command service.
