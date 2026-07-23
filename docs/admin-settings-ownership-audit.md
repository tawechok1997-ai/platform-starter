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

## Shared implementation contracts

1. Admin pages use `AdminPage`, `AdminCard`, `AdminGrid`, `AdminActionStrip`, `AdminToolbar`, `AdminNotice`, `AdminButton` and `AdminLinkButton` where applicable.
2. `useAdminSettingsForm` is the single owner of settings load, dirty state, before-unload guard, save, reset and notices.
3. Inline preview is for current form values. The Branding full-page preview is the only Desktop/Tablet/Mobile acceptance preview.
4. Settings-managed images use `/admin/settings/cms-assets`; no page-specific upload backend is allowed.
5. Branding edits save as Draft. Publish and rollback remain separate privileged actions using the existing history, audit and permission systems.
6. Moving a settings key between Website, Branding or Icons requires an explicit migration. A key must not be exposed by two owner pages at the same time.

## Current status

- ✅ Website Settings and `SettingsSectionPage` use the shared form lifecycle.
- ✅ Branding workflow uses Admin design-system primitives.
- ✅ Inline and full-page previews have distinct ownership and no third preview implementation exists.
- ✅ Branding, Website, Icons, Promotion Center and Game API retain separate key/data ownership.
- ✅ Asset upload, version history, rollback, audit and permissions reuse existing systems.
- ✅ Ownership and workflow regression tests protect the boundaries above.

## Remaining verification

- 🧪 Run Admin lint and tests for Admin-specific behavior.
- 🧪 Run repository Build for Admin typecheck and production build.
- 🧪 Complete browser acceptance for the full-page Member preview when visual assets change.
