# API error code catalog

This catalog defines stable machine-readable error codes for Admin and Member clients. Frontends must branch on `code`, not parse human-readable messages.

## Response shape

```json
{
  "code": "RISK_ALERT_INVALID_TRANSITION",
  "message": "Invalid risk alert status transition",
  "details": {},
  "requestId": "optional-request-id"
}
```

## Finance and withdrawals

| Code | Meaning | Typical HTTP status |
|---|---|---:|
| `FINANCE_INVALID_STATE` | The financial record is not in a state that allows the requested transition. | 409 |
| `FINANCE_IDEMPOTENCY_CONFLICT` | The same idempotency key was reused with incompatible input or result. | 409 |
| `FINANCE_INSUFFICIENT_BALANCE` | The requested debit would make the available balance negative. | 400 |
| `WITHDRAWAL_CLAIM_REQUIRED` | An admin must claim the withdrawal before reviewing or paying it. | 409 |
| `WITHDRAWAL_CLAIM_CONFLICT` | Another admin currently owns the withdrawal review. | 409 |
| `WITHDRAWAL_PROOF_INVALID` | The payment proof is missing, malformed, duplicated, or too large. | 400/409 |

## Risk alerts

| Code | Meaning | Typical HTTP status |
|---|---|---:|
| `RISK_ALERT_NOT_FOUND` | The requested risk alert does not exist. | 404 |
| `RISK_ALERT_INVALID_TRANSITION` | The requested risk-alert status transition is not allowed. | 400 |
| `RISK_ALERT_SCAN_COOLDOWN` | A manual scan was requested before the configured cooldown elapsed. | 429 |

## Promotions

| Code | Meaning | Typical HTTP status |
|---|---|---:|
| `PROMOTION_CAMPAIGN_NOT_FOUND` | The selected promotion campaign is missing or inactive. | 404 |
| `PROMOTION_DUPLICATE_CLAIM` | A member already has an active claim for the same campaign or deposit. | 400/409 |
| `PROMOTION_INVALID_LIFECYCLE` | A bonus lifecycle transition is not allowed. | 400/409 |

## Rollout rule

1. New critical errors must use a catalog code.
2. Existing message-only errors migrate domain by domain with contract tests.
3. Codes are append-only. Renaming or removing a code requires a deprecation window.
4. Messages may be localized; codes must remain stable.
