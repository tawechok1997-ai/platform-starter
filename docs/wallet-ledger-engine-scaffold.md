# Wallet Ledger Engine Scaffold

The platform already has `Wallet` and `WalletLedger` schema. This scaffold prepares real mutation rules without enabling real-money provider mutation.

## Current API scaffold

```text
GET  /admin/money-ops/ledger
POST /admin/money-ops/ledger/simulate
```

`ledger/simulate` returns a fake balance mutation preview only. It does not write wallet or ledger rows.

## Real mutation requirements

- Lock wallet row before mutation.
- Use database transaction.
- Write immutable ledger row.
- Never edit wallet balance manually.
- Require idempotency key for every provider-related mutation.
- Store referenceType/referenceId for transfer, webhook, correction, and reconciliation.
- Require admin note for correction ledger.

## Mutation types

- Debit
- Credit
- Reserve
- Release
- Reversal
- Correction

## Integrity checks

- Wallet balance must match latest ledger balanceAfter.
- lockedBalance must never be negative.
- balance must never be negative unless explicitly allowed by business rule.
- Duplicate idempotency key must return existing result, not create a new ledger.
