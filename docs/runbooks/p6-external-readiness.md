# P6 External Readiness Runbook

## Purpose

Use this runbook before authenticated, deployed, production, or vendor-specific regression. The readiness checker reports only whether required environment variables are present and structurally valid. The connectivity checker performs unauthenticated reachability probes. The deployment identity checker verifies that the API version endpoint matches the approved deployment. None of these tools prints credential or secret values.

## Commands

```bash
pnpm verify:p6:readiness
pnpm verify:p6:readiness:strict
pnpm verify:p6:readiness:json
pnpm verify:p6:connectivity
pnpm verify:p6:connectivity:strict
pnpm verify:p6:connectivity:json
pnpm verify:p6:deployment
pnpm verify:p6:deployment:strict
pnpm verify:p6:deployment:json
```

- Normal mode prints READY/BLOCKED per group, service, or identity check and exits successfully so developers can inspect partial readiness.
- Strict mode exits with code 1 until every required check is ready. Use strict mode as a workflow gate before P6 regression.
- JSON mode emits machine-readable status without credential values, configured URLs, or commit values.

## Manual GitHub Actions gate

Workflow: `.github/workflows/p6-readiness.yml`

Run it from **Actions → P6 External Readiness → Run workflow** after adding the variables below as GitHub Actions repository or environment secrets.

The workflow:

- uses `workflow_dispatch` only and never runs automatically against production;
- requires an environment classification of `non-production`, `staging`, or `production`;
- grants only `contents: read` permission;
- installs from the lockfile and runs readiness, connectivity, and deployment-identity regression tests;
- runs `pnpm verify:p6:readiness:strict` before connectivity;
- runs `pnpm verify:p6:connectivity:strict` before deployment identity;
- runs `pnpm verify:p6:deployment:strict` before any authenticated regression;
- stops with a failed status while any required prerequisite, service, or deployment identity check is unavailable;
- writes only READY/BLOCKED names, status codes, and sanitized reason codes to the job summary;
- does not start authenticated, mutation, settlement, or provider tests.

Use environment-scoped secrets with required reviewers for production-only values. Repository secrets are acceptable for non-production seeded regression accounts when access is appropriately restricted.

## Environment classification

```text
P6_ENVIRONMENT=non-production
P6_ENVIRONMENT=staging
P6_ENVIRONMENT=production
```

`production` enables stricter URL policy. The workflow sets this value from its manual input; local runs must set it explicitly when validating production configuration.

## Deployed environment variables

```text
P6_API_URL
P6_ADMIN_URL
P6_MEMBER_URL
P6_APPROVED_COMMIT_SHA
```

Use non-production URLs for authenticated browser regression unless a worklist item explicitly requires production verification.

`P6_APPROVED_COMMIT_SHA` must contain a 7-to-40-character Git commit SHA approved for the target deployment. Store it as a GitHub secret or protected environment variable. The checker supports comparing a short SHA with the matching full SHA returned by the API.

URL policy:

- values must be valid `http://` or `https://` URLs;
- production URLs must use HTTPS;
- URLs must not contain embedded username or password credentials;
- API, Admin, and Member URLs must use distinct origins;
- validation errors expose only the environment-variable name and a sanitized reason code.

## Connectivity policy

The connectivity checker probes:

- `P6_API_URL/health` for the API;
- the root path of `P6_ADMIN_URL`;
- the root path of `P6_MEMBER_URL`.

Safety boundaries:

- requests are unauthenticated and do not send cookies, bearer tokens, seeded account credentials, provider keys, or callback secrets;
- redirects are not followed automatically;
- cross-origin redirects are blocked;
- same-origin redirects are reported as blocked instead of followed, so the operator can review the route explicitly;
- response bodies are not logged;
- output contains only service name, status code, and sanitized reason;
- default timeout is 8 seconds per target;
- `P6_CONNECTIVITY_TIMEOUT_MS` may be set between 1,000 and 30,000 milliseconds.

Successful status codes are 200 through 399, excluding redirects because redirects are handled manually and reported for review.

## Deployment identity policy

The deployment identity checker calls `P6_API_URL/version` and verifies:

- `service` is `api`;
- `commit` matches `P6_APPROVED_COMMIT_SHA`, including short-SHA/full-SHA comparison;
- `environment` matches `P6_ENVIRONMENT`; `non-production` accepts any environment except `production`;
- `builtAt` is present and parses as a timestamp;
- redirects are blocked and no credentials are sent.

The API currently returns `service`, `version`, `commit`, `environment`, `builtAt`, and request `time`. The checker does not print the returned commit, approved commit, endpoint URL, or response body. It reports only check name, status code, and sanitized reason codes such as `commit_mismatch`, `environment_mismatch`, or `invalid_built_at`.

Deployment configuration must set:

```text
GIT_COMMIT_SHA=<deployed commit>
BUILT_AT=<ISO-8601 build timestamp>
NODE_ENV=<target environment>
```

Railway may supply `RAILWAY_GIT_COMMIT_SHA` as a fallback for the commit. A response containing `commit: unknown` or `builtAt: unknown` fails the identity gate.

## Seeded credential variables

```text
P6_ADMIN_EMAIL
P6_ADMIN_PASSWORD
P6_READONLY_ADMIN_EMAIL
P6_READONLY_ADMIN_PASSWORD
P6_MEMBER_EMAIL
P6_MEMBER_PASSWORD
```

Store these in the CI secret manager or local untracked environment. Do not add them to `.env.example`, documentation values, screenshots, logs, or repository history.

## Vendor UAT variables

Required for vendor readiness:

```text
P6_PROVIDER_CODE
P6_PROVIDER_BASE_URL
```

Optional until the provider-specific scenario needs them:

```text
P6_PROVIDER_API_KEY
P6_PROVIDER_SECRET
P6_PROVIDER_CALLBACK_URL
```

`P6_PROVIDER_BASE_URL` and `P6_PROVIDER_CALLBACK_URL`, when present, use the same URL policy. Production callback URLs must use HTTPS.

## Safe execution order

1. Run `pnpm verify:p6:readiness` and resolve missing or invalid variables by group.
2. Run `pnpm verify:p6:connectivity` and resolve unavailable services or redirect policy failures.
3. Run `pnpm verify:p6:deployment` and resolve commit, environment, service, or build timestamp mismatches.
4. Run the manual `P6 External Readiness` workflow or all three strict commands before starting authenticated regression.
5. Run read-only and permission regressions before mutation or settlement scenarios.
6. Keep real-money gates disabled until provider-specific reconciliation and UAT are approved.

## Worklist accounting

Adding or passing readiness, connectivity, and deployment-identity gates does not close a P6 checkbox by itself. Close each P6 item only after its actual deployed regression, production verification, approval, or vendor UAT evidence exists.
