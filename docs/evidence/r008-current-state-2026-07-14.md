# R-008 Current-State Evidence

Captured: 2026-07-14
Status: PARTIAL

## Verified on `main`

- Domain policies and shared domain primitives are present.
- Deposit, KYC, watchlist, support, and notification policy integrations are present from prior R-008 commits.
- `AdminAccessService.transferOwnership` still rejects self-transfer, requires an active target with 2FA, and writes the role transfer plus audit entry in one Prisma transaction.
- Railway deployment status was successful for API, Web Admin, and Web Member when checked after the latest R-008 pipeline changes.
- The closure audit requires withdrawal amount, claim eligibility, lifecycle transitions, wallet active-state validation, reservation, debit completion, and reservation release markers.
- The integration patcher now matches the domain contracts for `Money`, owner-role evaluation, and invalid-transition HTTP mapping.

## Not yet verified on `main`

- `AdminAccessService` does not yet call `AdminOwnershipPolicy.assertCanTransfer`.
- `WithdrawalsService` policy integration has not yet been evidenced by an implementation commit.
- Repeated integration trigger commits did not produce a discoverable workflow run or implementation commit.
- Full API regression, API typecheck, API build, and closure audit have not yet been recorded against the final implementation commit.
- R-008 must remain `PARTIAL` until those checks and the master-worklist update are complete.

## Latest repository evidence

- Latest checked repository head before this evidence refresh: `1c5818a85b575eb2108cc7ecd9b32bc24b4bdb6a`.
- Latest corrected R-008 gate trigger: `7f0812d156d9763be1e86fe3d25f258e40759161`.
- No later commit named `refactor(r008): enforce admin and withdrawal domain policies` was present in the checked history.

## Evidence commits

- `5c02d6a93da27f869ad985204946b508c55c13ac` strengthens the R-008 closure audit.
- `fe66445ab2cab5d616ad7562ce22cc63a2f2b9a8` records verified checklist progress.
- `2483fd1ab642320085180d3b527b19f281d7d8ca` aligns the patcher with the domain policy contracts.
- `f8c7c5355d5fc11fb75204f67f1810cccbaf880b` records the blocked direct-integration state in the granular checklist.
