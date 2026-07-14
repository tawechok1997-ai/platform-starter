# R-008 Closure Checklist

Status: PARTIAL

## 1. Admin ownership integration

- [ ] Implementation commit is present on `main`
- [ ] `AdminOwnershipPolicy.assertCanTransfer` is called by `AdminAccessService`
- [ ] Self-transfer is rejected by the policy
- [ ] Non-owner transfer is rejected
- [ ] Inactive target is rejected
- [x] Target 2FA requirement remains enforced
- [ ] Domain errors preserve the HTTP contract
- [x] Ownership audit and role transfer remain in one transaction
- [ ] Service regression tests cover accepted and rejected transfers

Remaining: 7 subtasks

Current evidence: `AdminAccessService.transferOwnership` still performs self-transfer, owner-role, and active-target validation inline. No verified R-008 implementation commit is present on `main`.

## 2. Withdrawal lifecycle integration

- [ ] Implementation commit is present on `main`
- [ ] Amount validation uses `WithdrawalPolicy`
- [ ] Claim eligibility uses `WithdrawalPolicy`
- [ ] Approve transition uses `WithdrawalPolicy`
- [ ] Complete transition uses `WithdrawalPolicy`
- [ ] Reject transition uses `WithdrawalPolicy`
- [ ] Domain errors preserve the HTTP contract
- [ ] Service regression tests cover invalid transitions
- [ ] Idempotency behavior remains unchanged

Remaining: 9 subtasks

Current evidence: the integration patcher has been aligned with the domain contracts, but no verified service implementation commit has been produced on `main`.

## 3. Wallet settlement integration

- [ ] Reservation uses `WalletSettlementPolicy.reserve`
- [ ] Completion uses `WalletSettlementPolicy.completeDebit`
- [ ] Rejection uses `WalletSettlementPolicy.releaseReservation`
- [ ] Wallet active-state validation is centralized
- [ ] Ledger and wallet updates remain atomic
- [ ] Insufficient balance and locked-balance cases are covered

Remaining: 6 subtasks

Current evidence: policy contracts are present and closure-audit markers are defined, but the withdrawal service has not yet been verified to call the settlement policy on `main`.

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
- Subtasks remaining: 28
- Verified subtasks: 5
- Current verification workflow: `.github/workflows/apply-r008-admin-withdrawal-integrations.yml`
- Current integration patcher: `tools/apply-r008-admin-withdrawal-integrations.mjs`
- Latest checked repository head: `1c5818a85b575eb2108cc7ecd9b32bc24b4bdb6a`
