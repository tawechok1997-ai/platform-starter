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

## Active work

### 7. Consolidate Button, Input, Select, and TextArea primitives

- [ ] Inventory existing shared and duplicated form controls.
- [ ] Define accessible shared primitive contracts.
- [ ] Migrate representative Admin and Member forms.
- [ ] Add contract guards and frontend verification.

## Initial findings

- Shared design-token ownership is centralized, while feature-level literal migration remains incremental.
- Form control implementations remain distributed across Admin and Member.
- Existing reduced-motion CSS is present, but contrast, focus, keyboard, and ARIA evidence are not yet centralized.

## Count

- Total R-013 outcomes: 17
- Closed: 6
- Remaining: 11

## Latest commits

- `b07a67bfbae0ab4792ff75279546b86823855a38` — verify shared typography, motion, breakpoint, and z-index tokens.
- `a058f6bc7d1c8615143223bf473829ea583cf5fb` — guard the shared type/motion/layout contract.
- `f4c31590a7da8002d7830c917acd9ccf03d01c2d` — load the shared type/motion/layout contract in Member.
- `b650b39cfcf3a1113493a726fc38934a8b4a7efe` — load the shared type/motion/layout contract in Admin.
- `c2f26827114d1da3a4c6062a31958f393c0d4b4b` — define shared typography, motion, breakpoint, and z-index tokens.
