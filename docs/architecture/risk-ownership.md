# Risk Ownership

## Decision

`risk-alerts` is the first-class risk domain owner.

It owns:

- risk-alert lifecycle queries and mutations
- assignment, notes, resolution and scanning
- watchlist and enforcement services
- KYC risk workflows
- the finance-risk summary projection used by the legacy dashboard route

## Compatibility route

`GET /admin/risk/summary` remains available through `RiskModule`.

The route keeps:

- permission `risk.view`
- existing response fields and alert classifications
- existing wallet, ledger, top-up and withdrawal reads

`RiskModule` no longer owns database access or a separate summary-query implementation. It imports `RiskAlertsModule` and delegates to `FinanceRiskSummaryQueryService`.

## Why the projection name is explicit

The legacy summary does not represent persisted risk-alert lifecycle records. It calculates operational finance conditions such as:

- wallet and latest-ledger mismatch
- negative available balance
- stale pending top-ups
- stale pending withdrawals
- locked balance presence

Naming it `FinanceRiskSummaryQueryService` prevents those derived signals from being confused with managed `RiskAlert` records.

## Safety boundaries

- No route or permission changes.
- No Prisma schema changes.
- No finance mutation changes.
- No automatic conversion of derived summary items into lifecycle alerts.
- The compatibility module may be removed only after route consumers migrate.

## Regression guard

Run:

```bash
node tools/audit-risk-ownership-boundary.mjs
```

The audit prevents database/query ownership from returning to the legacy module and verifies the first-class owner exports the projection service.
