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

## Required deployment variables

Set the following on the API, Admin, and Member deployments:

```text
GIT_COMMIT_SHA=<deployed commit>
BUILT_AT=<ISO-8601 build timestamp>
NODE_ENV=<target environment>
```

`RAILWAY_GIT_COMMIT_SHA` is accepted as a fallback for `GIT_COMMIT_SHA`.

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

1. Deploy API, Admin, and Member from the same approved commit.
2. Confirm each service has `GIT_COMMIT_SHA`, `BUILT_AT`, and the correct `NODE_ENV`.
3. Run the P6 readiness workflow.
4. Do not start authenticated, mutation, settlement, or provider regression unless all three deployment identities pass.
5. A passing identity gate is evidence that deployments align, but it does not close a P6 regression checkbox by itself.
