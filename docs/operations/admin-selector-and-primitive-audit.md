# Admin Selector and Primitive Audit

Updated: 2026-07-21  
Status: Code implementation complete; verification pending  
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

The richer route compatibility facade is exported from:

- `apps/web-admin/app/(admin)/_components/admin-ui.tsx`

It owns route-level composition that the shell does not provide:

- page, card, metric, grid and stack surfaces;
- toolbar and filter bar;
- notice, empty and skeleton states;
- route button, icon button and link button adapters;
- badge, code and data-value presentation;
- pagination and confirm dialog;
- command panel and action strip.

The protected-shell primitive core is exported from:

- `apps/web-admin/app/components/admin-ui.tsx`

It owns native shell interaction and protected-layout compatibility:

- native button and link attributes;
- shared tone-to-class mapping;
- forwarded button and anchor refs;
- shell card, notice and empty-state composition.

The two files are no longer treated as interchangeable duplicate families. They are documented layers with separate consumers and responsibilities. The route facade remains intentionally compatible while the protected shell keeps the smaller native contract.

## Consolidation completed

The protected-shell `AdminButton` and `AdminLinkButton` previously assembled tone, shared primitive and compatibility classes independently. They now use one exported `adminButtonClassName` contract.

Both shell primitives use `forwardRef`, preserving native button and anchor props while allowing focus ownership to move through the primitive instead of requiring raw interactive elements.

Compatibility styles remain loaded. This is deliberate: deleting them is a browser-evidence decision, not unfinished code consolidation.

No alias is removed merely because another file has a similar export name. Removal requires its final consumer to migrate and browser evidence to confirm behavior.

## Component contract coverage

`apps/web-admin/src/features/admin-redesign/admin-primitives.spec.ts` protects the current primitive boundaries without adding another test dependency.

The tests assert:

- required route primitive exports remain available;
- buttons and icon buttons retain accessible-name wiring;
- confirm dialogs retain `alertdialog`, modal labelling, Escape handling and initial focus behavior;
- shell buttons and shell link buttons use one shared class-composition contract and forward refs;
- loading and feedback primitives retain status and alert semantics;
- audited Admin primitive and overlay files do not reintroduce selectors coupled to serialized inline style text.

These tests run through the existing `node:test` and `tsx` command used by `pnpm --filter @platform/web-admin test`. Rendered browser and focus-restoration evidence remains a separate quality gate.

## Acceptance status

- [x] Drawer overlay selectors no longer depend on inline style text.
- [x] Responsive row selectors no longer depend on inline style text.
- [x] Primitive ownership and consumer boundaries documented.
- [x] All known inline-style text selectors removed from the audited Admin files.
- [x] Route and shell primitive responsibilities classified.
- [x] Component contract tests added before compatibility deletion.
- [x] Shell button and link class composition consolidated.
- [x] Shell interactive primitives forward refs through the compatibility boundary.
- [x] Duplicate-family ambiguity resolved into shell core and route compatibility facade ownership.

## Verification still required

Code implementation is complete, but the following evidence is still required before the PR can leave draft status:

- Admin unit tests and typecheck;
- Admin production build and analyzer output;
- loading, error and not-found browser evidence;
- visual and accessibility evidence;
- authenticated console and network-failure evidence.

See [`admin-ci-acceptance-matrix.md`](./admin-ci-acceptance-matrix.md).

## Safety notes

- No API, Prisma, Member, wallet, provider or permission behavior changed.
- No runtime or test dependency added.
- No compatibility file deleted.
- Existing shell and route imports remain valid.
- Browser and build verification remain required before closing the related quality-gate items.
