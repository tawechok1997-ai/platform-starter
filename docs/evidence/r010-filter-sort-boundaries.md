# R-010 Shared Filter and Sort Boundary Evidence

Date: 2026-07-15

## Scope

Outcome 6: create shared filter parsing and sort whitelists.

## Implementation

- Added `apps/api/src/common/query/query-filters.ts`.
- Added shared helpers for optional text normalization, enum filtering, and sort parsing.
- Migrated `SupportQueryService.listAdminTickets()` to shared filter and sort parsing.
- Added additive, validated query parameters `sortBy` and `sortDirection`.
- Restricted sorting to `createdAt`, `updatedAt`, or `status` and `asc` or `desc`.
- Preserved the prior default ordering of `createdAt desc`.
- Added an `id` tie-breaker using the same direction to keep cursor ordering deterministic.

## Safety

- Invalid sort fields cannot reach Prisma because DTO validation and the parser both use allowlists.
- Invalid sort directions fall back to the existing default.
- Search and category values are trimmed and length-bounded centrally.
- Existing status, category, search, cursor, limit, and response behavior remain compatible.
- No mutation, transaction, schema, permission, finance, or provider behavior changed.

## Enforcement

- `tools/audit-r010-filter-sort-boundaries.mjs`
- `.github/workflows/r010-query-boundaries.yml`
- API typecheck remains part of the required workflow.
