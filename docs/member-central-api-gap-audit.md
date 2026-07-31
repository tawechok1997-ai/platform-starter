# Member Central API Gap Audit

Updated: 2026-08-01

Scope: `apps/web-member`, with emphasis on the Home mobile/tablet owner, drawer destinations, compatibility pages, and parity with the Desktop runtime.

## Connected to the central runtime or API

| Area | Current central source | Status |
|---|---|---|
| Theme, features, icons and configured navigation | Public Site Settings through `MemberRuntimeProvider` | Connected |
| Session, wallet and logged-in summary | `MemberSessionProvider` and runtime summary | Connected |
| Member profile and VIP scalar | `GET /member/auth/profile` | Connected |
| Pending transaction count | Shared `usePendingCount` hook | Connected |
| Home banners and announcements | Central CMS content from Public Site Settings | Connected |
| Game catalog | `GET /games/catalog` by category and platform | Connected |
| Home tournament and leaderboard configuration | Shared Member Home runtime | Connected |
| Desktop and Mobile protected-route login guard | Shared configured navigation `requiresAuth` contract | Connected |
| Login and registration | Shared Auth API and one overlay owner | Connected |
| Drawer destinations | Same production routes as Desktop | Connected |
| CDN media resolution | Generated basename index over checked-in local assets | Connected |

## Remaining gaps that can still affect visible production UI

### P0: Mobile Home fallback content

`mobile-source-content.tsx` still contains checked-in fallback arrays for tournaments, leaderboard rows, popular games, online games and classic games. They appear when the corresponding central runtime or catalog response is empty. This prevents an empty screen, but the displayed records can be stale and should be replaced with explicit loading, empty and partial-failure states once the API contract is trusted.

### P0: Live match feed

The Mobile Home live section still uses a static `LIVE_MATCHES` array and external team-logo URLs. It does not consume a central live-match endpoint. The section title, enablement and route are central, but the actual fixtures are not.

### P1: Usage-guide entries

The Mobile Home guide section still uses a static `GUIDES` array. The section enablement and title come from the runtime, but article groups and article destinations are not loaded from central CMS/help content.

### P1: Drawer menu definitions

Drawer links now navigate to the same real routes as Desktop and share the same authentication guard. However, the drawer label/order arrays remain declared locally in `mobile-home-root.tsx`. The icon files are shared with Desktop. The final cleanup is to derive drawer items directly from configured navigation metadata rather than keeping separate label arrays.

### P1: Footer institutions and certificates

Bank names, certification badges and security badges on Mobile Home are local arrays. They are stable assets rather than transactional data, but Admin cannot reorder, enable or disable them through central settings yet.

## Compatibility-only static pages

The `/mobile-menu/[section]` implementation still contains source-reference-only content for VIP, live, promotions, news, activities, video, guide and language. The production drawer no longer redirects users to these pages, so they are not part of the normal navigation path. They remain only as source-comparison compatibility pages.

Static data still present there includes:

- VIP levels, thresholds, benefits and cashback percentages
- Live fixtures and dates
- Promotion cards and expiry copy
- Activity cards
- Guide groups
- Language list

These pages should either be deleted after visual acceptance or converted into thin wrappers around the existing production routes. They must not become a second business-data owner.

## Recommended closure order

1. Connect the live-match list to a central endpoint and keep static fixtures only in tests.
2. Move guide groups and articles into CMS/help API data.
3. Replace Mobile Home content fallbacks with explicit runtime states after API acceptance coverage is complete.
4. Generate Drawer items from configured navigation metadata.
5. Make banks and trust badges configurable in Site Settings if Admin ownership is required.
6. Retire `/mobile-menu/[section]` compatibility pages after source-layout acceptance.

## Ownership rule

Desktop and Mobile may have different render components, but they must consume the same API contracts, feature flags, configured routes and media resolver. Static source-comparison pages are not permitted to become production data owners.
