# R-009 Repository Contract Closure

## Closed subtasks

- Define repository ports for critical domains.
- Prevent Prisma types from leaking through repository interfaces.

## Durable source evidence

- `apps/api/src/common/application/critical-repository-ports.ts` defines persistence-agnostic ports for deposit, withdrawal, admin ownership, KYC/watchlist, and promotion settlement.
- The ports expose intent-revealing locked-read methods without importing `@prisma/client`, `PrismaService`, or `Prisma.*` types.
- `tools/audit-r009-critical-repository-ports.mjs` verifies the required interfaces and locked-read operations remain present.
- `tools/audit-r009-repository-boundaries.mjs` scans application/domain repository contracts and fails strict mode on Prisma imports, `PrismaService`, or `Prisma.*` type leakage.
- `tools/audit-r009-boundary-closure.mjs` prevents the closure guards and evidence files from silently disappearing.
- Dedicated GitHub workflows wire the contract audit, strict boundary audit, and API typecheck.

## Verification decision

The GitHub connector available to this work cannot read push-triggered workflow results. Closure therefore uses the strongest observable evidence available in this environment:

1. durable source audits and strict failure conditions committed to `main`;
2. direct source inspection of the repository contracts;
3. successful Railway API build/deployment after the contracts and guards were committed.

This closes contract definition and type isolation only. It does not claim that all runtime services have migrated to repository adapters; that remains a separate R-009 subtask.

## Safety

No Prisma schema, migration, production data, transaction behavior, permissions, secrets, or deployment target changed in this closure.
