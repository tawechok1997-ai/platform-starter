# R-009 Progress

Status: 🟡 PARTIAL

Started: 2026-07-15

## Scope

R-009 establishes repository, transaction, and persistence boundaries without changing existing business behavior, transaction semantics, idempotency, locks, claims, retries, or error contracts.

## Completed in this slice

- [x] Added `tools/audit-r009-controller-prisma.mjs`.
- [x] Added human-readable, JSON, and strict audit commands.
- [x] Wired the non-strict controller persistence inventory into `.github/workflows/r006-quality.yml`.
- [x] Configured CI to upload `r009-controller-prisma-inventory-<run-id>` for review.
- [x] Kept strict enforcement disabled until the current baseline is reviewed and direct persistence users are migrated safely.

## Pending evidence

- [ ] Confirm the workflow run completes successfully.
- [ ] Download and review the JSON inventory artifact.
- [ ] Record every controller with direct Prisma imports, `PrismaService`, `$transaction`, or raw query usage.
- [ ] Confirm false positives before changing application code.

## Remaining R-009 work

- [ ] Move confirmed Prisma access out of controllers.
- [ ] Define repository ports for critical domains.
- [ ] Add Prisma repository adapters without leaking Prisma types.
- [ ] Consolidate transaction ownership for deposit, withdrawal, ownership, KYC/watchlist, and promotion settlement.
- [ ] Define lock ordering and intent-revealing row-lock helpers.
- [ ] Audit queries that escape transaction boundaries.
- [ ] Add rollback, deadlock, and concurrency regression coverage.
- [ ] Audit unique, foreign-key, cascade, and idempotency constraints.
- [ ] Enable `audit:r9-controller-prisma:strict` only after the reviewed baseline reaches zero.

## Safety decision

This first slice is read-only with respect to runtime persistence. It does not modify Prisma schema, production data, transaction boundaries, finance behavior, permissions, secrets, provider gates, or deployment targets.

## Commits

- `141a476ee44ed95056c0dd75b259f8797736d45a` — add controller Prisma inventory audit.
- `c514f96558eccec2100f4c0efdd47172afee5cd8` — expose audit commands.
- `813e06e2a974465505f4aa6063755851a82a36e7` — publish inventory artifact in CI.
