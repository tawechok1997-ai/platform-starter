# Money Ops Audit and Alert Rules

## Audit events

Current scaffold:

```text
POST /admin/money-ops/audit-events
```

Important actions that must be audited:

- provider gate toggled
- transfer retried
- transfer reviewed
- reconciliation snapshot reviewed
- reconciliation snapshot resolved
- session reconciled
- endpoint changed
- credential changed
- alert rules scanned
- simulator scenario executed

## Alert rules scaffold

Current scaffold:

```text
GET  /admin/money-ops/alert-rules
POST /admin/money-ops/alert-rules/scan
```

Rules:

- `GAME_TRANSFER_FAILED`
- `WEBHOOK_INVALID_SIGNATURE`
- `WEBHOOK_DUPLICATE_SPIKE`
- `RECONCILIATION_MISMATCH`
- `PROVIDER_DEGRADED`
- `REAL_MONEY_GATE_ENABLED`

## Next phase

- Persist generated alerts into `RiskAlert`.
- Add alert deduplication by `refType/refId`.
- Add notification channels.
- Add alert resolution workflow.
