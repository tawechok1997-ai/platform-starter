# R-005 Shared API Client Closure Evidence

Status: implementation complete; final closure requires Architecture Contracts and Build to pass on the PR head.

## Shared transport contract

`packages/api-client` now owns:

- base URL joining and header merging
- bearer token injection and one-time refresh retry
- request ID propagation
- timeout and caller abort handling
- retry rules for network and 5xx failures
- normalized API errors with stable code, message and request ID
- response caching and explicit cache invalidation
- typed JSON request flow
- binary/file upload flow
- private binary download flow

## Enforcement

- `packages/api-client/src/index.test.ts` covers URL/header behavior, retry, refresh, caching, error normalization, request ID, upload, download and timeout.
- `tools/audit-shared-api-client.mjs` scans Admin and Member source files for direct platform API fetches and duplicate API helpers.
- `.github/workflows/architecture-contracts.yml` runs both the package regression test and the ownership audit.

## Required closure commands

```bash
pnpm --filter @platform/api-client test
pnpm --filter @platform/api-client build
pnpm audit:shared-api-client
pnpm build:web-admin
pnpm build:web-member
```

## Definition of done mapping

| Requirement | Evidence |
|---|---|
| Shared URL/header/error/retry/cache behavior | `packages/api-client/src/index.ts` and package tests |
| Admin/member integration protected | workspace dependencies plus static ownership audit |
| Timeout, abort and request ID centralized | shared client request transport |
| Auth refresh/rotation behavior centralized | one-time refresh retry contract |
| File upload/private download typed | `upload()` and `download()` methods |
| Error normalization centralized | `ApiClientError` with status/code/requestId/payload |
| Duplicate helpers prevented | `audit:shared-api-client` |
| Contract regression in CI | Architecture Contracts workflow |

A new direct platform API fetch or duplicate `adminFetch`, `memberFetch`, `fetchJson` or `apiFetch` helper fails CI unless it imports and delegates to the shared client.
