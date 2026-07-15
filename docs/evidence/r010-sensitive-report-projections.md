# R-010 Sensitive Report Projection Evidence

- Added owner-local projection contracts in `report-read.projections.ts`.
- Queue aging now selects only transaction identity, amount, currency, creation time, username, and email fallback.
- Queue aging no longer selects phone or nested user id.
- Reconciliation now selects only wallet identity, balances, and username.
- Reconciliation no longer selects email or phone.
- Latest-ledger lookup now selects only `balanceAfter` and `createdAt`.
- Added `tools/audit-r010-sensitive-report-projections.mjs` and wired it into the R-010 CI workflow.
- Public response keys and report routes remain unchanged.
