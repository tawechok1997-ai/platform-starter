# R-009 Critical Repository Ports Evidence

Status: ENFORCED, AWAITING WORKFLOW VERIFICATION

## Scope

The repository now defines persistence-agnostic ports for the critical write domains covered by R-009:

- deposit approval
- withdrawal completion
- admin ownership transfer
- KYC review and watchlist override
- promotion settlement

## Evidence

- `apps/api/src/common/application/critical-repository-ports.ts`
- `tools/audit-r009-critical-repository-ports.mjs`
- `.github/workflows/r009-critical-repository-ports.yml`

The ports expose intent-revealing locked reads and save operations without importing Prisma, `PrismaService`, `Prisma.*`, or `TransactionClient`.

## Closure rule

This subtask may be marked DONE only after the dedicated workflow passes its repository-port audit, repository-type strict guard, and API typecheck on a commit containing these files.
