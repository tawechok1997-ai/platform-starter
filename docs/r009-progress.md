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
- [ ] Populate the review ledger from the current method-level inventory.
- [ ] Resolve all confirmed legacy service escapes.
- [ ] Enable strict mode in the required quality workflow after review reaches zero unreviewed findings.

## Pending evidence

- [ ] Confirm Prisma adapter workflows through an observable verification channel.
- [ ] Run the method-level transaction inventory and classify every same-method finding.

## Remaining R-009 work

- [ ] Complete KYC/watchlist and promotion Prisma adapters and migrate services.
- [ ] Consolidate transaction ownership for deposit approval/credit.
- [ ] Consolidate transaction ownership for ownership transfer.
- [ ] Consolidate transaction ownership for KYC review/watchlist override.
- [ ] Consolidate transaction ownership for promotion settlement.
- [ ] Resolve confirmed legacy transaction escapes.
- [ ] Add remaining deadlock and concurrency regression coverage.

## Count

- Total R-009 subtasks: 15
- Closed with durable evidence: 8
- Remaining not closed: 7
- Enforced and awaiting verification: 1
- Other partial or under active review: 4
- Not yet implemented: 2

## Verification policy

Push-triggered GitHub Actions runs are not readable through the current connector. A subtask may be closed when all of the following are available: durable source-level guards with strict failure conditions, direct source inspection, and a successful Railway API build/deployment after the guarded code was committed. Runtime behavior changes still require transaction-specific or regression evidence and are not closed by deployment alone.

## Safety decision

The transaction escape inventory now has stable finding identities, a reviewed baseline ledger, stale-review detection, and a strict mode. Strict enforcement is intentionally not enabled until the current findings are semantically classified, preventing legacy debt from being silently accepted or CI from failing on unreviewed false positives. No Prisma schema, production data, finance formula, permission, secret, provider, or deployment-target change was made.

## Latest commits

- `69ad45073542267190e07ff3222f0bcab8cdae4c` — add reviewed baseline and strict mode to the transaction escape audit.
- `a3a597349f7ad740350cc71fbe6b5be601b44415` — add transaction escape review ledger.
- `8278df2d43fc74f642e941ee9fa0e0e4ccbf5334` — validate transaction escape review records.
- `c8c0058f56de9d6966efe8093cab518a45317639` — close finance row-lock helper migration.
- `b2f3b4541b9b2c0d3db464b6ccbfaa24abb5480f` — migrate withdrawal legacy flows to typed row-lock helpers.
