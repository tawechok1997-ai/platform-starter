# Admin Final Release Gate

สถานะเอกสาร: ใช้เป็นเกณฑ์ก่อนประกาศว่า Admin UI พร้อมใช้งานจริง

## Code-level safeguards applied

- [x] Global horizontal overflow guard
- [x] Minimum 44px touch targets for primary controls
- [x] Visible keyboard focus across links, buttons, form controls, summary and tabindex elements
- [x] Mobile input font size guard to prevent iOS auto zoom
- [x] Safe-area bottom spacing
- [x] Responsive table scroll containers with touch momentum
- [x] Dialog viewport and dynamic-height constraints
- [x] Long IDs, code and payload wrapping
- [x] Tabular numerals for financial tables
- [x] Reduced-motion fallback
- [x] Forced-colors focus fallback
- [x] Deferred rendering for long card surfaces via content-visibility

Implemented by:

- `apps/web-admin/app/admin-final-audit.css`
- imported from `apps/web-admin/app/layout.tsx`

## Required build gate

Run from repository root:

```bash
pnpm --filter @platform/web-admin typecheck
pnpm --filter @platform/web-admin build
```

The release is blocked when either command fails.

## Browser verification matrix

Verify the deployed Admin application at these widths:

| Width | Target | Required checks |
|---:|---|---|
| 320px | narrow mobile | no page overflow, actions remain reachable, fields do not zoom |
| 360px | Android mobile | cards, filters and dialogs fit the viewport |
| 390–430px | modern iPhone | safe-area spacing, tables scroll inside their container |
| 768px | tablet portrait | grids collapse without clipped content |
| 1024px | tablet landscape | navigation and data panels remain stable |
| 1440px | desktop | content width, card density and charts remain balanced |

## Core route smoke test

- `/dashboard`
- `/members`
- `/wallets`
- `/ledgers`
- `/withdrawals`
- `/wallet-statement`
- `/wallet-analytics`
- `/reconciliation-center`
- `/promotion-center`
- `/promotion-claims`
- `/risk-operations`
- `/risk-alerts`
- `/reports`
- `/settings`

For each route verify:

- keyboard-only navigation
- visible focus order
- loading, empty and error states
- no duplicate requests after repeated actions
- disabled actions cannot be triggered
- long IDs and translated labels do not break layout
- dialogs close correctly and remain inside the viewport

## Performance checks

- Confirm long pages render without large scroll jank.
- Confirm charts and lists do not recalculate excessively during interaction.
- Confirm images reserve dimensions and do not cause major layout shifts.
- Confirm repeated filter changes do not leave stale results visible.
- Confirm production bundles contain no development-only tooling.

## Honest completion rule

Code-level audit can be marked complete after build passes. Full Final QA is complete only after the deployed browser matrix above has been executed and defects have been recorded or fixed.
