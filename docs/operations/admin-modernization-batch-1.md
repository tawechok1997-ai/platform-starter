# Admin Modernization Batch 1

Updated: 2026-07-21  
Status: Code complete; verification and evidence pending  
Scope: `apps/web-admin` and Admin-only documentation  
Branch: `agent/admin-modernization-batch-1`

## Objective

Modernize the Admin application in parallel-safe batches without changing Member, API, Prisma, wallet, provider, or game-platform behavior.

## Safety boundary

- No database schema or migration changes.
- No API route, finance, permission, session, provider, or audit-contract changes.
- No Member files.
- No new runtime dependency until an ADR, bundle impact, owner, migration plan, and rollback path are recorded.
- Each workstream remains independently revertible.

## Implementation status

All code implementation items in this batch are complete.

The remaining checklist items are acceptance evidence only:

- final Admin CI verification;
- bundle baseline;
- browser state evidence;
- six-viewport visual evidence;
- accessibility evidence;
- authenticated console and network-failure evidence.

Acceptance mapping: [`admin-ci-acceptance-matrix.md`](./admin-ci-acceptance-matrix.md).

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
- [x] Remove selectors coupled to inline style text.
- [x] Consolidate duplicate primitive ownership into a protected-shell core and route compatibility facade, with shared shell button/link composition and forwarded refs.
- [x] Add component tests before deleting compatibility CSS.

Ownership source: [`admin-css-ownership-inventory.md`](./admin-css-ownership-inventory.md).  
Implementation audit: [`admin-selector-and-primitive-audit.md`](./admin-selector-and-primitive-audit.md).

### D. Admin server-state policy

- [x] Inventory page-level fetch/effect orchestration.
- [x] Define query keys, stale times, retries, cancellation, polling, and invalidation by domain.
- [x] Define central session-expiry and permission-change handling.
- [x] Define optimistic rollback and conflict handling.
- [x] Decide whether the measured need justifies TanStack Query and record an ADR before installation.

Policy source: [`../architecture/admin-server-state-policy.md`](../architecture/admin-server-state-policy.md).  
Inventory source: [`../architecture/admin-request-form-data-view-inventory.md`](../architecture/admin-request-form-data-view-inventory.md).  
Decision source: [`../architecture/admin-dependency-decisions.md`](../architecture/admin-dependency-decisions.md).

### E. Forms and mutation safety

- [x] Inventory mutation forms and manual validation.
- [x] Standardize error-code mapping, focus-first-error, validation summary, dirty state, duplicate-submit protection, mandatory reasons, conflict and partial-failure handling.
- [x] Decide whether React Hook Form and Zod are justified and record an ADR before installation.

Contract source: [`../architecture/admin-form-mutation-safety.md`](../architecture/admin-form-mutation-safety.md).  
Decision source: [`../architecture/admin-dependency-decisions.md`](../architecture/admin-dependency-decisions.md).

### F. Dense operations UI

- [x] Inventory queue/table implementations.
- [x] Define one Admin data-view contract for filters, URL state, sorting, pagination, masking, bulk actions, partial failures, mobile card fallback and export.
- [x] Decide whether TanStack Table is justified after inventory and bundle review.

Contract source: [`../architecture/admin-data-view-contract.md`](../architecture/admin-data-view-contract.md).  
Decision source: [`../architecture/admin-dependency-decisions.md`](../architecture/admin-dependency-decisions.md).

### G. Quality gates

- [ ] Retain browser evidence for loading, error, and not-found states.
- [ ] Retain six-viewport Admin visual evidence.
- [ ] Add keyboard, focus restoration, 200% zoom, reduced-motion, and axe evidence.
- [ ] Add console/network failure gates for authenticated Admin flows.
- [x] Add performance budgets for route JS, layout shift, and long-table rendering.

Performance budget source: [`../../apps/web-admin/performance-budget.json`](../../apps/web-admin/performance-budget.json).

## Progress count

- Completed checklist items: **28**
- Remaining verification/evidence items: **6**
- Remaining code implementation items: **0**
- Member implementation items changed: **0**
- API/Prisma contract items changed: **0**

## Latest implementation commits

- `4db7d5fe` — protected-shell button/link class composition consolidated.
- `5e279703` — shell primitive consolidation contract tests.
- `7e05ee03` — primitive audit records the first consolidation slice.
- `1b0ccd03` — Admin CI acceptance matrix.
- `8df68b63` — primitive ownership ambiguity closed as shell core plus route compatibility facade.

Earlier completed commits remain available in PR #101 history.

## Final verification commands

Run these together from one final branch head:

```bash
pnpm --filter @platform/web-admin lint
pnpm --filter @platform/web-admin test
pnpm --filter @platform/web-admin typecheck
pnpm --filter @platform/web-admin build
pnpm --filter @platform/web-admin analyze
```

## CI workflows to inspect

- `P5 Web Unit Tests`: `Test Admin critical components` must pass.
- `R005 Shared API Client`: `Typecheck Admin Web` must pass.
- `Quality Gate`: `build (web-admin)` and Admin lint evidence must pass.
- Analyzer output from `pnpm --filter @platform/web-admin analyze` must be retained for bundle acceptance.

`R-013 Visual Regression` and `P5 Security Audit` are supporting evidence, not substitutes for Admin test, typecheck, lint or bundle evidence.

See the complete decision table in [`admin-ci-acceptance-matrix.md`](./admin-ci-acceptance-matrix.md).

## Current remaining risk

- Code is complete but the final Admin component tests and typecheck have not yet passed on the latest head.
- Bundle thresholds are defined but have not been measured from the final head.
- Compatibility stylesheets remain loaded intentionally until browser evidence permits removal.
- Browser, accessibility, visual and authenticated console/network evidence are not yet claimed as passing.

## Handoff record

For every verification follow-up, record:

- exact branch head;
- workflow and step name;
- exact pass/fail result;
- bundle or visual evidence location;
- unrelated failures excluded and why;
- remaining risk.
