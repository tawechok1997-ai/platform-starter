# R-008 Closure Checklist

Status: PARTIAL

## 1. Admin ownership integration — COMPLETE IN CODE

- [x] Implementation commit is present on `main`
- [x] `AdminOwnershipPolicy.assertCanTransfer` is called by `AdminOwnershipCommandService`
- [x] Self-transfer is rejected by the policy
- [x] Non-owner transfer is rejected
- [x] Inactive target is rejected
- [x] Target 2FA requirement remains enforced
- [x] Domain errors preserve the HTTP contract
- [x] Ownership audit and role transfer remain in one transaction
- [x] Service regression tests cover accepted and rejected transfers

Remaining: 0 subtasks

Current evidence: `AdminAccessController` now routes ownership transfers through `AdminOwnershipCommandService`. The command service loads the actor and target, applies `AdminOwnershipPolicy.assertCanTransfer`, maps owner authorization failures to `ForbiddenException`, maps other policy violations to `BadRequestException`, and delegates accepted commands to the existing transactional ownership transfer implementation. Regression coverage verifies accepted, non-owner, self-transfer, and inactive-target paths.

## 2. Withdrawal lifecycle integration — COMPLETE IN CODE

- [x] Implementation commit is present on `main`
- [x] Amount validation uses `WithdrawalPolicy`
- [x] Claim eligibility uses `WithdrawalPolicy`
- [x] Approve transition uses `WithdrawalPolicy`
- [x] Complete transition uses `WithdrawalPolicy`
- [x] Reject transition uses `WithdrawalPolicy`
- [x] Domain errors preserve the HTTP contract
- [x] Policy regression tests cover invalid transitions
- [x] Idempotency behavior remains unchanged

Remaining: 0 subtasks

Current evidence: commit `490607cb25349bc63c5fe092249701ab246dfd7c` integrates `WithdrawalPolicy` into member amount validation, claim eligibility, approval, completion, and rejection. `InvalidStateTransitionError` remains an HTTP conflict while other domain errors map to bad requests. Existing request and completion idempotency keys remain unchanged.

## 3. Wallet settlement integration — IMPLEMENTED, VERIFICATION PENDING

- [ ] Reservation uses `WalletSettlementPolicy.reserve`
- [ ] Completion uses `WalletSettlementPolicy.completeDebit`
- [ ] Rejection uses `WalletSettlementPolicy.releaseReservation`
- [ ] Wallet active-state validation is centralized
- [ ] Ledger and wallet updates remain atomic
- [x] Insufficient balance and locked-balance cases are covered

Remaining: 5 subtasks

Current evidence: commit `490607cb25349bc63c5fe092249701ab246dfd7c` contains the wallet policy calls inside the existing Prisma transactions. These five items remain open until API build/deploy verification succeeds for the integration commit.

## 4. Verification and closure

- [ ] `pnpm audit:r8-closure`
- [ ] `pnpm typecheck:api`
- [ ] Full API tests
- [ ] API build
- [x] Railway API deploy succeeds for earlier verified commits
- [x] Railway Admin deploy succeeds
- [x] Railway Member deploy succeeds
- [ ] Closure evidence records verified commit SHAs
- [ ] `docs/master-worklist.md` marks R-008 as `DONE`

Remaining: 6 subtasks

Current verification state: Web Admin and Web Member are successful for the withdrawal integration commit. Railway API is pending, so wallet settlement and final verification remain open.

## Totals

- Main headings remaining: 2
- Subtasks remaining: 11
- Verified subtasks: 22
- Current verification workflow: `.github/workflows/apply-r008-admin-withdrawal-integrations.yml`
- Current integration patcher: `tools/apply-r008-admin-withdrawal-integrations.mjs`
- Admin ownership implementation commits: `fcd49238c0f9517536a29f20c9f6404dd00f9f49`, `3302f03f260cad9f7115d479d9a745a9a64f19dc`, `f6647b95249882e9b20dcd14877d7717236490d7`
- Admin ownership regression commit: `90b25f27b91a49d70becde5009559a47e06cc038`
- Withdrawal and wallet integration commit: `490607cb25349bc63c5fe092249701ab246dfd7c`
