# Shared Packages Contract

Shared packages exist to remove duplication without hiding product ownership. They must stay smaller and more stable than the applications that consume them.

## Current package baseline

`@platform/api-client` is the shared typed client consumed by Admin and Member surfaces. Its package contract must provide:

- a single documented public entry point;
- TypeScript type checking with no emit;
- lint coverage for source files;
- executable contract tests;
- no application-specific UI, secrets, environment reads or database access.

## Ownership rules

1. API request and response contracts belong in the API client only when both web applications consume the same shape.
2. Admin-only or Member-only behavior stays in its owning application.
3. Shared packages must not import from `apps/`.
4. Applications may import from shared packages only through documented public exports.
5. Breaking exports require coordinated API, Admin and Member verification in the same change.
6. Generated code must declare its generator and drift check; handwritten and generated exports must not be mixed silently.

## Required verification

Run these checks when a shared package changes:

```bash
pnpm --filter @platform/api-client lint
pnpm --filter @platform/api-client typecheck
pnpm --filter @platform/api-client test
pnpm --filter @platform/api-client build
pnpm typecheck:admin
pnpm typecheck:member
```

The existing `pnpm audit:r5-closure` command remains retained closure evidence. New day-to-day changes should run the explicit package checks above rather than treating an old closure command as a magical certificate of eternal correctness.

## Review checklist

- [ ] Public exports are intentional and minimal.
- [ ] No import reaches into an application directory.
- [ ] Runtime code does not read credentials or deployment-only environment variables.
- [ ] Tests cover serialization, error handling and backward-compatible response parsing.
- [ ] Admin and Member type checks pass after any contract change.
- [ ] Package documentation is updated when the public API changes.
