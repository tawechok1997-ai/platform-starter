# R-013 Progress

Status: 🟡 ACTIVE

Started: 2026-07-15

Source of truth: `docs/master-project-worklist.md`

## Scope

R-013 covers the shared UI system, design tokens, responsive patterns, accessibility baselines, and visual-regression evidence across Admin and Member.

## Definition of done

- [x] Remove unused legacy Admin UI files.
- [x] Remove the empty unused `packages/ui` workspace.
- [ ] Inventory hard-coded color, spacing, radius, shadow, breakpoint, and z-index values.
- [ ] Consolidate color tokens.
- [ ] Consolidate spacing, radius, and shadow tokens.
- [ ] Consolidate typography, motion, breakpoint, and z-index tokens.
- [ ] Create or consolidate Button, Input, Select, and TextArea primitives.
- [ ] Create or consolidate Modal, Drawer, and ConfirmDialog primitives.
- [ ] Create or consolidate Table, Pagination, Tabs, and Badge primitives.
- [ ] Create or consolidate Toast, Alert, Skeleton, EmptyState, and ErrorState primitives.
- [ ] Reduce duplicate responsive CSS.
- [ ] Define a mobile-first responsive strategy.
- [ ] Define table-to-card, modal-to-bottom-sheet, and sidebar-to-drawer patterns.
- [ ] Add keyboard, focus, and ARIA baselines.
- [ ] Add reduced-motion and contrast checks.
- [ ] Add six-viewport visual regression.
- [ ] Store screenshot, trace, console, and network artifacts in CI.

## Active work

### 3. Inventory hard-coded design values

- [x] Added `tools/audit-r013-design-token-inventory.mjs`.
- [x] Scan Admin and Member CSS/TS/TSX source.
- [x] Classify colors, spacing/dimensions, radius, shadow, breakpoints, and z-index.
- [x] Emit machine-readable JSON evidence.
- [x] Added `.github/workflows/r013-ui-system.yml` with artifact upload and both frontend typechecks.
- [ ] Observe a successful workflow artifact before closing the outcome.

## Initial findings

- Admin and Member each define partial root tokens, but token names and values are not yet a single shared contract.
- Both apps still contain many literal color, radius, shadow, breakpoint, and z-index values.
- Existing reduced-motion CSS is present, but contrast, focus, keyboard, and ARIA evidence are not yet centralized.

## Count

- Total R-013 outcomes: 17
- Closed: 2
- Remaining: 15

## Latest commits

- `df3805928a71969fa2a5d28e2bde86de18a0fedd` — add the R-013 inventory workflow.
- `2f9055fbd7dd824c6dd9a7abf7383ba1300f353a` — add machine-readable design-token inventory.
