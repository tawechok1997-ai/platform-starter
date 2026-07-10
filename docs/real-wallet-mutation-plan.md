# Real Wallet Mutation Plan

This plan describes the required design before enabling real wallet debit/credit for provider game play.

## Principle

Real wallet mutation must be ledger-first, idempotent, reversible by policy, and reconciled after every provider interaction. Do not mutate balances directly from provider responses without an internal transaction boundary.

## Required components

### 1. Transaction boundary

- Use a database transaction for wallet balance, ledger entry, and game transfer state.
- Lock the user wallet row before mutation.
- Write immutable ledger rows for every debit/credit.
- Store idempotency key before calling provider when possible.

### 2. Idempotency policy

- Unique idempotency key per logical wallet mutation.
- Retry must return the existing result when the same key is reused.
- Admin retry must create a new key and link `originalTransferId`.
- Provider callback/webhook idempotency must be enforced separately.

### 3. Transfer-in real flow

1. Preflight provider.
2. Verify no unresolved mismatch.
3. Lock user wallet.
4. Reserve/debit user wallet into internal ledger.
5. Create GameTransfer PENDING.
6. Call provider transfer-in.
7. Mark transfer SUCCESS or FAILED.
8. On failure, release/reverse reservation through ledger.
9. Reconcile provider balance.

### 4. Transfer-out real flow

1. Preflight provider.
2. Call provider transfer-out with idempotency.
3. If provider succeeds, credit user wallet through ledger.
4. If provider fails, do not credit.
5. Reconcile provider balance.

### 5. Webhook settlement flow

- Validate signature using raw body.
- Check timestamp/replay window.
- Check idempotency key.
- Normalize event.
- Write WebhookLog first.
- Route event into settlement queue.
- Mutate wallet only inside settlement processor with idempotency.
- Reconcile after settlement.

### 6. Manual review

Required for:

- MISMATCH snapshots
- UNKNOWN snapshots
- FAILED provider transfer with ambiguous provider response
- duplicate webhook spikes
- provider outage during transfer

### 7. Rollback policy

- No manual SQL balance edits.
- All correction must be ledger entries.
- Every correction requires admin note, actor, timestamp, and reason.
- Reconcile after correction.

## No-go conditions

Do not implement real wallet mutation until:

- smoke tests pass
- provider risk preflight returns ok
- raw payload viewers exist
- reconciliation is MATCHED
- incident playbook is reviewed
- backup/restore is tested
