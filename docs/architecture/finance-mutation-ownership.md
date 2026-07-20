# Finance Mutation Ownership

## Purpose

This matrix records the mutation owners and transaction boundaries. It prevents reporting, queue, reconciliation and compatibility modules from creating alternative money mutation paths.

## Ownership matrix

| Mutation | Owner | Transaction / lock boundary | Idempotency | Audit owner |
|---|---|---|---|---|
| Manual wallet credit/debit | `WalletService.adjustWallet()` | Prisma transaction in `WalletService` | `WalletLedger.idempotencyKey` with `adjust:` namespace | `WalletService` writes `ADJUST_WALLET` |
| Gated MoneyOps real-ledger mutation | `AdminLedgerMutationService.execute()` in `wallet` | Serializable Prisma transaction | Caller-supplied `WalletLedger.idempotencyKey` with conflict rejection | `AdminLedgerMutationService` writes `ledger.mutate` inside the same transaction |
| Game wallet debit/credit/reversal | `WalletService.mutateGameBalance()` | Serializable Prisma transaction; optional PostgreSQL advisory transaction lock | `WalletLedger.idempotencyKey` with `game:` namespace and payload conflict check | Provider/game caller supplies metadata; wallet owns ledger write |
| Create top-up request | `TopUpsService.createMemberRequest()` | Prisma transaction around idempotency lookup and request creation | `TopUpRequest.idempotencyKey` scoped by user | Request creation owner |
| Claim/release top-up review | `TopUpsService` | Row lock from `lockTopUpRequestForUpdate()` inside Prisma transaction | Request state and claim ownership | `TopUpsService` writes admin audit events |
| Top-up approval/rejection/credit workflow | `DepositWorkflowService` | Deposit workflow transaction and domain policy | Workflow/request idempotency rules | Deposit workflow owner |
| Withdrawal request and review lifecycle | `WithdrawalsService` / `WithdrawalWorkflowService` | Withdrawal row lock, workflow transaction and risk enforcement | Workflow/request idempotency rules | Withdrawal workflow owner |
| Reconciliation reads and operational diagnostics | `MoneyOpsService` and detail query services | Read-only paths | Not applicable | Not applicable |
| Finance dashboard/report projections | `FinanceSummaryQueryService` / `FinanceReportsQueryService` | Read-only | Not applicable | Not applicable |
| Queue, risk and activity projections | Their respective owner modules | Read-only compatibility projections | Not applicable | Not applicable |

## Compatibility contract

`MoneyOpsService.mutateLedger()` retains:

- the `REAL_LEDGER_MUTATION_ENABLED` gate
- the current endpoint response `{ ok, item, realMutation }`
- caller-supplied reference fields
- caller-supplied idempotency key
- permission and actor metadata from the existing controller

It now delegates the transaction, wallet update, ledger creation and audit write to `AdminLedgerMutationService` exported by `WalletModule`.

## Rules

1. `FinanceModule`, `MoneyOpsModule`, queue projections and risk projections must not update wallet balances directly.
2. Gated admin ledger mutation must delegate to `AdminLedgerMutationService`.
3. Game providers must call `WalletService.mutateGameBalance()` rather than writing `Wallet` or `WalletLedger` directly.
4. Manual admin adjustments must call `WalletService.adjustWallet()`.
5. Top-up and withdrawal state transitions remain in their workflow services; reporting modules may only read them.
6. Lock, idempotency and audit ownership must move together. Moving only the database update is prohibited.
7. Prisma schema and existing route contracts remain unchanged in this deduplication batch.

## Closure evidence

`node tools/audit-finance-mutation-boundary.mjs` blocks wallet and ledger mutations outside the documented owner services and verifies both wallet mutation owners remain present. DEDUP-05 is closed.
