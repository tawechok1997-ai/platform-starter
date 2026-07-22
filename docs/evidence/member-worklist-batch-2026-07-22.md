# Member UX/UI worklist batch — 2026-07-22

This batch addresses foundation and tooling items that can be completed without changing runtime behavior.

## Completed in this batch

- Defined ownership for shared tokens, global CSS, feature CSS, route CSS and React components.
- Defined canonical component families and duplicate-review rules.
- Defined inline-style migration rules and prohibited new `[style*="..."]` coupling.
- Evaluated React Hook Form/Zod, TanStack Query, Motion, Lucide and category libraries.
- Recorded that no new runtime dependency is approved without a measured need and a dedicated ADR.
- Recorded bundle, migration, ownership, testing and rollback requirements for future dependency adoption.
- Confirmed Playwright remains the E2E, browser-quality, accessibility and visual standard.
- Confirmed no additional design system is approved while shared CSS contracts remain authoritative.

## Worklist items supported by this evidence

- `MEMBER-FOUNDATION-001`: style ownership definition
- `MEMBER-FOUNDATION-002`: tooling evaluations and dependency governance
- `MEMBER-CONTRACT-001`: clearer separation of implementation facts, remaining work and verification gates for this batch
- `MEMBER-TOOLING-001`: reuse Playwright instead of introducing another E2E runner
- `MEMBER-TOOLING-003`: do-not-add decisions for Cypress, RHF/Zod, TanStack Query, Motion, Lucide and additional design systems

## Not claimed complete

- Concrete file-by-file component duplication inventory
- Exact inline-style and `[style*]` occurrence migration
- Runtime component consolidation
- Route visual parity
- Browser evidence for authenticated routes

## Validation

Documentation-only change. No package, lockfile, runtime code, API contract, finance behavior, identity behavior or session behavior changed.
