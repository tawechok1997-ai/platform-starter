# R-010 Response Contract Snapshots

Closed outcome: add response snapshot and contract tests.

## Coverage

- `apps/api/src/modules/reports/report-response-contracts.spec.ts`
  - daily dashboard summary
  - queue aging
  - wallet reconciliation
- `apps/api/src/modules/notifications/notification-response-contracts.spec.ts`
  - notification items
  - date groups
  - counts and total
  - read state
  - preference categories and channels

## Enforcement

`.github/workflows/r010-query-boundaries.yml` runs both snapshot suites in band, followed by API typecheck.

The tests use deterministic time and mocked read dependencies. They verify public response shapes without requiring a database or changing production behavior.
