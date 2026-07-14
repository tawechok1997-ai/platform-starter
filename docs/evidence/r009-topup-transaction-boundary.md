# R-009 Top-up Transaction Boundary Evidence

## Scope

This slice migrates the top-up claim and release paths to the shared transaction-scoped row-lock helper.

## Evidence

- `TopUpsService.claimRequest` calls `lockTopUpRequestForUpdate(tx, id)`.
- `TopUpsService.releaseRequest` calls `lockTopUpRequestForUpdate(tx, id)`.
- Both methods load and mutate the request through the same `Prisma.TransactionClient`.
- Both admin-audit writes execute inside the same transaction as the claim/release mutation.
- The service no longer contains an inline `FOR UPDATE` query for `top_up_requests`.
- `tools/audit-r009-topup-transaction-boundary.mjs` enforces these properties.
- `.github/workflows/r009-topup-transaction-boundary.yml` runs the audit, repository type-boundary guard, and API typecheck.

## Safety

This is a boundary refactor. It does not change deposit amount validation, claim policy, claim timeout, request status rules, schema, or production data.

## Closure rule

This evidence closes only the migrated claim/release boundary. The broader R-009 deposit-approval transaction-owner subtask remains open until the credit/approval path is located, migrated, and covered by rollback/concurrency evidence.
