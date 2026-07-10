# Provider Simulator Plan

The provider simulator lets the platform test launch, transfer, webhook, timeout, and duplicate behavior without connecting to a real provider.

## Goals

- Test game launch without real provider credentials.
- Test balance response behavior.
- Test transfer in/out success and failure.
- Test duplicate webhook idempotency.
- Test invalid signature handling.
- Test timeout/ambiguous provider responses.

## Simulator scenarios

- `launch_success`
- `balance_success`
- `transfer_in_success`
- `transfer_out_success`
- `timeout`
- `duplicate_webhook`
- `invalid_signature`

## Admin scenario API

```text
GET /admin/money-ops/provider-simulator/scenarios
```

## Fake provider API

```text
GET  /provider-simulator/health
POST /provider-simulator/launch
POST /provider-simulator/balance
POST /provider-simulator/transfer-in
POST /provider-simulator/transfer-out
POST /provider-simulator/webhook
POST /provider-simulator/timeout
```

## Example webhook payload

```json
{
  "eventType": "simulator.transfer.completed",
  "idempotencyKey": "simulator-idempotency-key",
  "providerTransactionId": "simulator-tx-id",
  "amount": "100.00",
  "currency": "THB"
}
```

## No-go rule

Simulator endpoints must never mutate real wallet balance.
