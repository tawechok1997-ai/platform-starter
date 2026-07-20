# Finance Mutation Ownership

## Purpose

This matrix records the existing mutation owners and transaction boundaries. It does not move money logic. Its job is to prevent another implementation from appearing in reporting, queue or reconciliation modules while the remaining compatibility mutation is migrated safely.

## Ownership matrix

| Mutation | Owner | Transaction / lock boundary | Idempotency | Audit owner |
|---|---|---|---|---|
| Manual wallet credit/debit | `WalletService.adjustWallet()` | Prisma transaction in `WalletService` | `WalletLedger.idempotencyKey` with `adjust:` namespace | `WalletService` writes `ADJUST_WALLET` |
| Game wallet debit/credit/reversal | `WalletService.mutateGameBalance()` | Serializable Prisma transaction; optional PostgreSQL advisory transaction lock | `WalletLedger.idempotencyKey` with `game:` namespace and payload conflict check | Provider/game caller supplies metadata; wallet owns ledger write |
| Create top-up request | `TopUpsService.createMemberRequest()` | Prisma transaction around idempotency lookup and request creation | `TopUpRequest.idempotencyKey` scoped by user | Request creation owner |
| Claim/release top-up review | `TopUpsService` | Row lock from `lockTopUpRequestForUpdate()` inside Prisma transaction | Request state and claim ownership | `TopUpsService` writes admin audit events |
| Top-up approval/rejection/credit workflow | `DepositWorkflowService` | Deposit workflow transaction and domain policy | Workflow/request idempotency rules | Deposit workflow owner |
| Withdrawal request and review lifecycle | `WithdrawalsService` / `WithdrawalWorkflowService` | Withdrawal row lock, workflow transaction and risk enforcement | Workflow/request idempotency rules | Withdrawal workflow owner |
| Reconciliation reads and operational diagnostics | `MoneyOpsService` and detail query services | Read-only paths | Not applicable | Not applicable |
| Compatibility real-ledger mutation | `MoneyOpsService.mutateLedger()` under `REAL_LEDGER_MUTATION_ENABLED` | Independent Prisma transaction inside `MoneyOpsService` | Caller-supplied ledger idempotency key | `MoneyOpsService` writes `ledger.mutate` audit |
| Finance dashboard/report projections | `FinanceSummaryQueryService` / `FinanceReportsQueryService` | Read-only | Not applicable | Not applicable |
| Queue, risk and activity projections | Their respective owner modules | Read-only compatibility projections | Not applicable | Not applicable |

## Finding blocking DEDUP-05 closure

`MoneyOpsService.mutateLedger()` directly updates `Wallet` and creates `WalletLedger`. This duplicates the manual-adjustment responsibility already owned by `WalletService.adjustWallet()` and uses a separate arithmetic, validation, idempotency and audit path.

It remains unchanged in this batch because replacing it safely requires preserving:

- the `REAL_LEDGER_MUTATION_ENABLED` gate
- the current endpoint response
- caller-supplied reference fields
- idempotency behavior
- permission and audit metadata
- transaction and failure semantics

The safe migration is to add a compatible WalletService command or adapter and make MoneyOps delegate to it before deleting the direct Prisma mutation.

## Rules

1. `FinanceModule`, queue projections and risk projections must not update wallet balances directly.
2. No new direct wallet mutation may be added to `MoneyOpsModule`; its existing gated mutation is a temporary documented exception.
3. Game providers must call `WalletService.mutateGameBalance()` rather than writing `Wallet` or `WalletLedger` directly.
4. Manual admin adjustments must call `WalletService.adjustWallet()` or a compatible WalletService command.
5. Top-up and withdrawal state transitions remain in their workflow services; reporting modules may only read them.
6. Lock, idempotency and audit ownership must move together. Moving only the database update is prohibited.
7. Prisma schema and existing money semantics remain unchanged in this deduplication batch.

## Closure evidence

`node tools/audit-finance-mutation-boundary.mjs` blocks new unauthorized wallet mutations and explicitly tracks the temporary MoneyOps exception. DEDUP-05 closes only after that exception delegates to WalletService and is removed from the audit allowlist.
