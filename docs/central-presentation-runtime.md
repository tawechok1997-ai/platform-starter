# Central Presentation Runtime

This branch centralizes presentation data used by Desktop and Mobile Member surfaces.

## Runtime ownership

- Shared CMS assets and UI icons are the default source for both PC and Mobile.
- PC and Mobile overrides are optional and only win when explicitly configured.
- Game and provider presentation metadata is resolved by the public game catalog API.
- Presentation demo data fills empty promotional, tournament, leaderboard, mini-game, live, and FAQ surfaces without writing finance or wallet records.
- Featured games remain controlled by the existing Game Control `isFeatured` flag.

## Admin ownership

- `/game-control` controls game status, Featured, Popular, and New flags.
- `/game-assets` controls shared and platform-specific game/provider images.
- `/settings/features` controls presentation demo mode and homepage feature visibility.
- `/content-center` remains the CMS and asset-library owner for general website media.

## Safety

- Demo data uses masked usernames and presentation-only records.
- Real API/CMS data wins over demo fallbacks.
- Setting `presentation_demo_enabled` to `false` disables presentation fallbacks.
