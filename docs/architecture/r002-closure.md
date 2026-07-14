# R-002 Closure — Dependency Rules and Module Boundaries

Status: **DONE**

Closed on: **2026-07-14**

## Scope completed

- Dependency direction is documented as presentation → application → domain → repository/infrastructure adapter.
- Domain and policy files are forbidden from importing NestJS or Prisma implementation packages.
- Frontend workspaces are forbidden from importing API source or server-only packages.
- Cross-app relative imports are forbidden.
- Circular Nest module dependencies are detected.
- Private controller, DTO, repository, Prisma, and internal deep imports across API modules are detected.
- Supported cross-module relationships and public contracts are documented in `dependency-map.md`.
- Temporary exceptions require an owner, reason, removal target, and expiry in `boundary-exceptions.md`; expired or malformed entries fail the audit.
- The architecture boundary audit runs in CI and exits non-zero on violations.

## Required verification

```bash
pnpm audit:architecture-boundaries
pnpm audit:r2-closure
```

## Closure rule

R-002 governs source dependency boundaries. It does not claim that R-007 through R-011 structural decomposition is complete; those work items may improve internal layering while remaining subject to these enforced boundaries.
