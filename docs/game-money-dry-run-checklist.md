# Game Money Dry-run Checklist

This checklist covers transfer dry-run and webhook receive-only. No real wallet balance is changed in this flow.

## Build checks

```bash
pnpm prisma generate
pnpm build:api
pnpm build:web-admin
pnpm build:web-member
pnpm test:e2e:smoke
```

## Member transfer dry-run

1. Log in as member.
2. Open `/games`.
3. Launch a demo game.
4. On `/games/demo-launch`, enter an amount.
5. Click `Transfer In`.
6. Confirm response says success.
7. Click `Transfer Out`.
8. Confirm response says success.
9. Confirm wallet balance is not changed.

## Admin transfer log

1. Open Admin `/game-transfers`.
2. Confirm latest transfer appears.
3. Confirm user/provider/session/game are visible.
4. Confirm `idempotencyKey` is visible.
5. Confirm `providerTransactionId` is visible after success.
6. Confirm failed transfers show `errorCode/errorMessage`.

## Webhook receive-only

Send a demo webhook:

```bash
curl -X POST "$API_URL/provider-webhooks/demo-provider" \
  -H "Content-Type: application/json" \
  -d '{"eventType":"demo.webhook.received","idempotencyKey":"demo-manual-1","providerTransactionId":"demo-tx-1"}'
```

Expected behavior:

- API validates webhook through adapter.
- API parses webhook through adapter.
- API writes `WebhookLog`.
- API does not update wallet balance.
- API does not settle bets.

## Admin webhook logs

1. Open Admin `/webhook-logs`.
2. Confirm latest webhook appears.
3. Confirm event type, signature status, idempotency key, provider transaction id, and response status are visible.
4. Send same idempotency key again and confirm duplicate behavior.

## Safety notes

- Transfer dry-run only creates `GameTransfer` logs.
- Webhook receive-only only creates `WebhookLog` rows.
- Do not enable real wallet mutation until idempotency, reconciliation, bet settlement, rollback, manual review, and alerting are complete.
