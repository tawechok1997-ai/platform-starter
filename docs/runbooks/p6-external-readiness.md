# P6 External Readiness Runbook

## Purpose

Use this runbook before authenticated, deployed, production, or vendor-specific regression. The readiness checker validates required variables and safe URL policy without printing credential, URL, token, or secret values.

## Commands

```bash
pnpm verify:p6:readiness
pnpm verify:p6:readiness:strict
pnpm verify:p6:readiness:json
```

Set the target policy locally with one of:

```text
P6_ENVIRONMENT=non-production
P6_ENVIRONMENT=staging
P6_ENVIRONMENT=production
```

The default is `non-production` when the variable is omitted.

- Normal mode prints READY/BLOCKED per group and exits successfully so developers can inspect partial readiness.
- Strict mode exits with code 1 until every required group is ready and every URL validation passes.
- JSON mode emits machine-readable status without credential or URL values.

## Manual GitHub Actions gate

Workflow: `.github/workflows/p6-readiness.yml`

Run it from **Actions → P6 External Readiness → Run workflow** after adding the variables below as GitHub Actions repository or environment secrets. Select `non-production`, `staging`, or `production` in the workflow input.

The workflow:

- uses `workflow_dispatch` only and never runs automatically against production;
- grants only `contents: read` permission;
- runs checker regression tests before the strict readiness gate;
- stops with a failed status while any prerequisite or URL policy is invalid;
- writes only environment, field names, READY/BLOCKED status, and sanitized reasons to the summary;
- does not start authenticated, mutation, settlement, or provider tests.

Use environment-scoped secrets with required reviewers for production-only values. Repository secrets are acceptable for non-production seeded regression accounts when access is appropriately restricted.

## Deployed environment variables

```text
P6_API_URL
P6_ADMIN_URL
P6_MEMBER_URL
```

URL policy:

- values must be valid `http://` or `https://` URLs;
- production requires HTTPS;
- embedded username/password credentials are forbidden;
- API, Admin, and Member URLs must use different origins;
- invalid reports contain only the variable name and reason, never the URL value.

Use non-production URLs for authenticated browser regression unless a worklist item explicitly requires production verification.

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

Provider base and callback URLs follow the same URL policy, including mandatory HTTPS for production and no embedded credentials.

## Safe execution order

1. Run `pnpm verify:p6:readiness` and resolve missing or invalid variables by group.
2. Run the manual `P6 External Readiness` workflow or `pnpm verify:p6:readiness:strict` before authenticated or vendor regression.
3. Verify health/version endpoints before money-flow tests.
4. Run read-only and permission regressions before mutation or settlement scenarios.
5. Keep real-money gates disabled until provider-specific reconciliation and UAT are approved.

## Worklist accounting

Adding or passing the readiness checker does not close a P6 checkbox by itself. Close each P6 item only after its actual deployed regression, production verification, approval, or vendor UAT evidence exists.
