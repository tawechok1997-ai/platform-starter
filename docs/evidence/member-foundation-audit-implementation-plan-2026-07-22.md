# Member foundation implementation plan — 2026-07-22

## Batch 1: Component and duplicate inventory

- List shared Member components by canonical family.
- Record owners and route consumers.
- Identify duplicate variants and proposed replacement targets.
- Avoid runtime changes in the inventory PR.

## Batch 2: Inline style migration

- Produce exact occurrence counts from the current branch.
- Group occurrences by route family.
- Replace static inline styles with semantic classes or validated CSS custom properties.
- Remove `[style*="..."]` selectors as each owning route is migrated.

## Batch 3: Navigation normalization

- Implement one canonical menu model.
- Align Desktop, Drawer, Mobile, quick actions and category navigation.
- Add route, alias, active-state, feature-flag and permission tests.

## Batch 4: Shared controls and feedback

- Consolidate form controls and field semantics.
- Consolidate loading, empty, error, success, toast and offline states.
- Add component tests before route migration.

## Batch 5: Finance and upload contracts

- Implement one typed finance-state presentation mapping.
- Implement shared upload validation, preview, progress, cancel, retry and secure-download feedback.
- Require focused contract tests for money and identity flows.

## Batch 6: Browser evidence

- Run all six viewports.
- Retain screenshots, traces, console/network evidence and axe reports.
- Cover authenticated routes and required loading/error/offline/session states.
