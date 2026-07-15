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
- Verification-only PR #34 ran workflow `R-013 UI System`, run `29396310025`, job `87290494428` successfully.

### 5. Consolidate spacing, radius, and shadow tokens

- Added `packages/design-tokens/shape-space-shadow.css` with shared spacing, radius, and shadow scales.
- Admin and Member layouts load the same shared source and retain legacy aliases.
- Added `tools/audit-r013-shape-space-shadow-contract.mjs` and retained frontend typecheck logs.
- Fixed the R-012 deposit server-state regression by restoring `/member/topups` and `/member/receiving-bank-accounts` endpoints.
- Verification-only PR #36 ran workflow `R-013 UI System`, run `29397572019`, job `87294445965` successfully.

### 6. Consolidate typography, motion, breakpoint, and z-index tokens

- Added `packages/design-tokens/type-motion-layout.css`.
- Defined shared font families, type scale, line heights, font weights, motion durations, easing curves, breakpoint values, and ordered z-index layers.
- Added `tools/audit-r013-type-motion-layout-contract.mjs`.
- Verification-only PR #38 ran workflow `R-013 UI System`, run `29398823758`, job `87298416792` successfully.

### 7. Consolidate Button, Input, Select, and TextArea primitives

- Added `packages/design-tokens/form-controls.css` with shared control classes and state contracts.
- Migrated Admin and Member login forms while retaining page-specific classes for visual compatibility.
- Added `tools/audit-r013-form-control-primitives.mjs`.
- Verification-only PR #40 ran workflow `R-013 UI System`, run `29399593281`, job `87300852584` successfully.

### 8. Consolidate Modal, Drawer, and ConfirmDialog primitives

- Added `packages/design-tokens/overlays.css` with shared backdrop, modal, confirm-dialog, drawer, header, body, and action contracts.
- Migrated the Member navigation drawer and finance confirmation dialog.
- Retained Escape handling, body scroll lock, focus trap, focus restoration, backdrop dismissal, and ARIA dialog semantics.
- Added `tools/audit-r013-overlay-primitives.mjs`.
- Verification-only PR #42 ran workflow `R-013 UI System`, run `29400995313`, job `87305269010` successfully.

### 9. Consolidate Table, Pagination, Tabs, and Badge primitives

- Added `packages/design-tokens/data-display.css` with shared table, pagination, tabs, and badge contracts.
- Added responsive table-to-card behavior through `data-mobile="cards"` and `data-label`.
- Existing Admin `.admin-ui-badge` and Member `.finance-status` usages are compatibility targets of the shared source.
- Added `tools/audit-r013-data-display-primitives.mjs`.

### 10. Consolidate Toast, Alert, Skeleton, EmptyState, and ErrorState primitives

- Added `packages/design-tokens/feedback.css` with shared feedback and async-state primitives.
- Existing Admin notices, empty states, skeletons, Member notices, and finance empty states are compatibility targets.
- Added mobile toast placement, shared toast z-index ownership, and reduced-motion skeleton behavior.
- Added `tools/audit-r013-feedback-primitives.mjs`.
- Verification-only PR #44 ran workflow `R-013 UI System`, run `29402044366`, job `87308629588`.
- All primitive guards, artifact upload, Admin typecheck, and Member typecheck completed successfully.

## Active work

### 11-13. Responsive consolidation and transformation patterns

- [ ] Centralize repeated container, stack, grid, safe-area, and visibility rules.
- [ ] Document and enforce a mobile-first responsive strategy.
- [ ] Verify table-to-card, modal-to-bottom-sheet, and sidebar-to-drawer patterns.
- [ ] Add responsive contract guards and frontend verification.

## Initial findings

- Shared primitive ownership is centralized through outcome 10, while feature-level migration remains incremental.
- Responsive rules are still distributed across application-specific CSS files.
- Existing reduced-motion CSS is present, but contrast, focus, keyboard, and ARIA evidence are not yet centralized.

## Count

- Total R-013 outcomes: 17
- Closed: 10
- Remaining: 7

## Latest commits

- `8c12dffff5e707476de1945ab278bc39a23039fc` — verify shared feedback primitives in CI.
- `865431fe2883023caef103e75f31106daab2c91c` — guard shared feedback primitives.
- `37aebc1e2bec0bbea6f872a8be12ecbe09916fd5` — define shared feedback primitives.
- `9df37d0955b9b34faf753b82bbba73e530ee7ff4` — verify shared data-display primitives in CI.
- `0ce0d118a646b18165eac08e182da458112e7cb6` — define shared data-display primitives.
