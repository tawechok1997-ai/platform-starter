# R-010 Shared Cursor Pagination Evidence

## Scope

This evidence closes the shared cursor pagination outcome for the first migrated read family.

## Implementation

- Added `apps/api/src/common/query/cursor-pagination.ts`.
- Centralized limit parsing, clamping, cursor normalization, Prisma cursor arguments, look-ahead fetch (`limit + 1`), `hasMore`, and `nextCursor` construction.
- Migrated both member and admin support-ticket list queries to the shared pattern.
- Added deterministic ordering by `createdAt DESC, id DESC`.
- Preserved the existing response contracts for member and admin support lists.
- Kept detail reads and all support mutations unchanged.

## Enforcement

- Added `tools/audit-r010-cursor-pagination.mjs`.
- The guard requires both support list paths to use the shared utility.
- The guard rejects duplicated cursor/limit/page slicing logic in `SupportQueryService`.
- `.github/workflows/r010-query-boundaries.yml` runs the guard and API typecheck when shared query utilities or query services change.

## Commits

- `233055412dc1bfa537309ded0f40937a719fd28f` — add shared cursor pagination utility.
- `64c0f29197704e972bd8f737d4952a07e44a0347` — migrate support list queries.
- `d38adfd6d29f5005e7b8aa16857122a1c995f060` — add pagination drift guard.
- `728552cbb1b75ef61f09e54b4ea97e20a13ff1d2` — enforce pagination guard in CI.
