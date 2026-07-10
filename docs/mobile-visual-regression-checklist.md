# Mobile Visual Regression Checklist

Use this checklist after member UX/UI changes and before production promotion.

## Target viewports

- iPhone SE: 375 × 667
- iPhone 13/14: 390 × 844
- iPhone 15 Pro Max: 430 × 932
- Android compact: 360 × 800
- Tablet portrait sanity check: 768 × 1024

## Global shell

- Header remains sticky and does not overlap content.
- Logo, brand mark, site name, and description do not overflow.
- Drawer opens and closes without horizontal page movement.
- Body scroll is locked while the drawer is open and restored afterward.
- Bottom navigation respects `env(safe-area-inset-bottom)`.
- Footer remains above the bottom navigation and is fully reachable.
- No duplicate bottom navigation appears on any route.
- Active navigation state matches the current route.

## Authentication and public routes

- `/login` and `/register` fit without horizontal scrolling.
- Keyboard opening does not hide the active field or primary action.
- `/contact` and `/legal/*` open without authentication.
- Authenticated users are redirected away from login/register.
- Logged-out users preserve the intended `next` route.

## Home

- Hero text wraps without pushing the CTA off-screen.
- Quick actions remain readable with 1–8 enabled items.
- Feature flags remove shortcuts without leaving awkward gaps.
- Pending cards fit long amounts, dates, and statuses.
- Game rails scroll horizontally without page-level horizontal scroll.
- Empty, loading, and error states use shared components consistently.
- Popup content fits small screens and the close button remains reachable.

## Money operations

- Deposit and withdrawal forms fit at 360 px width.
- Amount fields remain visible with the numeric keyboard open.
- Slip/image previews preserve aspect ratio.
- Validation messages do not shift controls off-screen.
- Status badges and long reference IDs wrap safely.

## Typography and content stress

- Test long Thai site names and descriptions.
- Test long promotion titles and provider names.
- Test large values such as `9,999,999.99`.
- Test empty values, missing images, and fallback icons.
- Confirm Thai line breaking remains readable.

## Motion and accessibility

- `animation_level=off` disables animation and transitions.
- `animation_level=subtle` avoids continuous pulse effects.
- `animation_level=lively` does not cause layout shift.
- `prefers-reduced-motion` is respected.
- Focus indicators are visible on inputs, buttons, and links.
- Tap targets are at least 44 px high where practical.
- Color contrast remains readable with customized branding colors.

## Route matrix

Check at minimum:

- `/`
- `/games`
- `/deposit`
- `/withdraw`
- `/transactions`
- `/promotions`
- `/bonus`
- `/affiliate`
- `/bank-accounts`
- `/support`
- `/profile`
- `/notifications`
- `/contact`
- `/legal/terms`
- `/legal/privacy`

## Evidence

For every release candidate, capture screenshots for:

1. Home at 390 × 844
2. Drawer open at 390 × 844
3. Deposit form at 375 × 667
4. Transactions with pending items at 390 × 844
5. One public legal page at 390 × 844
6. One empty state and one error state

Record the tested commit SHA and any intentional visual differences in the release notes.
