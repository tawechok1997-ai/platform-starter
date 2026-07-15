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
- [x] Add keyboard, focus, and ARIA baselines.
- [x] Add reduced-motion and contrast checks.
- [ ] Add six-viewport visual regression.
- [ ] Store screenshot, trace, console, and network artifacts in CI.

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

## Active work

### 16-17. Visual regression and browser evidence

- [ ] Validate Admin and Member public surfaces across six viewports.
- [ ] Compare screenshots against generated baselines.
- [ ] Store runtime screenshots and Playwright traces.
- [ ] Store console and network JSON evidence.
- [ ] Verify CI artifact upload before closure.

## Count

- Total R-013 outcomes: 17
- Closed: 15
- Remaining: 2

## Latest commits

- `34b0fbe5748047fce22e73e85e29e694fb882bd8` — verify accessibility baseline in CI.
- `cd7999083febc7341abb36234b57a436aaf40d46` — guard accessibility, motion, and contrast behavior.
- `7d296aa256b20b18fc96547ca9ce86baad27f665` — load accessibility baseline in Member.
- `8fffe815e7f4034fce591ba2c9a0fef23a466b19` — load accessibility baseline in Admin.
- `aee98a980e01218ef8c345ad9f0387b304dcabd9` — define shared accessibility baseline.
