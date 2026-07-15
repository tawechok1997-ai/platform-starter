# CMS Module README

## Scope

CMS covers settings persistence, branding/legal/campaign configuration, CMS assets, URL-backed asset validation, and content surfaces used by Admin and Member.

## Primary implementation

- `apps/api/src/modules/settings/settings.controller.ts` and `settings.service.ts` — settings persistence and validation.
- `apps/api/src/modules/settings/cms-assets.controller.ts` and `cms-assets.service.ts` — CMS asset metadata and URL-backed validation.
- `apps/api/src/modules/settings/cms-assets.dto.ts` and `settings.constants.ts` — DTO and contract constants.
- `apps/web-admin` and `apps/web-member` consume the settings/CMS contracts through their UI routes.

## Safety boundaries

- URL-backed assets must be validated before persistence.
- Binary upload remains incomplete until object storage, malware scan, and retention policy are confirmed.
- Settings mutations must enforce permission checks and audit paths.

## Regression evidence to keep current

- `pnpm --filter @platform/api test -- cms-assets.service.spec.ts --runInBand`
- Authenticated settings/CMS browser regression remains required.
