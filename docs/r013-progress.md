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

### 8. Consolidate Modal, Drawer, and ConfirmDialog primitives

- Added `packages/design-tokens/overlays.css` with shared backdrop, modal, confirm-dialog, drawer, header, body, and action contracts.
- Admin and Member layouts load the shared source.
- Migrated the Member navigation drawer and finance confirmation dialog while preserving existing visual classes.
- Retained Escape handling, body scroll lock, focus trap, focus restoration, backdrop dismissal, and ARIA dialog semantics.
- Added `tools/audit-r013-overlay-primitives.mjs` and wired it into the R-013 workflow.
- Verification-only PR #42 ran workflow `R-013 UI System`, run `29400995313`, job `87305269010`.
- All primitive guards, artifact upload, Admin typecheck, and Member typecheck completed successfully.

## Active work

### 9. Consolidate Table, Pagination, Tabs, and Badge primitives

- [ ] Inventory repeated data-display and navigation patterns.
- [ ] Define shared table, pagination, tabs, and badge contracts.
- [ ] Migrate representative Admin and Member usages.
- [ ] Add semantic and frontend verification guards.

## Initial findings

- Shared design tokens, form controls, and overlay primitives are centralized, while feature-level migration remains incremental.
- Data-display patterns remain distributed across Admin and Member.
- Existing reduced-motion CSS is present, but contrast, focus, keyboard, and ARIA evidence are not yet centralized.

## Count

- Total R-013 outcomes: 17
- Closed: 8
- Remaining: 9

## Latest commits

- `bbd97e0c5d6ba3cd4c0d1f47a8b25e20dcccc54c` — verify overlay primitives in CI.
- `cca8a1a3e4af1aa1a27ca43dad15035608f7546a` — guard overlay primitive semantics and behavior.
- `8511dd86ac07f10d9b8ad77179fffc8bf2993e81` — migrate finance confirmation dialog.
- `c0cb88351fb3fb01629c3c716ee11e10a96e2164` — restore the Member fishing category label after overlay migration.
- `4d19d73c47a78c59141e9c7b6d4c7b086ac7f462` — define shared overlay primitives.
