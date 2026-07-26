# Member Clone Asset Inventory

Source of truth: `https://noah345.shop/home`, supplied screenshots, and supplied DOM snippets.

## Rule

- Use an exact project asset when it exists.
- If the exact asset is missing, show `MISSING ASSET`.
- Never substitute an unrelated image.
- Frontend interaction completion does not mean image completion.

## Current status

The Clone Preview has the shell, navigation, mock state, forms, modal flows, and button behavior. Exact image work is still incomplete.

### Image slots still missing

| Area | Minimum exact assets still needed | Current preview state |
|---|---:|---|
| Home hero promotion slider | 10 | `MISSING ASSET` |
| Home quick cards | 3 | `MISSING ASSET` |
| Tournament banner | 1 | `MISSING ASSET` |
| Login artwork | 1 | `MISSING ASSET` |
| Registration artwork | 1 | `MISSING ASSET` |
| Game thumbnails used by current preview | 8 unique | `MISSING ASSET` |
| Promotions page | 1 banner + 6 cards | `MISSING ASSET` |
| Activities page | 1 banner + 6 cards | `MISSING ASSET` |
| Deposit instruction states | 4 | `MISSING ASSET` |
| Bonus cards | 4 | `MISSING ASSET` |
| Game launch modal/frame | 1 | `MISSING ASSET` |
| Promotion detail modal | 1 | `MISSING ASSET` |
| Mini-game modal | 1 | `MISSING ASSET` |

Minimum exact image assets represented by current placeholders: **49 unique asset targets**.

The current screens render more visible image slots than 49 because game cards are reused in multiple places.

### Visual assets not yet modeled as explicit placeholders

These areas also need exact source-matched image/icon work before a 100% claim is possible:

- Header and navigation icons
- News thumbnails/details, if present in the accepted source state
- Provider/partner logo rows
- Footer licence, security, responsible-gaming, payment and bank marks
- Contact-channel icons
- Profile/security illustrations or icons
- Empty, loading, success and error illustrations where the source uses them
- Mobile-only icons, banners and bottom-navigation assets

## Already present

- NOAH345 logo at `/reference-v6/logo.webp`
- Missing-asset component and visible fallback treatment
- Layout containers for every current preview image area

## Completion gate

An asset can be marked complete only when:

1. The exact file exists in the repository or an approved stable source.
2. It is used in the correct screen and state.
3. Its crop, aspect ratio, size and position match the reference.
4. Desktop and mobile screenshots are compared.
5. Failure does not silently substitute another image.
