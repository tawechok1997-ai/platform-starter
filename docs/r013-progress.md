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

## Closed outcomes

### 3. Inventory hard-coded design values

- Added `tools/audit-r013-design-token-inventory.mjs`.
- Scans Admin and Member CSS/TS/TSX source.
- Classifies colors, spacing/dimensions, radius, shadow, breakpoints, and z-index.
- Emits machine-readable JSON evidence.
- Added `.github/workflows/r013-ui-system.yml` with artifact upload and both frontend typechecks.
- Verification-only PR #32 ran workflow `R-013 UI System`, run `29395337259`, job `87287462809`.
- Inventory generation, artifact upload, Admin typecheck, and Member typecheck completed successfully.

### 4. Consolidate color tokens

- Added the shared semantic contract at `packages/design-tokens/colors.css`.
- Covered canvas, surfaces, text, brand, status, border, and backdrop colors.
- Admin and Member layouts load the same shared source.
- Added local compatibility aliases so existing screens keep their public CSS contract while migrating.
- Added `tools/audit-r013-color-token-contract.mjs` to reject missing imports, missing semantic tokens, and self-referencing aliases.
- Added the shared token path and contract guard to `.github/workflows/r013-ui-system.yml`.
- Verification-only PR #34 ran workflow `R-013 UI System`, run `29396310025`, job `87290494428`.
- Inventory, shared-color guard, artifact upload, Admin typecheck, and Member typecheck completed successfully.

### 5. Consolidate spacing, radius, and shadow tokens

- Added `packages/design-tokens/shape-space-shadow.css` with shared spacing, radius, and shadow scales.
- Admin and Member layouts load the same shared source.
- Existing `--radius` and `--shadow` variables remain compatibility aliases.
- Added `tools/audit-r013-shape-space-shadow-contract.mjs` and wired it into the R-013 workflow.
- Added retained frontend typecheck logs for failed CI investigations.
- Fixed the R-012 deposit server-state regression by restoring `/member/topups` and `/member/receiving-bank-accounts` endpoints.
- Verification-only PR #36 ran workflow `R-013 UI System`, run `29397572019`, job `87294445965`.
- Inventory, color guard, shape/space/shadow guard, artifact upload, Admin typecheck, and Member typecheck completed successfully.

### 6. Consolidate typography, motion, breakpoint, and z-index tokens

- Added `packages/design-tokens/type-motion-layout.css`.
- Defined shared font families, type scale, line heights, font weights, motion durations, easing curves, breakpoint values, and ordered z-index layers.
- Admin and Member layouts load the same shared source.
- Added `tools/audit-r013-type-motion-layout-contract.mjs` to verify required tokens, imports, self-reference safety, and z-index ordering.
- Verification-only PR #38 ran workflow `R-013 UI System`, run `29398823758`, job `87298416792`.
- All token guards, artifact upload, Admin typecheck, and Member typecheck completed successfully.

### 7. Consolidate Button, Input, Select, and TextArea primitives

- Added `packages/design-tokens/form-controls.css` with shared Button, Input, Select, and TextArea classes.
- Added primary, secondary, and danger button variants plus disabled, focus-visible, invalid, placeholder, and reduced-motion contracts.
- Admin and Member layouts load the same shared source.
- Migrated Admin and Member login forms while retaining page-specific classes for visual compatibility.
- Added `tools/audit-r013-form-control-primitives.mjs`.
- Verification-only PR #40 ran workflow `R-013 UI System`, run `29399593281`, job `87300852584`.
- All primitive guards, artifact upload, Admin typecheck, and Member typecheck completed successfully.

## Active work

### 8. Consolidate Modal, Drawer, and ConfirmDialog primitives

- [ ] Inventory existing overlays and confirmation flows.
- [ ] Define shared backdrop, surface, header, body, and action contracts.
- [ ] Migrate representative Drawer and ConfirmDialog usages.
- [ ] Add keyboard/ARIA contract guards and frontend verification.

## Initial findings

- Shared design-token and form-control ownership is centralized, while feature-level migration remains incremental.
- Overlay implementations remain distributed across Admin and Member.
- Existing reduced-motion CSS is present, but contrast, focus, keyboard, and ARIA evidence are not yet centralized.

## Count

- Total R-013 outcomes: 17
- Closed: 7
- Remaining: 10

## Latest commits

- `8b77ff301b4cfb6fcc99ac2676dd8863b5529f55` — verify shared form control primitives.
- `144f57fe3da4b0cf195193b19b2e6c1ed9292a7b` — guard form control primitive contracts.
- `6e0e0eecddc855a45ed7b764f843383dc1994f3b` — migrate Member login form controls.
- `5f6b11b44ee6f6e10df7e89752adaf0c135fd7b5` — migrate Admin login form controls.
- `b33421262f73d490b0d2f56c3b0faf0ae358436f` — define shared form control primitives.
