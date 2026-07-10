# Real-money Preflight and Safe Retry Checklist

This flow is still dry-run only. It prepares controls before real wallet mutation is allowed.

## Provider gate editor

Admin path:

```text
/provider-risk
```

Editable provider metadata flags:

```json
{
  "launchEnabled": true,
  "transferEnabled": false,
  "realMoneyEnabled": false,
  "webhookSettlementEnabled": false
}
```

Rules:

- Keep `realMoneyEnabled` false until final production approval.
- Keep `webhookSettlementEnabled` false until settlement/reconciliation is implemented and tested.
- Do not enable `transferEnabled` until retry, idempotency, and mismatch blockers pass.

## Real-money preflight endpoint

API:

```text
GET /admin/game-providers/:providerId/preflight
```

The endpoint returns:

- `ok`
- `blockers`
- provider flags
- readiness checks
- unresolved mismatch count
- provider risk status

No-go blockers include:

- `realMoneyEnabled_false`
- `transferEnabled_false`
- `webhookSettlementEnabled_false`
- `unresolved_mismatch`
- failed readiness checks

## Safe dry-run retry

API:

```text
POST /admin/game-transfers/:id/retry-dry-run
```

Rules:

- Only FAILED transfers can be retried.
- Retry requires an admin note.
- Retry creates a new `GameTransfer`.
- Retry creates a new `idempotencyKey`.
- Retry links original transfer through `requestPayload.originalTransferId`.
- Retry does not mutate real wallet balance.

## Admin flow

1. Open `/provider-risk`.
2. Confirm provider checks and blockers.
3. Edit flags only when a human approves.
4. Click Preflight.
5. Open `/game-transfers`.
6. Retry only FAILED dry-run transfers.
7. Confirm new transfer appears with a new idempotency key.
8. Keep real money disabled until preflight returns `ok: true`.
