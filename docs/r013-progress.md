# R-013 Progress

Status: 🟡 ACTIVE

Started: 2026-07-15

Source of truth: `docs/master-project-worklist.md`

## Scope

R-013 covers the shared UI system, design tokens, responsive patterns, accessibility baselines, and visual-regression evidence across Admin and Member.

## Definition of done

- [x] Remove unused legacy Admin UI files.
- [x] Remove the empty unused `packages/ui` workspace.
- [x] Inventory hard-coded color, spacing, radius, shadow, breakpoint, and z-index values.
- [x] Consolidate color tokens.
- [x] Consolidate spacing, radius, and shadow tokens.
- [x] Consolidate typography, motion, breakpoint, and z-index tokens.
- [x] Create or consolidate Button, Input, Select, and TextArea primitives.
- [x] Create or consolidate Modal, Drawer, and ConfirmDialog primitives.
- [x] Create or consolidate Table, Pagination, Tabs, and Badge primitives.
- [x] Create or consolidate Toast, Alert, Skeleton, EmptyState, and ErrorState primitives.
- [x] Reduce duplicate responsive CSS.
- [x] Define a mobile-first responsive strategy.
- [x] Define table-to-card, modal-to-bottom-sheet, and sidebar-to-drawer patterns.
- [ ] Add keyboard, focus, and ARIA baselines.
- [ ] Add reduced-motion and contrast checks.
- [ ] Add six-viewport visual regression.
- [ ] Store screenshot, trace, console, and network artifacts in CI.

## Closed outcomes

### 3-10. Shared tokens and primitives

- Centralized color, spacing, radius, shadow, typography, motion, breakpoint, and z-index ownership in `packages/design-tokens`.
- Added shared form-control, overlay, data-display, and feedback primitives.
- Migrated representative Admin and Member usages while retaining compatibility classes.
- Added machine-readable guards and frontend typechecks to `.github/workflows/r013-ui-system.yml`.
- Verification PRs #32, #34, #36, #38, #40, #42, and #44 completed successfully.

### 11. Reduce duplicate responsive CSS

- Added `packages/design-tokens/responsive-layout.css`.
- Centralized container, readable width, stack, cluster, grid, safe-area, and visibility rules.
- Admin and Member load the same responsive source.

### 12. Define a mobile-first responsive strategy

- Mobile behavior is the unqualified default.
- Tablet and desktop enhancements use `@media (min-width: 768px)` and `@media (min-width: 1024px)`.
- Shared gutters, grid columns, visibility, modal placement, and sidebar widths are owned centrally.

### 13. Define responsive transformation patterns

- Table-to-card remains enforced through `.ui-table[data-mobile="cards"]` and `data-label`.
- Modal-to-bottom-sheet remains enforced below 768px.
- Sidebar-to-drawer remains enforced through the Member drawer dialog contract.
- Added `tools/audit-r013-responsive-contract.mjs`.
- Verification-only PR #46 ran workflow `R-013 UI System`, run `29404205335`, job `87315624708`.
- All responsive guards, artifact upload, Admin typecheck, and Member typecheck completed successfully.

## Active work

### 14-15. Accessibility baselines

- [ ] Centralize keyboard and focus-visible behavior.
- [ ] Guard dialog, navigation, tabs, status, and invalid-field ARIA contracts.
- [ ] Enforce reduced-motion behavior across shared primitives.
- [ ] Add automated contrast-token checks.
- [ ] Run frontend verification.

## Initial findings

- Shared token, primitive, and responsive ownership is centralized through outcome 13.
- Accessibility behavior exists in several components but needs one guarded baseline.
- Visual-regression and browser artifact outcomes remain open.

## Count

- Total R-013 outcomes: 17
- Closed: 13
- Remaining: 4

## Latest commits

- `e0e9020a8538ce191734c722f097ab00f40b81f3` — verify responsive contracts in CI.
- `bf4756c6f38abc243bcc40f8152d7d9332eeda99` — guard mobile-first strategy and transformations.
- `4b6f274900fb567a2adf74a8a4381344f5ef0cfb` — load shared responsive source in Member.
- `7db6a1ecfd637f706ad2c49f3658f3e283cc62a1` — load shared responsive source in Admin.
- `86ad0e914b95a80e702dcf5d571683b1872c6933` — define shared responsive layout contract.
