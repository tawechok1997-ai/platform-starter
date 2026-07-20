# Provider Simulator Round Enforcement

The provider simulator reconstructs round state from the existing `WalletLedger` metadata before applying a game callback.

- `BET` maps to `PLACE_BET`.
- `WIN` maps to `SETTLE`.
- `REFUND` and `ROLLBACK` map to `ROLLBACK`.
- Matching duplicate transaction IDs are replay-safe through the wallet idempotency contract.
- Conflicting callbacks and invalid state transitions are rejected before a new wallet mutation.

This is simulator enforcement without a new database table. A persistent round aggregate and database-level round lock remain required before enabling equivalent behavior for a real provider under concurrent callbacks.
