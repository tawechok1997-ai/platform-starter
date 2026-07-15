# P6 Frontend Deployment Identity

## Purpose

Prevent authenticated regression from running against mixed deployments where the API, Admin UI, and Member UI were built from different commits or environments.

## Public identity endpoints

- API: `P6_API_URL/version`
- Admin: `P6_ADMIN_URL/api/version`
- Member: `P6_MEMBER_URL/api/version`

The frontend endpoints are server-side Next.js route handlers with `Cache-Control: no-store`. They return only deployment metadata:

- `service`
- `version`
- `commit`
- `environment`
- `builtAt`
- request `time`

They must not expose credentials, environment dumps, provider configuration, database details, or user data.

## Automatic metadata injection

The root build and start commands run through `tools/run-with-deployment-metadata.mjs`. The wrapper injects the same metadata contract into the API, Admin, and Member child processes:

```text
GIT_COMMIT_SHA
BUILT_AT
NODE_ENV
```

Commit resolution order:

1. `GIT_COMMIT_SHA`
2. `RAILWAY_GIT_COMMIT_SHA`
3. `VERCEL_GIT_COMMIT_SHA`
4. `GITHUB_SHA`
5. local `git rev-parse HEAD`
6. `unknown` when no valid Git SHA is available

`BUILT_AT` preserves a valid externally supplied timestamp. Otherwise, it is generated when the wrapped build or start command begins. `NODE_ENV` preserves the configured value and defaults to `production` for wrapped deployment commands.

The wrapper exposes only the three metadata fields in `--print-json` mode. It never dumps the full process environment.

## Wrapped deployment commands

Use these root commands in Railway or another deployment platform:

```bash
pnpm build:api
pnpm start:api
pnpm build:web-admin
pnpm start:web-admin
pnpm build:web-member
pnpm start:web-member
```

Each command automatically launches its service with deployment metadata. Platforms may still set `GIT_COMMIT_SHA`, `BUILT_AT`, or `NODE_ENV` explicitly; explicit valid values take priority.

Verify the injector independently with:

```bash
pnpm verify:deployment-metadata
node tools/run-with-deployment-metadata.mjs --print-json
```

## Approved deployment

Set the approved commit in the workflow environment:

```text
P6_APPROVED_COMMIT_SHA=<approved commit>
```

## Verification

```bash
pnpm verify:p6:deployment
pnpm verify:p6:deployment:strict
pnpm verify:p6:deployment:json
```

The checker verifies all three services and fails when any service:

- is missing its URL;
- redirects the identity request;
- returns a non-success HTTP status or invalid JSON;
- reports the wrong service name;
- reports a commit different from the approved commit;
- reports an environment different from the selected workflow environment;
- reports an unknown or invalid build timestamp.

Short and full Git SHAs may match by prefix. Output contains only service names, HTTP status codes, and sanitized reason codes. It never prints configured URLs or commit values.

## Safe rollout order

1. Deploy API, Admin, and Member from the same approved commit using the wrapped root commands.
2. Confirm the identity endpoints no longer report `commit: unknown` or `builtAt: unknown`.
3. Run `pnpm verify:deployment-metadata` and the manual P6 readiness workflow.
4. Do not start authenticated, mutation, settlement, or provider regression unless all three deployment identities pass.
5. A passing identity gate is evidence that deployments align, but it does not close a P6 regression checkbox by itself.
