# Admin List Contract

> D-10 implementation evidence · 2026-07-24

## Scope

The shared Admin list contract centralizes page state, page-size selection, filter resets, client fallback pagination, server payload normalization and query-string construction.

## Shared boundary

- `apps/web-admin/app/(admin)/_components/admin-list-contract.ts`
- `apps/web-admin/app/(admin)/_components/admin-list-contract.spec.ts`
- `apps/web-admin/app/(admin)/_components/admin-list-contract-adoption.spec.ts`

## Adopted routes

- `/wallet-ledgers`
- `/webhook-logs`

Both routes now:

- Reset to page 1 when filters change
- Clamp the current page when filtered results shrink
- Use the shared `AdminPagination` primitive
- Allow consistent page-size selection
- Preserve loading and empty states

Wallet Ledger CSV export intentionally uses the complete filtered result, not only the visible page.

## Server compatibility

`normalizeAdminListPayload` accepts server metadata using `total`, `page`, `pageSize` and `totalPages`, while safely falling back when legacy endpoints only return `items`.

`buildAdminListQuery` provides the query boundary for future server pagination without forcing unsupported parameters into existing endpoints.

## Current limit

The current `/admin/money-ops/ledger` and `/admin/webhook-logs` calls still fetch legacy result sets and paginate them in the browser. D-10 is therefore partial until their API controllers/services expose and verify server-side pagination/filter contracts.

The shared boundary must be reused by `/game-providers` and other list-heavy routes before D-10 can be closed.
