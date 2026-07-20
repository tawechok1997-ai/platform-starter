# Admin CSS Ownership Inventory

Updated: 2026-07-21  
Status: Active inventory  
Scope: `apps/web-admin/app` root stylesheet imports  
Owner: Admin UI foundation

## Purpose

Provide one ownership and migration map for every stylesheet loaded by the Admin root layout. This prevents parallel work from editing the same compatibility layer, deleting selectors without browser evidence, or adding another catch-all polish file.

## Classification rules

- **Shared token**: reusable design contract outside Admin feature ownership.
- **Foundation**: Admin-wide reset, language, shell, responsive, accessibility, or application-state behavior.
- **Primitive**: reusable control, overlay, feedback, or data-display component styling.
- **Feature**: owned by one route group or operational domain.
- **Compatibility**: temporary overrides that must not receive new product styling.
- **Consolidation candidate**: overlapping late-stage stylesheet that requires selector and visual-diff review before removal.

## Root import inventory

### Shared tokens and primitives

| Stylesheet | Class | Owner | Rule |
|---|---|---|---|
| `packages/design-tokens/colors.css` | Shared token | Design tokens | Semantic colors only |
| `packages/design-tokens/shape-space-shadow.css` | Shared token | Design tokens | Radius, spacing and shadow only |
| `packages/design-tokens/type-motion-layout.css` | Shared token | Design tokens | Typography, motion and layout tokens only |
| `packages/design-tokens/form-controls.css` | Primitive | UI core | Shared form-control contracts |
| `packages/design-tokens/overlays.css` | Primitive | UI core | Modal/drawer/popover contracts |
| `packages/design-tokens/data-display.css` | Primitive | UI core | Tables, badges and data presentation |
| `packages/design-tokens/feedback.css` | Primitive | UI core | Alert, toast, skeleton and state feedback |
| `packages/design-tokens/responsive-layout.css` | Foundation | UI core | Cross-surface responsive utilities |
| `packages/design-tokens/accessibility.css` | Foundation | UI core | Focus, reduced motion, forced colors and screen-reader utilities |
| `packages/ui-core/src/styles.css` | Primitive | UI core | Shared React primitive styling |

### Admin foundation and shell

| Stylesheet | Class | Owner | Migration direction |
|---|---|---|---|
| `globals.css` | Foundation | Admin foundation | Keep global reset and variables; move feature selectors out |
| `admin-system.css` | Foundation | Admin foundation | Canonical Admin semantic layer |
| `admin-mobile.css` | Foundation | Admin responsive | Consolidate general mobile rules here |
| `admin-desktop.css` | Foundation | Admin responsive | Consolidate general desktop rules here |
| `admin-dashboard-responsive.css` | Feature | Dashboard | Keep dashboard-only responsive behavior |
| `admin-operations-responsive.css` | Feature | Operations | Keep operations-only responsive behavior |
| `admin-drawer-left.css` | Primitive | Admin shell | Drawer geometry and interaction only |
| `admin-color-aliases.css` | Compatibility | Admin foundation | Freeze; migrate aliases to semantic tokens |
| `admin-ui.css` | Foundation | Admin foundation | Audit overlap with `admin-system.css` |
| `admin-enterprise-shell.css` | Foundation | Admin shell | Canonical sidebar/topbar/content shell |
| `admin-topbar-profile.css` | Feature | Admin shell | Topbar profile surface only |
| `admin-language-system.css` | Foundation | Admin foundation | Thai/Latin hierarchy and numeric rules |
| `admin-app-states.css` | Primitive | Admin foundation | Root loading/error/not-found states |

### Admin feature styles

| Stylesheet | Owner |
|---|---|
| `admin-profile.css` | Profile |
| `admin-profile-edit.css` | Profile |
| `admin-accounts.css` | Accounts |
| `admin-member-insights.css` | Members |
| `admin-data-table.css` | Shared Admin data view |
| `admin-bulk-action.css` | Shared Admin data view |
| `admin-confirm-dialog.css` | Shared Admin mutation UI |
| `admin-chart-polish.css` | Analytics and reports |
| `admin-wallet-history.css` | Wallet operations |
| `admin-wallet-batch.css` | Wallet operations |
| `admin-wallet-insights.css` | Wallet analytics |
| `admin-promotion-operations.css` | Promotions |
| `admin-risk-operations.css` | Risk |
| `admin-reports-ux.css` | Reports |
| `support-center.css` | Support |

### Compatibility and consolidation candidates

The following files are frozen for new product styling until selector ownership and six-viewport evidence are available:

- `admin-shell-overlay-fix.css`
- `admin-professional-polish.css`
- `admin-module-cleanup.css`
- `admin-mobile-audit-polish.css`
- `admin-button-contrast.css`
- `admin-ui-refactor-polish.css`
- `admin-final-audit.css`

These names indicate late-stage override layers rather than durable ownership. They may still contain required fixes, so they must not be deleted by filename alone. Humanity has tried that approach with legacy systems before. It did not go well.

## Parallel editing boundaries

- Foundation work may edit `globals.css`, `admin-system.css`, language, shell and responsive files only.
- Data-view work owns `admin-data-table.css` and `admin-bulk-action.css`.
- Domain work edits only its listed feature stylesheets.
- Compatibility files require a dedicated consolidation commit and visual evidence.
- Shared token files require both Admin and Member impact review even while Member implementation is paused.

## Consolidation sequence

1. Search every compatibility selector and identify its rendered routes.
2. Move valid rules into the owning foundation, primitive or feature stylesheet.
3. Add or update component/browser coverage.
4. Compare all six viewports and reduced-motion mode.
5. Remove the migrated selector from the compatibility file.
6. Delete a compatibility file only after it becomes empty and its import is removed in the same commit.

## Acceptance evidence

- Admin lint, test, typecheck and production build pass.
- No unexpected console or network errors on authenticated routes.
- Six-viewport visual diffs are approved for every affected route.
- Keyboard focus, 200% zoom and reduced-motion behavior remain correct.
- The root layout import order remains documented and deterministic.
