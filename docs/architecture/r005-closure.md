# R-005 Closure: Shared API Client Consolidation

Status: **DONE**

Closed on: **2026-07-14**

## Scope completed

- Admin and Member application code uses `packages/api-client` as the shared request transport.
- Direct `fetch`, `axios`, local transport helpers, `adminFetch`, `memberFetch`, and `fetchJson` usage is inventoried by a static audit.
- Only documented transport boundaries and Next.js proxy route handlers are allowed to use lower-level transport behavior.
- Shared client behavior covers timeout, abort, retry, request IDs, cache policy, authentication refresh, typed JSON requests, typed uploads, private downloads, and normalized errors.
- Admin login, Admin 2FA, anti-bot configuration, webhook testing, Member anti-bot configuration, and public site settings were migrated to the shared client.
- Contract regression covers request IDs, typed JSON requests, and normalized API errors.
- CI uploads a machine-readable API-client inventory artifact and runs the R-005 closure gate.

## Automated evidence

The following command passed after the final Admin build fixes:

```bash
pnpm audit:r5-closure
```

The closure gate includes:

```bash
pnpm audit:shared-api-client
pnpm --filter @platform/api-client test
pnpm --filter @platform/api-client build
pnpm typecheck:admin
pnpm typecheck:member
```

Admin build verification also passed after replacing obsolete `requestJson()` calls with the supported `json()` API.

## Guardrails

- New page and component code may not call `fetch` or `axios` directly.
- New duplicate Admin/Member request helpers are forbidden.
- Local `/api/*` proxy paths are allowed only when invoked through the shared API client.
- Lower-level transport exceptions must remain limited to documented bridge and server proxy files.
