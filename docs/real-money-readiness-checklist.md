# Real Money Readiness Checklist

This checklist must pass before enabling real wallet mutation, real provider launch, or webhook-driven balance updates.

## Build checks

```bash
pnpm prisma generate
pnpm build:api
pnpm build:web-admin
pnpm build:web-member
pnpm test:e2e:smoke
```

## Provider readiness gates

- Provider is ACTIVE.
- Adapter is registered.
- LAUNCH endpoint is enabled.
- BALANCE endpoint is enabled.
- TRANSFER_IN endpoint is enabled.
- TRANSFER_OUT endpoint is enabled.
- WEBHOOK endpoint is configured.
- API_KEY credential is enabled.
- WEBHOOK_SECRET credential is enabled.
- Real-money feature flag remains disabled until final approval.

## Dry-run transfer checks

- Member can launch a demo game.
- Transfer In dry-run creates `GameTransfer`.
- Transfer Out dry-run creates `GameTransfer`.
- Transfer logs show idempotency key.
- Transfer logs show provider transaction id.
- Wallet balance does not change during dry-run.
- Admin `/game-transfers` shows success and failed cases.

## Reconciliation checks

- Admin can run reconciliation from `/game-sessions`.
- API creates `ProviderWalletSnapshot`.
- Admin `/provider-wallet-snapshots` shows MATCHED/MISMATCH/UNKNOWN.
- MISMATCH is highlighted for manual review.
- UNKNOWN is treated as unsafe for real money.

## Webhook safety checks

- Provider webhook endpoint receives payloads.
- Signature validation result is logged.
- Duplicate idempotency key is detected.
- Raw payload and normalized payload are stored.
- Webhook receive-only does not mutate wallet.
- Webhook receive-only does not settle bets.

## Manual review requirements

Before real money:

- Admin review path for mismatch exists.
- Admin note path for suspicious transfer exists.
- Failed transfer retry policy is documented.
- Rollback policy is documented.
- Alerting policy is documented.
- Provider downtime procedure is documented.

## Hard no-go conditions

Do not enable real money if any of these are true:

- Any provider readiness check fails.
- Reconciliation returns MISMATCH or UNKNOWN.
- Duplicate webhook handling is untested.
- Idempotency retry behavior is untested.
- Admin cannot inspect transfers, sessions, webhooks, and snapshots.
- Production database backup/restore has not been tested.
