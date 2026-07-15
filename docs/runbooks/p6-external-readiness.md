# P6 External Readiness Runbook

## Purpose

Use this runbook before authenticated, deployed, production, or vendor-specific regression. The readiness checker reports only whether required environment variables are present. It never prints credential or secret values.

## Commands

```bash
pnpm verify:p6:readiness
pnpm verify:p6:readiness:strict
pnpm verify:p6:readiness:json
```

- Normal mode prints READY/BLOCKED per group and exits successfully so developers can inspect partial readiness.
- Strict mode exits with code 1 until every required group is ready. Use this as a workflow gate before P6 regression.
- JSON mode emits machine-readable status without credential values.

## Deployed environment variables

```text
P6_API_URL
P6_ADMIN_URL
P6_MEMBER_URL
```

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

## Safe execution order

1. Run `pnpm verify:p6:readiness` and resolve missing variables by group.
2. Run `pnpm verify:p6:readiness:strict` before starting authenticated or vendor regression.
3. Verify health/version endpoints before money-flow tests.
4. Run read-only and permission regressions before mutation or settlement scenarios.
5. Keep real-money gates disabled until provider-specific reconciliation and UAT are approved.

## Worklist accounting

Adding or passing the readiness checker does not close a P6 checkbox by itself. Close each P6 item only after its actual deployed regression, production verification, approval, or vendor UAT evidence exists.
