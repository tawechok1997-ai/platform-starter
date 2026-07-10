# Game Incident Playbook

Use this playbook before any real-money provider integration is enabled.

## Transfer failed

1. Open Admin `/game-transfers`.
2. Find the failed transfer.
3. Check `idempotencyKey`, `providerTransactionId`, `errorCode`, and `errorMessage`.
4. Add a review note using the Review action.
5. Do not retry real-money transfer until provider status is confirmed.
6. If retry is needed, create a new transfer attempt with a new idempotency key and link the original transfer in metadata.

## Reconciliation mismatch

1. Open Admin `/provider-wallet-snapshots`.
2. Inspect `systemBalance`, `providerBalance`, and `difference`.
3. Mark the snapshot as reviewed with a note.
4. Resolve only after a human confirms the correct source of truth.
5. Do not enable real money while any unresolved mismatch exists.

## Webhook duplicate

1. Open Admin `/webhook-logs`.
2. Check duplicate `idempotencyKey`.
3. Confirm duplicate response status is 208.
4. Do not process duplicate events into wallet or bet settlement.

## Provider offline or degraded

1. Open Admin `/provider-risk`.
2. Confirm adapter registration and endpoint/credential status.
3. Run health check from `/game-providers`.
4. Disable provider or keep it in maintenance until health is restored.
5. Do not launch new real-money sessions while provider is degraded.

## Hard stop rules

Stop real-money flow if any of these are true:

- Provider is not ACTIVE.
- Adapter is not registered.
- Required endpoints are disabled.
- API_KEY or WEBHOOK_SECRET is disabled.
- Latest reconciliation is MISMATCH or UNKNOWN.
- Duplicate webhook handling is not verified.
- Admin cannot review transfers, snapshots, sessions, and webhooks.
