# Webhook Security Hardening

Current webhook flow is receive-only. Before enabling real wallet mutation or bet settlement, complete these controls.

## Required controls

- Require `eventType`.
- Require `idempotencyKey`.
- Store request headers with raw payload.
- Detect duplicate idempotency keys before provider parsing.
- Return/log duplicate events as `DUPLICATE` with response status 208.
- Return/log invalid signatures as `FAILED` with response status 400.
- Keep wallet mutation disabled until settlement logic is explicitly enabled.

## Production controls still required

- Raw body capture for exact signature verification.
- Provider-specific signature algorithm implementation.
- Timestamp tolerance, for example 5 minutes.
- Replay protection using idempotency key and timestamp.
- Optional provider IP allowlist.
- Event mapping table for bet settlement, transfer callbacks, and balance changes.
- Parse failure logging with response status 400.
- Alerting for repeated invalid signature or duplicate spikes.

## Suggested headers

```text
x-provider-signature
x-provider-timestamp
x-provider-event-id
x-provider-request-id
```

## No-go rules

Do not enable `webhookSettlementEnabled` if:

- raw body signature validation is not implemented
- duplicate handling is not verified
- event mapping is incomplete
- reconciliation is not passing
- admin cannot view raw and normalized payloads
