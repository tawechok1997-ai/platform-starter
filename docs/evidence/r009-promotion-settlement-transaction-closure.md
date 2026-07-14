# R-009 Promotion Settlement Transaction Closure

## Production owner

`SettlementCommandService.execute` owns the full promotion settlement transaction.

The successful RELEASE, RETRY, and REVERSE paths now keep the following operations under one Serializable transaction client:

1. lock and reload the source risk alert;
2. revalidate the requested lifecycle action;
3. move a completed bonus to release-ready when required;
4. lock the bonus ledger;
5. lock the member wallet;
6. reuse or create the stable wallet-ledger idempotency record;
7. update the wallet balance;
8. update the bonus-ledger settlement or reversal state;
9. update risk-alert lifecycle metadata;
10. persist the admin audit record.

No command path delegates lifecycle, settlement, or reversal to a repository that opens a separate transaction.

## Failure ownership

When a settlement has started and the Serializable transaction rolls back, the command records `SETTLEMENT_FAILED` metadata and its matching audit record in a second isolated transaction. Validation failures that occur before settlement begins do not create a false settlement-failure state.

## Idempotency and concurrency

- normal settlement key: `bonus:<risk-alert-id>:settlement`
- reversal key: `bonus:<risk-alert-id>:settlement:reversal`
- bonus and wallet rows are locked before financial mutation;
- an existing wallet-ledger idempotency record is reused rather than credited again;
- PostgreSQL settlement concurrency coverage remains available in `promotion-settlement.db.spec.ts`;
- command regression coverage is enforced through `settlement-command.service.spec.ts`.

## Enforcement

- `tools/audit-r009-promotion-settlement-transaction.mjs`
- `.github/workflows/r009-parallel-boundary-closure.yml`
- Railway API build/deployment for runtime commit `de3a065b3c69c014a2baf6594cbcdc4893da1a9c`
