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

## Mobile home live-data contract (2026-08-01)

- Home and category game cards must expose the central `data-game-*` launch contract. Guests open Login; authenticated members use `POST /member/games/:id/launch` through the shared resolver.
- Mobile catalog requests must send `platform=mobile` and prefer Mobile artwork.
- Popular, most-online, and classic sections come only from `/games/catalog`; tournaments and their leaderboard come from `/games/tournaments` or explicitly configured CMS records.
- Promotion cards come from `/public/promotions`; activities and news come from published Content Center announcements. Every card opens `/browse/promotions/:id` before any claim or external action.
- Missing, failed, or empty APIs render localized states. They must not substitute demo tournaments, players, games, live matches, promotions, activities, or news.
- The Home Screen shortcut uses the owned Web App Manifest and the browser install prompt where available. Android and iOS retain localized manual Add-to-Home-Screen instructions.
- Before release, verify Thai and English at 390 px, 428 px, and 768 px, including Guest Login routing, authenticated launch, category switching, all Highlight tabs, install help, API failure states, and console 404s.
