# Backward-Compatible Route Migration & Deprecation Plan

Last updated: 2026-07-13

Use this plan when moving overlapping admin/member routes between modules.

## Rules

1. Keep the existing route active until the replacement route is deployed and verified in both admin/member apps.
2. Add server-side deprecation metadata (`Deprecation`, `Sunset`, or response warning) before removing an old route.
3. Update `docs/architecture/endpoint-ownership-matrix.md` in the same PR as any ownership change.
4. Add or update an audit/logging assertion when the migrated route mutates money, risk, settings, access, promotion, or affiliate state.
5. Run the relevant build, unit tests, static audits, and smoke route checks before marking a route migrated.

## Migration phases

| Phase | Requirement | Exit criteria |
| --- | --- | --- |
| 1. Shadow | New owner route exists behind existing behavior | New route builds and has unit/contract coverage |
| 2. Dual-read/write guard | UI can consume new route while old route remains | No drift between old/new payloads in smoke checks |
| 3. Deprecate old route | Old route returns deprecation metadata and docs point to new route | Worklist evidence includes route mapping and date |
| 4. Remove old route | Remove only after consumer migration and deprecation window | API build/tests pass; no frontend direct references remain |

## Current priority migrations

- Promotion/affiliate ledgers: split from `RiskAlert` metadata into dedicated Prisma models before enabling real payout/bonus wallet settlement.
- Activity/audit: keep mutating services writing audit logs; keep activity timeline read-only aggregation.
- Finance/reports/exports: keep reports as aggregate owner and exports as CSV owner.
- Risk/risk-alerts: keep `risk` as read-only summary and `risk-alerts` as lifecycle owner.
