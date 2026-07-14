# R-008 Closure Checklist

Status: PARTIAL

## 1. Admin ownership integration

- [ ] Implementation commit is present on `main`
- [ ] `AdminOwnershipPolicy.assertCanTransfer` is called by `AdminAccessService`
- [x] Self-transfer is rejected by the policy
- [x] Non-owner transfer is rejected
- [x] Inactive target is rejected
- [x] Target 2FA requirement remains enforced
- [ ] Domain errors preserve the HTTP contract
- [x] Ownership audit and role transfer remain in one transaction
- [ ] Service regression tests cover accepted and rejected transfers

Remaining: 4 subtasks

Current evidence: policy regression coverage now verifies self-transfer, non-owner, inactive-target, and accepted-transfer cases. `AdminAccessService.transferOwnership` still performs validation inline, so service integration remains open.

## 2. Withdrawal lifecycle integration

- [ ] Implementation commit is present on `main`
- [ ] Amount validation uses `WithdrawalPolicy`
- [ ] Claim eligibility uses `WithdrawalPolicy`
- [ ] Approve transition uses `WithdrawalPolicy`
- [ ] Complete transition uses `WithdrawalPolicy`
- [ ] Reject transition uses `WithdrawalPolicy`
- [ ] Domain errors preserve the HTTP contract
- [x] Policy regression tests cover invalid transitions
- [ ] Idempotency behavior remains unchanged

Remaining: 8 subtasks

Current evidence: domain regression coverage verifies invalid terminal and payment-proof transitions, amount validation, and claim eligibility. No verified service implementation commit has been produced on `main`.

## 3. Wallet settlement integration

- [ ] Reservation uses `WalletSettlementPolicy.reserve`
- [ ] Completion uses `WalletSettlementPolicy.completeDebit`
- [ ] Rejection uses `WalletSettlementPolicy.releaseReservation`
- [ ] Wallet active-state validation is centralized
- [ ] Ledger and wallet updates remain atomic
- [x] Insufficient balance and locked-balance cases are covered

Remaining: 5 subtasks

Current evidence: policy regression coverage verifies inactive-wallet, insufficient available-balance, and insufficient locked-balance failures. The withdrawal service has not yet been verified to call the settlement policy on `main`.

## 4. Verification and closure

- [ ] `pnpm audit:r8-closure`
- [ ] `pnpm typecheck:api`
- [ ] Full API tests
- [ ] API build
- [x] Railway API deploy succeeds
- [x] Railway Admin deploy succeeds
- [x] Railway Member deploy succeeds
- [ ] Closure evidence records verified commit SHAs
- [ ] `docs/master-worklist.md` marks R-008 as `DONE`

Remaining: 6 subtasks

Verification blocker: the GitHub Actions integration workflow has not produced a run or implementation commit after repeated trigger commits. Until the service files are changed and verified, R-008 must remain PARTIAL.

## Totals

- Main headings remaining: 4
- Subtasks remaining: 23
- Verified subtasks: 10
- Current verification workflow: `.github/workflows/apply-r008-admin-withdrawal-integrations.yml`
- Current integration patcher: `tools/apply-r008-admin-withdrawal-integrations.mjs`
- Latest policy regression commit: `3cb499c0b8f7cff19e72efba1aa38238a3d606ac`