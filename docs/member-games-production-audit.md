# Member Games Production Audit

## Functional

- [ ] Lobby API loads first page without duplicate cards.
- [ ] Platform, provider, category, search, favorites, and reset filters work together.
- [ ] Infinite scroll loads one page per sentinel intersection.
- [ ] Manual load-more remains usable when IntersectionObserver is unavailable.
- [ ] Catalog-only games never call the launch endpoint.
- [ ] Launch failures remain visible and do not erase the current catalog.
- [ ] Recently played persists the full game record and survives page reload.
- [ ] Provider selection updates both provider lobby state and catalog results.
- [ ] Game detail dialog closes by close button, backdrop, and Escape.
- [ ] Opening a dialog locks body scrolling and restores it after close.

## Responsive

- [ ] 320 px: no horizontal page overflow.
- [ ] 360 px: game cards and toolbar remain usable.
- [ ] 390–430 px: iPhone safe-area spacing does not cover actions.
- [ ] 768 px: provider cards and game detail dialog switch layouts correctly.
- [ ] 1024 px: catalog grid has no unstable column jumps.
- [ ] 1440 px: content remains within the configured maximum width.

## Images and loading

- [ ] Broken provider logos render initials.
- [ ] Broken game covers render game initials.
- [ ] Lazy images reserve their final aspect ratio.
- [ ] Skeletons do not cause major cumulative layout shift.
- [ ] Background images do not expose invalid CSS URLs.

## Accessibility

- [ ] Keyboard focus is visible for tabs, cards, dialog controls, and load more.
- [ ] Active filters expose `aria-pressed`.
- [ ] Loading states expose `aria-busy` where appropriate.
- [ ] Dialog has `role="dialog"`, `aria-modal`, and a labelled title.
- [ ] Reduced-motion mode removes nonessential animation.
- [ ] Text and controls meet contrast requirements.

## Performance

- [ ] First catalog request is not repeated during hydration.
- [ ] Filter changes cancel stale UI updates.
- [ ] Infinite scroll cannot increment multiple pages while one request is pending.
- [ ] Large provider and game lists do not create unbounded localStorage entries.
- [ ] Production bundle contains no remote development-only tooling.

## Release gate

Run before marking Member Games complete:

```bash
pnpm --filter @platform/web-member typecheck
pnpm --filter @platform/web-member build
```

Then verify the deployed `/games` page on one desktop viewport and at least two mobile widths.