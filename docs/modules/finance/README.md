# Finance Module README

## Scope

Finance spans deposits, withdrawals, wallet ledger, finance summaries/reports, provider money operations, reconciliation details, and game-platform wallet mutations.

## Primary implementation

- `apps/api/src/modules/topups` — member top-up requests and deposit slip workflow.
- `apps/api/src/modules/withdrawals` — member withdrawal requests, admin proof upload, verification, and completion.
- `apps/api/src/modules/wallet` and `apps/api/src/modules/wallet-ledger` — wallet and ledger read paths.
- `apps/api/src/modules/finance` — admin finance summaries and report queries.
- `apps/api/src/modules/money-ops` — simulator, ledger detail, reconciliation detail, and operations tooling.
- `apps/api/src/modules/game-platform` — provider transfer, webhook, reconciliation, and wallet mutation orchestration.

## Safety boundaries

- Money-changing paths must keep idempotency keys, audit writes, and transaction boundaries together.
- Deposit and withdrawal state transitions must use their workflow services rather than controller-local Prisma writes.
- Provider settlement must remain gated until provider-specific UAT is complete.

## Regression evidence to keep current

- `pnpm --filter @platform/api test -- deposit-workflow.service.spec.ts withdrawal-workflow.service.spec.ts --runInBand`
- `pnpm --filter @platform/api test -- src/modules/finance/finance-concurrency.db.spec.ts --runInBand`
- `pnpm --filter @platform/api test -- src/modules/promotions/promotion-settlement.db.spec.ts --runInBand`
