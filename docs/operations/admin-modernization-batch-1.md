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
- [x] Link the execution record and new Admin contracts from `docs/README.md`.

### C. Styling and component ownership

- [x] Inventory root CSS imports and assign every stylesheet an owner.
- [x] Classify styles as tokens, shell, primitive, feature, compatibility, or consolidation candidates.
- [ ] Remove selectors coupled to inline style text.
- [ ] Consolidate duplicate Button, Field, Card, Badge, Modal, Drawer, Table, Toast, Skeleton, Empty, Error, and ConfirmDialog variants.
- [ ] Add component tests before deleting compatibility CSS.

Ownership source: [`admin-css-ownership-inventory.md`](./admin-css-ownership-inventory.md).

### D. Admin server-state policy

- [ ] Inventory page-level fetch/effect orchestration.
- [x] Define query keys, stale times, retries, cancellation, polling, and invalidation by domain.
- [x] Define central session-expiry and permission-change handling.
- [x] Define optimistic rollback and conflict handling.
- [ ] Decide whether the measured need justifies TanStack Query and record an ADR before installation.

Policy source: [`../architecture/admin-server-state-policy.md`](../architecture/admin-server-state-policy.md).

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

## Progress count

- Completed checklist items: **16**
- Remaining checklist items: **18**
- Member implementation items changed: **0**
- API/Prisma contract items changed: **0**

## Completed commits

- `8bcca0c1` — Admin metadata and root-layout modernization.
- `fc113cd0` — React strict mode, powered-by header removal, and analyzer wiring.
- `1bdedc98` — Admin package bundle-analysis command.
- `afc0e27d` — initial parallel-safe execution tracker.
- `d8ddbadf` — root loading state.
- `51e5678e` — recoverable root error state.
- `a25dbefa` — root not-found state.
- `ace3168c` and `c68a2931` — shared root-state styling and layout import.
- `7ab21889` — Admin CSS ownership and consolidation inventory.
- `b5e71406` — Admin server-state policy.
- `64b44d0e` — documentation-map links for the active Admin contracts.

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
- Compatibility stylesheets remain loaded until selector ownership and visual evidence justify migration.
- The server-state policy is documented, but page-level request inventory and dependency decision remain open.
- Browser, accessibility, bundle, and visual verification are not yet claimed as passing.

## Handoff record

For every follow-up commit, record:

- files and route ownership changed;
- checks run and their exact result;
- bundle or visual impact;
- compatibility behavior retained;
- remaining risk;
- rollback commit or file path.
