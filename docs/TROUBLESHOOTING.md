# Troubleshooting

Updated: **2026-07-31**  
Owner: **Platform Engineering**  
Status: **Active**

## Build reports generated catalog drift

Run:

```bash
pnpm --filter @platform/api normalize:generated-catalogs
```

Review the generated-file diff. The normal build intentionally refuses to rewrite source files.

## Admin reference assets are out of sync

Run:

```bash
pnpm --filter @platform/web-admin sync:reference-assets
```

Review and commit the copied asset diff. Production builds use check-only mode.

## API builds but fails at startup

```bash
pnpm build:api
node tools/verify-api-startup.mjs
```

Check the captured Nest output for missing provider exports/imports, invalid environment variables, database connectivity and health degradation. A successful TypeScript build is not startup evidence.

## `/health` is degraded

- `database=error`: validate `DATABASE_URL`, schema migration state and database access
- `privateMedia=error`: validate `PRIVATE_MEDIA_DIR` permissions and persistent-volume configuration

Do not promote a degraded deployment.

## Rate-limited endpoints return 429 during Redis incidents

Sensitive login, password-reset, money and provider-webhook routes fail closed in production when a configured Redis rate limiter errors. Restore Redis before raising limits or bypassing the protection. In-memory fallback is for environments where Redis was not configured, not an outage escape hatch.

## Provider simulator URLs are unavailable

`API_PUBLIC_URL` is required when the simulator is enabled in production. Use an approved absolute HTTPS URL. Forwarded host headers are accepted only in non-production development paths and are validated.

## Browser blocks a resource after security-header changes

Inspect the browser console and response headers. Add only the narrow source required by the product. Do not replace the CSP with unrestricted wildcards. External scripts should be avoided or documented with an owner and purpose.

## Legacy reference JavaScript returns 404

This is intentional. Executable files under `public/assets/asset-pc` and `public/assets/asset-mobile` are quarantined. Extract approved images into owned asset folders rather than executing copied third-party bundles.

## Response cache appears stale or crosses login state

Authenticated response caching requires `getCacheNamespace`. Call `resetSession()` on login/logout and use a namespace tied to the current actor/session. Mutations and token refreshes clear the cache automatically.

## Build changes tracked files

CI runs `git diff --exit-code` after all builds. Move generation or synchronization to an explicit `--write` command and keep production build scripts read-only.

## Repository clone is slow

The repository contains a large historical asset footprint. Use partial clone and sparse checkout where supported. Follow `docs/operations/repository-size-migration.md` for the controlled history-cleanup plan. Do not rewrite shared history without owner approval, backups and a coordinated cutover.
