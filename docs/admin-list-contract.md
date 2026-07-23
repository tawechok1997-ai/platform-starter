# Admin Server List Contract

> D-10 implementation evidence · verified 2026-07-24

## Status

D-10 is complete for the audited list-heavy Admin routes.

The shared contract now covers UI list state, validated API query DTOs, server filtering, database counts, `skip/take` pagination, normalized response metadata, page-size selection, filter resets, loading/empty states and regression guards.

## Shared Admin boundary

- `apps/web-admin/app/(admin)/_components/admin-list-contract.ts`
- `apps/web-admin/app/(admin)/_components/admin-list-contract.spec.ts`
- `apps/web-admin/app/(admin)/_components/admin-list-contract-adoption.spec.ts`

The normalized response shape is:

- `items`
- `total`
- `page`
- `pageSize`
- `totalPages`

## Adopted routes

### `/wallet-ledgers`

- Server search, direction, type and date filters
- Database `count`, `skip` and `take`
- Page metadata returned by the API
- Search debounce and page reset on filter changes
- CSV is explicitly scoped to the loaded page

API boundary:

- `apps/api/src/modules/money-ops/dto/money-ops.dto.ts`
- `apps/api/src/modules/money-ops/money-ops-ledger-query.service.ts`

### `/webhook-logs`

- Server search and status filters
- Status validation matches the Prisma `WebhookLogStatus` enum
- Database `count`, `skip` and `take`
- Server summary for processed, failed and duplicate records
- Payload redaction from D-09 remains enforced

API boundary:

- `apps/api/src/modules/game-platform/dto/webhook-log-query.dto.ts`
- `apps/api/src/modules/game-platform/webhook-log-query.service.ts`

### `/game-providers`

- Server search, status and health filters
- Health filters preserve the existing `ATTENTION` and `NORMAL` behavior
- Database `count`, `skip` and `take`
- Server summary for total providers, active providers, attention providers and games
- Detail, create/edit, status, sync, health-check, endpoint and credential workflows remain available

API boundary:

- `apps/api/src/modules/game-platform/dto/game-provider-query.dto.ts`
- `apps/api/src/modules/game-platform/game-provider-query.service.ts`

## Regression guards

`admin-list-contract-adoption.spec.ts` requires all three routes to use:

- `useAdminListContract`
- `buildAdminListQuery`
- `normalizeAdminListPayload`
- `AdminPagination`

It also rejects a return to browser-only `paginateAdminItems` for these routes and verifies that provider detail and mutation workflows remain present.

## Verification

Verification PR `#169` was marker-only and was not merged.

- Railway: API, Admin and Member passed
- Quality Gate run `30048941795`: API tests and all three app builds passed
- Build run `30048941863`: schema validation, Prisma generation, API/Admin/Member typechecks, API and database regression tests, and all app builds passed
- Full-System run `30048941880`: automated profile passed
- Full-System artifact: `8580304143`
- Artifact digest: `sha256:0563bb82b226414547002af2efae1ac6f61d8bdffca06babfc02c2c0e69f198c`

## Boundary

This contract closes server list behavior for the three audited routes. It does not claim that every list page in Admin has been migrated. Future list-heavy routes must adopt the same response and query contract instead of creating another pagination shape.
