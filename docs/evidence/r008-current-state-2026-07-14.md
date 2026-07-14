# R-008 Current-State Evidence

Captured: 2026-07-14
Status: PARTIAL

## Verified on `main`

- Domain policies and shared domain primitives are present.
- Deposit, KYC, watchlist, support, and notification policy integrations are present from prior R-008 commits.
- `AdminAccessService.transferOwnership` still rejects self-transfer, requires an active target with 2FA, and writes the role transfer plus audit entry in one Prisma transaction.
- Railway deployment status was successful for API, Web Admin, and Web Member when checked after the latest R-008 pipeline changes.
- The closure audit now requires withdrawal claim eligibility, wallet active-state validation, reservation, debit completion, and reservation release markers.

## Not yet verified on `main`

- `AdminAccessService` does not yet call `AdminOwnershipPolicy.assertCanTransfer`.
- `WithdrawalsService` policy integration has not yet been evidenced by an implementation commit.
- Full API regression, API typecheck, API build, and closure audit have not yet been recorded against the final implementation commit.
- R-008 must remain `PARTIAL` until those checks and the master-worklist update are complete.

## Evidence commits

- `5c02d6a93da27f869ad985204946b508c55c13ac` strengthens the R-008 closure audit.
- `fe66445ab2cab5d616ad7562ce22cc63a2f2b9a8` records verified checklist progress.
