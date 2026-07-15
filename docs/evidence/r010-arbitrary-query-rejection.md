# R-010 Arbitrary Query Rejection Evidence

Date: 2026-07-15

## Outcome

R-010 outcome 7, reject arbitrary sort and filter input, is implemented for the migrated admin support-ticket list boundary.

## Controls

- `query-filters.ts` rejects oversized text filters instead of truncating them.
- Invalid enum filters throw `BadRequestException` instead of silently becoming undefined.
- Invalid sort fields and directions throw `BadRequestException` instead of falling back to defaults.
- Support status, category, sort field, and sort direction have explicit allowlists.
- DTO validation and service-level parsing both enforce the boundary.
- Raw query values are never used as Prisma field names or sort directions.
- Default ordering remains `createdAt DESC` only when sort input is absent.
- Cursor ordering retains the matching `id` tie-breaker.

## Preserved behavior

- Missing optional filters continue to mean no filter.
- `ALL` continues to disable status or category filtering.
- Valid search, status, category, sort, cursor, and limit inputs preserve the existing response shape.
- No mutation, transaction, wallet, settlement, provider, or permission behavior changed.

## Regression guard

`tools/audit-r010-filter-sort-boundaries.mjs` now fails when:

- strict `BadRequestException` rejection is removed;
- oversized text is truncated;
- invalid sort input silently falls back;
- status/category/sort allowlists drift;
- DTO validation is weakened;
- raw parsing returns to the support query service.

The guard runs in `.github/workflows/r010-query-boundaries.yml` together with API typecheck.
