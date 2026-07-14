# R-008 Closure Checklist

Status: PARTIAL

## 1. Admin ownership integration

- [ ] Implementation commit is present on `main`
- [ ] `AdminOwnershipPolicy.assertCanTransfer` is called by `AdminAccessService`
- [ ] Self-transfer is rejected by the policy
- [ ] Non-owner transfer is rejected
- [ ] Inactive target is rejected
- [ ] Target 2FA requirement remains enforced
- [ ] Domain errors preserve the HTTP contract
- [ ] Ownership audit and role transfer remain in one transaction
- [ ] Service regression tests cover accepted and rejected transfers

Remaining: 9 subtasks

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

## 3. Wallet settlement integration

- [ ] Reservation uses `WalletSettlementPolicy.reserve`
- [ ] Completion uses `WalletSettlementPolicy.completeDebit`
- [ ] Rejection uses `WalletSettlementPolicy.releaseReservation`
- [ ] Wallet active-state validation is centralized
- [ ] Ledger and wallet updates remain atomic
- [ ] Insufficient balance and locked-balance cases are covered

Remaining: 6 subtasks

## 4. Verification and closure

- [ ] `pnpm audit:r8-closure`
- [ ] `pnpm typecheck:api`
- [ ] Full API tests
- [ ] API build
- [ ] Railway API deploy succeeds
- [ ] Railway Admin deploy succeeds
- [ ] Railway Member deploy succeeds
- [ ] Closure evidence records verified commit SHAs
- [ ] `docs/master-worklist.md` marks R-008 as `DONE`

Remaining: 9 subtasks

## Totals

- Main headings remaining: 4
- Subtasks remaining: 33
- Current verification workflow: `.github/workflows/apply-r008-admin-withdrawal-integrations.yml`
- Current integration patcher: `tools/apply-r008-admin-withdrawal-integrations.mjs`
