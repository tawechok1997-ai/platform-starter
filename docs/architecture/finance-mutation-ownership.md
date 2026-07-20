# Finance Mutation Ownership

## Purpose

This matrix records the existing mutation owners and transaction boundaries. It does not move money logic. Its job is to prevent a second implementation from appearing in reporting, queue or reconciliation modules.

## Ownership matrix

| Mutation | Owner | Transaction / lock boundary | Idempotency | Audit owner |
|---|---|---|---|---|
| Manual wallet credit/debit | `WalletService.adjustWallet()` | Prisma transaction in `WalletService` | `WalletLedger.idempotencyKey` with `adjust:` namespace | `WalletService` writes `ADJUST_WALLET` |
| Game wallet debit/credit/reversal | `WalletService.mutateGameBalance()` | Serializable Prisma transaction; optional PostgreSQL advisory transaction lock | `WalletLedger.idempotencyKey` with `game:` namespace and payload conflict check | Provider/game caller supplies metadata; wallet owns ledger write |
| Create top-up request | `TopUpsService.createMemberRequest()` | Prisma transaction around idempotency lookup and request creation | `TopUpRequest.idempotencyKey` scoped by user | Request creation owner |
| Claim/release top-up review | `TopUpsService` | Row lock from `lockTopUpRequestForUpdate()` inside Prisma transaction | Request state and claim ownership | `TopUpsService` writes admin audit events |
| Top-up approval/rejection/credit workflow | `DepositWorkflowService` | Deposit workflow transaction and domain policy | Workflow/request idempotency rules | Deposit workflow owner |
| Withdrawal request and review lifecycle | `WithdrawalsService` / `WithdrawalWorkflowService` | Withdrawal row lock, workflow transaction and risk enforcement | Workflow/request idempotency rules | Withdrawal workflow owner |
| Reconciliation reads and operational diagnostics | `MoneyOpsService` and detail query services | Read-only; no wallet mutation ownership | Not applicable | Not applicable |
| Finance dashboard/report projections | `FinanceSummaryQueryService` / `FinanceReportsQueryService` | Read-only | Not applicable | Not applicable |
| Queue, risk and activity projections | Their respective owner modules | Read-only compatibility projections | Not applicable | Not applicable |

## Rules

1. `FinanceModule`, `MoneyOpsModule`, queue projections and risk projections must not update wallet balances directly.
2. Game providers must call `WalletService.mutateGameBalance()` rather than writing `Wallet` or `WalletLedger` directly.
3. Manual admin adjustments must call `WalletService.adjustWallet()`.
4. Top-up and withdrawal state transitions remain in their workflow services; reporting modules may only read them.
5. Lock, idempotency and audit ownership must move together. Moving only the database update is prohibited.
6. Prisma schema and existing money semantics remain unchanged in this deduplication batch.

## Closure evidence

DEDUP-05 is considered structurally closed when an automated guard verifies that reporting and operational projection modules do not contain direct wallet balance mutations, and when the matrix remains aligned with exported service boundaries.
