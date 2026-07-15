# R-013 Progress

Status: ✅ DONE

Started: 2026-07-15
Closed: 2026-07-15

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
- [x] Add keyboard, focus, and ARIA baselines.
- [x] Add reduced-motion and contrast checks.
- [x] Add six-viewport visual regression.
- [x] Store screenshot, trace, console, and network artifacts in CI.

## Closed outcomes

### 3-13. Shared tokens, primitives, and responsive system

- Centralized design tokens and shared UI contracts in `packages/design-tokens`.
- Added guarded form, overlay, data-display, feedback, and responsive transformation patterns.
- Verification PRs #32, #34, #36, #38, #40, #42, #44, and #46 completed successfully.

### 14. Keyboard, focus, and ARIA baseline

- Added `packages/design-tokens/accessibility.css`.
- Centralized `focus-visible`, invalid-field, screen-reader-only, skip-link, disabled-control, and forced-colors behavior.
- Guarded Member drawer dialog semantics, Escape handling, finance focus trap/restore, labelled confirmation dialogs, and invalid login fields.

### 15. Reduced-motion and contrast checks

- Enforced a shared `prefers-reduced-motion` fallback across animations, transitions, and smooth scrolling.
- Added automated WCAG contrast calculations for primary text/canvas and inverse text/brand token pairs.
- Added `tools/audit-r013-accessibility-baseline.mjs` and wired it into `.github/workflows/r013-ui-system.yml`.
- Verification-only PR #48 ran workflow `R-013 UI System`, run `29404594856`, job `87316876420`.
- Accessibility guard, artifact upload, Admin typecheck, and Member typecheck completed successfully.

### 16-17. Visual regression and browser evidence

- Validated Admin and Member public authentication surfaces across six viewports: 360x800, 390x844, 430x932, 768x1024, 1024x768, and 1440x900.
- Generated and compared visual baselines successfully.
- Stored runtime screenshots, Playwright traces, console JSON, network JSON, layout evidence, and the HTML report.
- Fixed the legacy public visual suite to target the Member dev server at `http://127.0.0.1:3101` instead of the unused port 3000.
- Verification-only PR #53 ran workflow `R-013 Visual Regression`, run `29410964202`, job `87337677191`.
- Contract validation, Chromium setup, baseline generation, screenshot comparison, and artifact upload completed successfully.

## Count

- Total R-013 outcomes: 17
- Closed: 17
- Remaining: 0

## Latest commits

- `e3e01c043778299159cec2b5cbb076df42da1617` — target the Member visual suite at port 3101.
- `d475046d2668f76a73fcbf6650839554533d0b0c` — require retained trace evidence in the visual contract.
- `f8e15792e3a53da41e82c0c30ad6cd218825e519` — fix visual contract syntax and checks.
- `34b0fbe5748047fce22e73e85e29e694fb882bd8` — verify accessibility baseline in CI.
