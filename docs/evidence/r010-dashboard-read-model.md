# R-010 Dashboard Read Model

## Scope

The existing `GET /admin/reports/daily` response is the administrative dashboard summary contract. Its aggregate reads previously lived directly in `ReportsQueryService`.

## Implementation

- Added `AdminDashboardReadModel` under the `reports` module.
- Moved top-up, withdrawal, adjustment, wallet, ledger, and pending-queue aggregates into the read model.
- Kept `ReportsQueryService.getDailySummary()` as the stable public orchestration entrypoint.
- Preserved the existing response keys: `range`, `topUps`, `withdrawals`, `adjustments`, `wallets`, `ledgers`, `pendingQueues`, and `generatedAt`.
- Registered the read model in `ReportsModule`.

## Guard

`tools/audit-r010-dashboard-read-model.mjs` verifies ownership, delegation, module registration, aggregate coverage, and response-key continuity. The guard runs in `.github/workflows/r010-query-boundaries.yml` together with API typecheck.

## Safety

No mutation, wallet settlement, transaction ownership, permissions, controller route, or response contract was changed.
