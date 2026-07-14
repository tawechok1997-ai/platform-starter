# R-008 Domain Model and Policy Separation Progress

Status: **IN PROGRESS**

Updated: **2026-07-14**

## Implemented

- Framework-independent `DomainError` and `InvalidStateTransitionError`.
- Value objects for `Money`, `PhoneNumber`, `BankAccountNumber`, and `EntityId`.
- Deposit lifecycle and claim policy.
- Withdrawal lifecycle and balance policy.
- Wallet reservation, debit, and release policy.
- Admin ownership and step-up policy.
- KYC review lifecycle policy.
- Watchlist classification and override policy.
- Support ticket lifecycle policy.
- Notification preference policy.
- Consolidated domain invariant unit-test suite.
- Static R-008 audit that rejects NestJS/Prisma concerns inside domain policy files.
- `TopUpsService` now delegates amount and claim rules to `DepositPolicy` and maps domain errors at the application boundary.

## Remaining before DONE

- Route `WithdrawalsService` through `WithdrawalPolicy` and `WalletSettlementPolicy` for create, claim, approve, complete, reject, and release flows.
- Route Admin lifecycle commands through `AdminOwnershipPolicy`.
- Route KYC/watchlist application services through their policies.
- Route Support and Notification mutations through their policies.
- Remove duplicated lifecycle arrays and inline business-rule checks after compatibility verification.
- Add policy-specific characterization tests around each migrated application service.
- Run `pnpm audit:r8-closure`, API typecheck, API unit tests, and API build on a clean checkout.
- Update `docs/master-project-worklist.md` only after the migrated services and closure gate pass.

## Closure command

```bash
pnpm audit:r8-closure
pnpm typecheck:api
pnpm --filter @platform/api test -- --runInBand
pnpm build:api
```
