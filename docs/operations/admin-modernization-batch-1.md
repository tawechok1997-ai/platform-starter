# Admin Modernization Batch 1

Updated: 2026-07-21  
Status: In progress  
Scope: `apps/web-admin` and Admin-only documentation  
Branch: `agent/admin-modernization-batch-1`

## Objective

Modernize the Admin application in parallel-safe batches without changing Member, API, Prisma, wallet, provider, or game-platform behavior.

## Safety boundary

- No database schema or migration changes.
- No API route, finance, permission, session, provider, or audit-contract changes.
- No Member files.
- No new runtime dependency until an ADR, bundle impact, owner, migration plan, and rollback path are recorded.
- Each workstream must remain independently revertible.

## Workstreams

### A. Runtime and delivery foundation

- [x] Add Admin metadata, no-index policy, dark color scheme, and theme color.
- [x] Disable the framework-identifying response header.
- [x] Enable React strict mode.
- [x] Add an Admin bundle-analysis command.
- [x] Add a root loading state with live-region feedback.
- [x] Add a recoverable root error state with retry and dashboard fallback.
- [x] Add a root not-found state.
- [ ] Run Admin lint, test, typecheck, build, and bundle analysis.
- [ ] Record baseline route chunks and largest client bundles.

### B. Documentation alignment

- [x] Update `docs/ADMIN_UX_UI_REDESIGN.md` from the obsolete Next.js 14 / React 18 baseline to the actual Next.js 15.5.18 / React 19.2.7 baseline.
- [x] Separate implemented facts from planned dependencies.
- [ ] Link this execution record from `docs/README.md` after the batch passes verification.

### C. Styling and component ownership

- [ ] Inventory root CSS imports and assign every stylesheet an owner.
- [ ] Classify styles as tokens, shell, primitive, feature, compatibility, or removable.
- [ ] Remove selectors coupled to inline style text.
- [ ] Consolidate duplicate Button, Field, Card, Badge, Modal, Drawer, Table, Toast, Skeleton, Empty, Error, and ConfirmDialog variants.
- [ ] Add component tests before deleting compatibility CSS.

### D. Admin server-state policy

- [ ] Inventory page-level fetch/effect orchestration.
- [ ] Define query keys, stale times, retries, cancellation, polling, and invalidation by domain.
- [ ] Define central session-expiry and permission-change handling.
- [ ] Define optimistic rollback and conflict handling.
- [ ] Decide whether the measured need justifies TanStack Query and record an ADR before installation.

### E. Forms and mutation safety

- [ ] Inventory mutation forms and manual validation.
- [ ] Standardize error-code mapping, focus-first-error, validation summary, dirty state, duplicate-submit protection, and mandatory reasons.
- [ ] Decide whether React Hook Form and Zod are justified and record an ADR before installation.

### F. Dense operations UI

- [ ] Inventory queue/table implementations.
- [ ] Define one Admin data-view contract for filters, URL state, sorting, pagination, masking, bulk actions, partial failures, and mobile card fallback.
- [ ] Decide whether TanStack Table is justified after inventory and bundle review.

### G. Quality gates

- [ ] Retain browser evidence for loading, error, and not-found states.
- [ ] Retain six-viewport Admin visual evidence.
- [ ] Add keyboard, focus restoration, 200% zoom, reduced-motion, and axe evidence.
- [ ] Add console/network failure gates for authenticated Admin flows.
- [ ] Add performance budgets for route JS, layout shift, and long-table rendering.

## Completed commits

- `8bcca0c1` — Admin metadata and root-layout modernization.
- `fc113cd0` — React strict mode, powered-by header removal, and analyzer wiring.
- `1bdedc98` — Admin package bundle-analysis command.
- `afc0e27d` — initial parallel-safe execution tracker.
- `d8ddbadf` — root loading state.
- `51e5678e` — recoverable root error state.
- `a25dbefa` — root not-found state.
- `ace3168c` and `c68a2931` — shared root-state styling and layout import.

## Verification commands

```bash
pnpm --filter @platform/web-admin lint
pnpm --filter @platform/web-admin test
pnpm --filter @platform/web-admin typecheck
pnpm --filter @platform/web-admin build
pnpm --filter @platform/web-admin analyze
```

## Current remaining risk

- CI status has not appeared for the latest branch head yet.
- The root layout still imports many overlapping Admin stylesheets; consolidation must wait for selector ownership and visual evidence.
- Browser, accessibility, bundle, and visual verification are not yet claimed as passing.

## Handoff record

For every follow-up commit, record:

- files and route ownership changed;
- checks run and their exact result;
- bundle or visual impact;
- compatibility behavior retained;
- remaining risk;
- rollback commit or file path.
