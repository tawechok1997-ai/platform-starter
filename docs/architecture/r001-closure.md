# R-001 Architecture Inventory Closure Evidence

Status: **DONE**

Closed on: **2026-07-14**

## Deliverables

- `docs/architecture/module-map.md`
  - Covers every API module registered by `AppModule`.
  - Records responsibility, owner, data/side effects and public Nest module entry point.
  - Defines cross-cutting foundations and ownership rules.
- `docs/architecture/dependency-map.md`
  - Defines dependency direction and prohibited relationships.
  - Records approved caller/callee relationships with reasons.
  - Records background job ownership and public module contracts.
- `docs/architecture/route-ownership.md`
  - Maps every controller-owning module to route families.
  - Records actor/permission, data/tables, side effects and audit expectations.
- `tools/audit-architecture-inventory.mjs`
  - Discovers modules, controllers and scheduled/background handlers.
  - Verifies module-map and route-owner coverage.
  - Verifies required architecture sections and approved Nest module dependencies.
- `tools/audit-architecture-boundaries.mjs`
  - Detects circular Nest module dependencies.
  - Detects frontend server-only imports, cross-app relative imports, forbidden domain imports and private cross-module deep imports.
- `.github/workflows/build.yml`
  - Runs both architecture audits before schema, tests and builds.

## Required closure commands

```bash
pnpm audit:architecture-inventory
pnpm audit:architecture-boundaries
pnpm audit:r1-closure
```

All commands must exit with code 0 on the same commit. Deployment status alone is not architecture-audit evidence.

## Definition of done mapping

| Requirement | Evidence |
|---|---|
| Module map exists and covers registered modules | `module-map.md` plus inventory audit |
| Dependency map exists | `dependency-map.md` |
| Route ownership exists | `route-ownership.md` plus controller-owner audit |
| Controller/route/job owners are known | Module-folder ownership rule plus automated discovery |
| Critical route data, side effects, permission and audit are documented | Route ownership columns |
| Cross-module services have reasons and public contracts | Approved relationship table |
| Circular dependencies are checked | Boundary audit |
| Deep/cross-app imports are checked | Boundary audit and public-contract rules |
| Public entry point is defined per module | Module map public-entry-point column |
| CI enforces inventory | Build workflow architecture audit steps |
