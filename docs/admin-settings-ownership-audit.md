# Admin Settings Ownership Audit

## Objective

Keep the Admin UI consistent with the existing Admin design system and prevent settings, uploads, preview, history, permissions, audit, promotions and game configuration from being implemented more than once.

## Ownership matrix

| Area | Owner page/module | Owns | Must not own |
| --- | --- | --- | --- |
| Website | `/settings/website` | Site identity text, domains, locale, timezone, currency, maintenance/login/registration switches | Logos, colors, fonts, menu icons, promotions, game catalog |
| Branding | `/settings/branding` | Logos, brand colors, typography, radius, content width and visual placeholders | Member copy, promotion records, game provider data |
| Icons | `/settings/icons` | Menu, category and quick-action icon values and labels | Logo lifecycle, promotion media, game catalog |
| Promotion Center / CMS | Promotion and CMS pages | Banners, announcements, promotion content and campaign media | Global branding tokens and game-provider configuration |
| Game API Settings | Game API settings pages | Provider/category/game mapping and integration controls | Branding assets and Member marketing copy |
| Asset transport | `/admin/settings/cms-assets` | The single upload transport for settings-managed images | A second Branding-specific uploader |
| Version history | `SiteSettingHistory` | Version evidence and rollback source | A second settings-history table |
| Audit | `AdminAuditLog` | Actor, action, old/new data, IP and user agent | A second branding audit store |
| Permissions | Existing role/permission framework | Edit/publish capability checks | A parallel permission system |

## Shared UI rules

1. Admin pages must use `AdminPage`, `AdminCard`, `AdminGrid`, `AdminActionStrip`, `AdminToolbar`, `AdminNotice`, `AdminButton` and `AdminLinkButton` where applicable.
2. Do not introduce raw page-level button/link/card styling when an Admin primitive already exists.
3. Inline preview is for the current form values. Full-page preview is for Desktop/Tablet/Mobile acceptance. Do not create a third preview implementation.
4. Form lifecycle behavior should converge on one shared implementation: load, dirty state, before-unload guard, save, reset and notices.
5. Branding edits save as Draft. Publish and rollback remain separate privileged actions.

## Current overlap findings

- Website and `SettingsSectionPage` both implement load, dirty detection, before-unload, save, reset and notice behavior.
- Website has a dedicated inline preview while generic settings pages use the shared Preview renderer.
- Branding workflow previously used custom link/card styles; it now uses Admin design-system primitives.
- Branding, Website and Icons are close in purpose but their key ownership is distinct. Moving keys must be an explicit migration, not duplicate exposure in two pages.

## Refactor order

1. Preserve current API routes and settings keys.
2. Normalize Branding workflow layout to Admin primitives.
3. Add ownership regression tests.
4. Extract a shared settings form lifecycle hook without changing page behavior.
5. Migrate Website to the shared lifecycle.
6. Consolidate inline preview contracts and retain one full-page Member preview.
7. Run Admin lint, tests, typecheck and production build before further Member visual work.
