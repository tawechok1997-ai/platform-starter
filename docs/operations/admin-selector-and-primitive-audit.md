# Admin Selector and Primitive Audit

Updated: 2026-07-21  
Status: Active implementation audit  
Scope: `apps/web-admin`

## Purpose

Record the selector debt and primitive ownership evidence required before compatibility CSS or duplicate UI variants are removed.

## Inline-style selector findings

### Fixed

`apps/web-admin/app/admin-shell-overlay-fix.css` previously selected the mobile drawer wrapper through fragments of its serialized inline style:

- `div[style*="position: fixed"]`

The selector was used for the wrapper, backdrop and drawer descendants. It is now based on the existing semantic structure:

- `.admin-shell > div:has(> .admin-drawer-backdrop)`

This removes dependence on React style serialization, whitespace and property ordering without changing the drawer markup or runtime behavior.

`apps/web-admin/app/(admin)/_components/admin-ui.tsx` previously selected right-aligned row children through serialized inline text:

- `.admin-ui-row > [style*="text-align: right"]`
- `.admin-ui-section-row > [style*="text-align: right"]`

The responsive rule now targets row children structurally:

- `.admin-ui-row > *`
- `.admin-ui-section-row > *`

At the mobile breakpoint the row layout is already column-based, so normalizing child alignment to the left preserves the intended stacked presentation without depending on style-string serialization.

### Remaining

No known selector in the audited Admin compatibility and primitive files depends on serialized inline style text.

Future compatibility edits must not introduce attribute selectors against `style` text. Use semantic classes, component props, data attributes or stable structural selectors instead.

## Primitive ownership findings

The canonical Batch 1 route primitives are exported from:

- `apps/web-admin/app/(admin)/_components/admin-ui.tsx`

Current canonical route exports include:

- page, card, metric, grid and stack surfaces;
- toolbar and filter bar;
- notice, empty and skeleton states;
- button, icon button and link button;
- badge, code and data-value presentation;
- pagination and confirm dialog;
- command panel and action strip.

A second Admin primitive family exists at:

- `apps/web-admin/app/components/admin-ui.tsx`

It is consumed by the protected Admin layout and remains the shell compatibility boundary.

### Shell primitive consolidation completed

The protected-shell `AdminButton` and `AdminLinkButton` previously assembled tone, shared primitive and compatibility classes independently. They now use one exported `adminButtonClassName` contract.

Both shell primitives now use `forwardRef`, preserving native button and anchor props while allowing focus ownership to move through the primitive instead of requiring raw interactive elements.

This is the first low-risk consolidation slice. It does not delete the shell compatibility family or claim that the richer route family has already migrated.

## Component contract coverage

`apps/web-admin/src/features/admin-redesign/admin-primitives.spec.ts` protects the current primitive boundaries without adding another test dependency.

The tests assert:

- required route primitive exports remain available;
- buttons and icon buttons retain accessible-name wiring;
- confirm dialogs retain `alertdialog`, modal labelling, Escape handling and initial focus behavior;
- shell buttons and shell link buttons use one shared class-composition contract and forward refs;
- loading and feedback primitives retain status and alert semantics;
- audited Admin primitive and overlay files do not reintroduce selectors coupled to serialized inline style text.

These tests run through the existing `node:test` and `tsx` command used by `pnpm --filter @platform/web-admin test`. Rendered browser and focus-trap evidence remains a separate quality gate.

## Safe consolidation order

1. Enumerate imports from both primitive families.
2. Classify API differences and route ownership.
3. Keep component contract tests passing while adding rendered browser evidence.
4. Migrate one low-risk primitive at a time.
5. Retain compatibility aliases until all imports and browser evidence are complete.
6. Remove an alias only in the same commit that removes its final consumer.

## Acceptance status

- [x] Drawer overlay selectors no longer depend on inline style text.
- [x] Responsive row selectors no longer depend on inline style text.
- [x] Canonical primitive families and the consolidation boundary are documented.
- [x] All known inline-style text selectors removed from the audited Admin files.
- [ ] Primitive imports enumerated route by route.
- [x] Component contract tests added before compatibility deletion.
- [x] Shell button and link class composition consolidated.
- [x] Shell interactive primitives forward refs through the compatibility boundary.
- [ ] Route and shell duplicate primitive families fully consolidated.

## Safety notes

- No API, Prisma, Member, wallet, provider or permission behavior changed.
- No runtime or test dependency added.
- No compatibility file deleted.
- Existing shell imports remain valid.
- Browser and build verification remain required before closing the related consolidation and quality-gate items.
