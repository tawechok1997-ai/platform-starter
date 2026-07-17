# @platform/api-client

Shared HTTP transport for Admin and Member applications.

## Responsibilities

- join API base URLs and paths safely
- merge request headers
- attach auth and request IDs
- parse JSON and text responses
- normalize API errors
- support timeout, retry, upload, download and small in-memory response caching

## Boundaries

This package must remain application-neutral.

It must not:

- import from `apps/web-admin` or `apps/web-member`
- render React UI or contain route-specific presentation logic
- read production environment variables directly
- connect to Prisma or any database
- access the filesystem
- embed provider credentials, tokens or private service URLs

Application-specific token storage and refresh behavior belong in the Admin and Member transport bridges.

## Public API

The supported public surface is exported from `src/index.ts`:

- `createApiClient`
- `ApiClientError`
- request and response option types
- URL, header and response parsing helpers

New exports require a real consumer in Admin, Member or package tests. Avoid exporting internal cache, retry or signal helpers.

## Verification

```bash
pnpm --filter @platform/api-client lint
pnpm --filter @platform/api-client typecheck
pnpm --filter @platform/api-client test
pnpm --filter @platform/api-client build
pnpm audit:shared-api-client
```

When the request contract changes, also run:

```bash
pnpm typecheck:admin
pnpm typecheck:member
```
