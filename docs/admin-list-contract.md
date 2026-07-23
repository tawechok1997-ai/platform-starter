# Admin List Contract

> D-10 implementation evidence · 2026-07-24

## Scope

The shared Admin list contract centralizes page state, page-size selection, filter resets, server payload normalization and query-string construction.

## Shared boundary

- `apps/web-admin/app/(admin)/_components/admin-list-contract.ts`
- `apps/web-admin/app/(admin)/_components/admin-list-contract.spec.ts`
- `apps/web-admin/app/(admin)/_components/admin-list-contract-adoption.spec.ts`

## Server-adopted routes

### `/wallet-ledgers`

- API query: `page`, `take`, `search`, `direction`, `type`, `dateFrom`, `dateTo`
- API uses validated DTO input, Prisma `count`, `skip` and `take`
- Response includes `items`, `total`, `page`, `pageSize` and `totalPages`
- Filters reset to page 1
- Search uses a short debounce
- CSV export is explicitly scoped to the loaded server page

### `/webhook-logs`

- API query: `page`, `take`, `search`, `status`
- API uses validated DTO input, Prisma `count`, `skip` and `take`
- Response includes list metadata plus filtered summary counts
- Search/status changes reset to page 1
- Provider payload redaction from D-09 remains enforced

## API query services

- `apps/api/src/modules/money-ops/money-ops-ledger-query.service.ts`
- `apps/api/src/modules/game-platform/webhook-log-query.service.ts`
- `apps/api/src/modules/money-ops/dto/money-ops.dto.ts`
- `apps/api/src/modules/game-platform/dto/webhook-log-query.dto.ts`

The query services are separated from mutation/orchestration services so pagination changes do not expand the risk surface of wallet mutations, provider settlement or webhook receipt processing.

## Regression protection

The adoption spec requires both routes to use:

- `useAdminListContract`
- `buildAdminListQuery`
- `normalizeAdminListPayload`
- `page` and `take` server parameters
- `AdminPagination`

It rejects a return to browser-only `paginateAdminItems` on these routes.

## Verification

Railway status for commit `334e17632e1501fb663bb92d9e733717683778ac`:

- API: success
- Admin: success
- Member: success

Verification PR `#161` was opened as a marker-only GitHub Actions trigger and must not be merged.

## Remaining D-10 scope

D-10 remains partial until `/game-providers` adopts the shared query/result contract. Other list-heavy routes can migrate incrementally after that reference implementation.
