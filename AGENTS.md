# Platform Starter Agent Operating Contract

This file governs implementation work in this repository. It is the short operational entry point; the linked documents are the detailed source of truth.

## Current execution scope

The active implementation scope is **Member only** (`apps/web-member`). Do not change `apps/web-admin`, Admin components, Admin CSS, Admin routes, or Admin behavior while executing the current UI phase. Admin documents remain linked for future reference, but Member and Admin work must be separate commits/phases.

Full documentation map: [`docs/README.md`](docs/README.md).

## Read before changing UI

1. [`docs/AI_RULES.md`](docs/AI_RULES.md) and [`docs/PROJECT_RULES.md`](docs/PROJECT_RULES.md) — project-wide safety and architecture rules.
2. [`docs/master-project-worklist.md`](docs/master-project-worklist.md) and [`docs/master-worklist.md`](docs/master-worklist.md) — current project and UX/UI backlog.
3. [`docs/UI_DESIGN_REFERENCE.md`](docs/UI_DESIGN_REFERENCE.md) — supplied LUX88/Gaming Fintech visual target.
4. [`docs/UI_MENU_INFORMATION_ARCHITECTURE.md`](docs/UI_MENU_INFORMATION_ARCHITECTURE.md) — canonical route/menu/permission/feature map.
5. [`docs/UI_CONSISTENCY_COMPLETION_PLAN.md`](docs/UI_CONSISTENCY_COMPLETION_PLAN.md) — component, card, copy, state, duplicate-work, priority, and tool plan.
6. [`docs/UI_MOTION_ANIMATION_CONTRACT.md`](docs/UI_MOTION_ANIMATION_CONTRACT.md) — motion tokens, approved patterns, reduced-motion, and performance rules.
7. [`docs/MEMBER_UI_PRODUCT_BRIEF.md`](docs/MEMBER_UI_PRODUCT_BRIEF.md) — current Member-only hierarchy, page order, card rules, copy, responsive layout, and motion brief.
8. [`docs/MEMBER_TYPOGRAPHY_CONTRACT.md`](docs/MEMBER_TYPOGRAPHY_CONTRACT.md) — Thai/English font roles, numeric treatment, loading, and typography QA.
9. [`docs/MEMBER_COLOR_ICON_CONTRACT.md`](docs/MEMBER_COLOR_ICON_CONTRACT.md) — dark palette, semantic color states, depth, borders, shadows, glow, and Lucide icon rules.
10. [`docs/MEMBER_UX_UI_TOOLING.md`](docs/MEMBER_UX_UI_TOOLING.md) — current route-specific acceptance criteria.
11. [`docs/MEMBER_ROUTE_MATRIX.md`](docs/MEMBER_ROUTE_MATRIX.md) and [`docs/ux-regression-matrix-finance-operations.md`](docs/ux-regression-matrix-finance-operations.md) — route ownership and regression states.

When documents conflict, preserve financial/security/architecture rules first, then the canonical menu and consistency contracts, then route-specific polish. Update the source-of-truth document when resolving a conflict; do not silently create a third rule.

## Working rules

- Keep `apps/web-member`, `apps/web-admin`, API, database, and shared packages separated by ownership and contracts.
- Inspect existing routes, components, tokens, API contracts, and tests before editing. Search with `rg`/`rg --files`.
- Reuse the canonical menu, card, button, badge, formatter, state, icon, and token systems. Add a variant before adding a new component; add a dependency only with an ADR.
- Never duplicate route definitions, API mappings, status labels, query ownership, or feature-flag logic across pages.
- Keep copy short and action-oriented. Follow the copy budgets in `UI_CONSISTENCY_COMPLETION_PLAN.md`.
- Use `apply_patch` for source edits. Preserve unrelated user changes. Do not use destructive reset/checkout commands.
- Keep Member and Admin completely separated during this phase; do not “share” a visual change by editing Admin files. Shared API/design-token changes require explicit scope review.
- Financial, identity, session, permission, storage, and audit changes require explicit tests and rollback/evidence notes.

## UI implementation loop

1. Define the target route, user flow, owner, priority, API readiness, and reference board.
2. Identify duplicate components/menu paths and write the intended canonical source before refactoring.
3. Make the smallest shared-component/token change that solves the pattern.
4. Implement loading, empty, error, partial, offline, stale, maintenance, permission, success, retry, conflict, and session-expired states.
5. Add keyboard/focus/reduced-motion behavior and short copy before visual polish.
6. Validate with typecheck, lint, unit tests, route audit, production build, and format checks.
7. Validate rendered behavior with Browser when available; otherwise use the repository Playwright workflow and record the fallback reason. Capture desktop and mobile screenshots, console/network health, and at least one interaction proof.
8. Keep a mismatch ledger: reference expectation, rendered result, intentional deviation or fix, and evidence path.
9. Update the relevant worklist/evidence log with implementation status, owner, commit SHA, remaining risk, and rollback note.
10. Commit intentionally, verify the branch is based on current `main`, and push only after all relevant checks pass.

## Tool and skill routing

| Need                                            | Required route                                                                   |
| ----------------------------------------------- | -------------------------------------------------------------------------------- |
| Repository inventory and duplicate search       | `rg`, route audit scripts, TypeScript inspection                                 |
| React/Next implementation or refactor           | `build-web-apps:react-best-practices`                                            |
| Rendered UI debugging, responsive and visual QA | `build-web-apps:frontend-testing-debugging`                                      |
| Browser interaction and screenshots             | Browser plugin if available; otherwise Playwright with documented fallback       |
| Accessibility                                   | `@axe-core/playwright`, JSX a11y ESLint, keyboard/focus checks                   |
| Design tokens and shared primitives             | `packages/design-tokens`, existing Member/Admin primitives                       |
| Animation                                       | CSS motion tokens first; `motion`/Framer Motion only after measured need and ADR |
| Performance                                     | `@next/bundle-analyzer`, stable staging Lighthouse CI, React render review       |
| Source publication                              | repository GitHub workflow/connector; verify fast-forward `main`                 |

## Animation rules

- Use existing `instant` 80ms, `fast` 160ms, `normal` 240ms, `slow` 360ms motion tokens.
- Prefer transform/opacity and short feedback. Do not animate money/security copy, block actions until animation ends, or add decorative infinite loops.
- Every animation needs purpose, reduced-motion fallback, performance check, and visual evidence.
- Read [`docs/UI_MOTION_ANIMATION_CONTRACT.md`](docs/UI_MOTION_ANIMATION_CONTRACT.md) before adding or changing motion.

## Definition of done

A UI task is complete only when:

- canonical route/menu/component/state/copy ownership is clear;
- no duplicate or dead visible action remains;
- desktop and mobile match the reference composition at required viewports;
- all relevant states, accessibility, reduced motion, and keyboard behavior are implemented;
- tests/build/lint/format/route audit pass;
- rendered screenshot/interaction evidence and mismatch notes are retained;
- worklists and evidence logs are updated with commit and remaining risk.

## Stop conditions

Stop and ask for direction when a change would require production credentials, destructive data operations, a new external dependency without an ADR, a financial/security contract change without an owner, or a visual deviation that materially changes the supplied reference.
