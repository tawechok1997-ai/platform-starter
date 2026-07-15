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

## Active work

### 5. Consolidate spacing, radius, and shadow tokens

- [ ] Define one shared spacing scale.
- [ ] Define semantic radius and shadow scales.
- [ ] Wire compatibility aliases for both applications.
- [ ] Add drift guards and frontend verification.

## Initial findings

- Shared color ownership is now centralized, but literal colors remain in feature CSS and will be migrated incrementally.
- Spacing, radius, shadow, typography, motion, breakpoint, and z-index values still vary between Admin and Member.
- Existing reduced-motion CSS is present, but contrast, focus, keyboard, and ARIA evidence are not yet centralized.

## Count

- Total R-013 outcomes: 17
- Closed: 4
- Remaining: 13

## Latest commits

- `eb264820174db23c10d3d6e19d80315e642cb067` — document the shared color contract.
- `b9f047ea9b70d2947a28155cee8002c105c0c344` — verify shared colors in the R-013 workflow.
- `0dce01c7cbe1fda4aaeb5513232eaf4e354a367f` — guard shared color ownership and aliases.
- `3c6ea6124dbcaa71f5690c65059afa7eba06ac5d` — define shared semantic colors.
