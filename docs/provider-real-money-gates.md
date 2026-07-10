# Provider Real-money Gates

Real-money behavior must stay disabled until these gates are explicit and reviewed.

## Recommended provider metadata flags

Use provider metadata as the first safe place for feature gates:

```json
{
  "launchEnabled": true,
  "transferEnabled": false,
  "realMoneyEnabled": false,
  "webhookSettlementEnabled": false
}
```

## Gate meanings

- `launchEnabled`: allows dry-run/member launch flow.
- `transferEnabled`: allows transfer flow. Keep false until wallet mutation is implemented safely.
- `realMoneyEnabled`: allows real wallet mutation. Default must be false.
- `webhookSettlementEnabled`: allows webhook-driven settlement. Default must be false.

## Required readiness checks

- Adapter registered.
- Provider ACTIVE.
- LAUNCH endpoint enabled.
- BALANCE endpoint enabled.
- TRANSFER_IN endpoint enabled.
- TRANSFER_OUT endpoint enabled.
- WEBHOOK endpoint enabled.
- API_KEY credential enabled.
- WEBHOOK_SECRET credential enabled.
- Latest reconciliation is MATCHED.
- No unresolved MISMATCH snapshots.
- Duplicate webhook handling tested.
- Admin review tools tested.

## No-go conditions

Never enable real money if:

- `realMoneyEnabled` is false.
- Any required endpoint or credential is missing.
- Latest reconciliation status is MISMATCH or UNKNOWN.
- Failed transfer count is unexplained.
- Duplicate webhook count is unexplained.
- Provider risk panel status is BLOCKED or NEEDS_REVIEW.
