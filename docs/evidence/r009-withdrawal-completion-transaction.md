# R-009 Withdrawal Completion Transaction Evidence

## Scope

This evidence covers `WithdrawalsService.completeRequest` only.

## Verified structure

The completion flow:

1. Opens one caller-owned `PrismaService.$transaction` callback.
2. Locks `withdrawal_requests` before `wallets`.
3. Creates the debit ledger with the transaction client.
4. Updates wallet balance and locked balance with the same transaction client.
5. Completes the withdrawal request with the same transaction client.
6. Writes the admin audit record with the same transaction client.
7. Throws when the guarded state update affects anything other than one row, causing the transaction to roll back.
8. Uses the stable idempotency key `withdrawal:${id}:complete`.

## Enforced evidence

- `tools/audit-r009-withdrawal-completion-transaction.mjs`
- `tools/audit-r009-withdrawal-completion-rollback.mjs`
- `.github/workflows/r009-withdrawal-completion-closure.yml`

## Closure condition

The R-009 withdrawal-completion subtask may be marked DONE after the dedicated workflow reports:

- transaction audit passed,
- rollback contract passed,
- API typecheck passed.

No schema, migration, production data, or business-policy change is part of this evidence slice.
