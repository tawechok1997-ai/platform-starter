# Member Clone Asset Inventory

Source of truth: `https://noah345.shop/home`, supplied screenshots, supplied DOM snippets, and the existing `web-member` asset library.

## Rule

- Use an exact project asset when it exists.
- If the exact asset is still unidentified, show `MISSING ASSET`.
- Never substitute an unrelated image.
- Frontend interaction completion does not mean image completion.

## Correction

The earlier `49 missing assets` figure counted placeholder targets in Clone Preview. It did **not** mean the repository lacked 49 files.

The repository already contains or references a substantial source-matched library, including:

- Header logo, Thai flag, mission icon and menu icons.
- Hero slides and side promotion artwork.
- Three quick-card images and their three background layers.
- Tournament, jackpot, leaderboard, mini-game and section-heading artwork.
- Rank artwork and mobile fallbacks.
- 22 game thumbnails in the reference game catalogue.
- 12 provider logos.
- 17 Thai payment/bank marks.
- Footer licence, security and responsible-gaming marks.
- A complete reference icon sprite used by desktop and mobile components.

The actual problem was that Clone Preview had not been wired to the existing library.

## Wired into Clone Preview

| Area | Current state |
|---|---|
| Home initial hero | Existing source hero image connected |
| Home quick cards | Existing promo/activity/news assets connected |
| Tournament banner | Existing `/reference-v6/tournament.webp` connected |
| Game cards | Eight existing catalogue images connected and repeated by the mock grid |
| Header and sidebar navigation | Existing reference icon sprite connected |
| NOAH345 logo | Existing `/reference-v6/logo.webp` connected |

Asset wiring lives in:

- `apps/web-member/app/clone-preview/clone-preview-assets.css`

## Still requiring exact screen-to-asset mapping

These areas may already have candidate files in the repository, but they are not yet approved or mapped to the correct source state:

- Login artwork.
- Registration artwork.
- Promotions page banner and card variants.
- Activities page banner and card variants.
- News thumbnail/detail variants.
- Deposit instruction artwork for bank, QR Payment, decimal deposit and TrueWallet.
- Bonus card variants.
- Game launch frame/state artwork.
- Promotion detail artwork.
- Mini-game modal artwork and animation states.
- Contact-channel icons.
- Profile/security illustrations and state icons.
- Empty, loading, success and error illustrations.
- Mobile-only screen variants.

## Existing catalogues to reuse

- `apps/web-member/app/components/member-home/v47-asset-map.ts`
- `apps/web-member/app/components/reference-asset-catalog.ts`
- `apps/web-member/app/member-reference-assets.css`
- `apps/web-member/app/member-reference-assets-complete.css`

## Completion gate

An asset can be marked complete only when:

1. The exact file exists in the repository or an approved stable source.
2. It is used in the correct screen and state.
3. Its crop, aspect ratio, size and position match the reference.
4. Desktop and mobile screenshots are compared.
5. Failure does not silently substitute another image.
