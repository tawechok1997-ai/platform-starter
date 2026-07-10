# Provider Integration Guide

This guide explains how to add a real game provider without changing core wallet, session, or money-operation services.

## 1. Adapter contract

All providers must implement `GameProviderAdapter` from:

```text
apps/api/src/modules/game-platform/provider-adapter.interface.ts
```

Required methods:

```text
healthCheck
launchGame
getBalance
transferIn
transferOut
syncGames
getBetHistory
validateWebhook
parseWebhook
```

Core services call only this adapter contract. Provider-specific URL formats, request bodies, signatures, response mapping, and error mapping belong inside the adapter.

## 2. Where to add a real provider adapter

Create a file such as:

```text
apps/api/src/modules/game-platform/adapters/<provider>.adapter.ts
```

Example:

```text
apps/api/src/modules/game-platform/adapters/pgsoft.adapter.ts
```

Then register it in:

```text
apps/api/src/modules/game-platform/adapters/provider-adapter.registry.ts
```

Example:

```ts
this.register('pgsoft', new PgSoftAdapter());
```

The provider code in Admin must match the registry code.

## 3. Provider setup flow

Recommended safe flow:

1. Use `/provider-presets` or `/provider-setup-wizard` to create provider scaffolding.
2. Keep provider `INACTIVE` first.
3. Add sandbox/UAT endpoints.
4. Add credentials.
5. Run `/adapter-test` method by method.
6. Run `/provider-risk` preflight.
7. Sync games.
8. Test launch.
9. Test transfer-in and transfer-out with small amounts.
10. Run reconciliation.
11. Only then consider production gates.

## 4. Secrets

Credentials are stored encrypted and shown masked in admin UI. Adapter context receives decrypted values server-side only.

Never return raw credentials to frontend. Never log raw secrets, API keys, webhook secrets, signatures, or encrypted values.

## 5. Transfer wallet behavior

For transfer wallet providers:

- transfer-in debits member wallet first.
- provider transfer-in is called.
- if provider fails, wallet debit is reversed.
- transfer-out calls provider first.
- if provider succeeds, member wallet is credited.
- all wallet movements are written to `WalletLedger` with idempotency keys.

## 6. Webhooks

Webhook handling must validate signature and deduplicate by idempotency key before settlement.

Current safe flow:

- receive webhook
- validate signature via adapter
- parse event via adapter
- store `WebhookLog`
- keep settlement behind gates

Do not enable wallet settlement until provider event mapping, replay protection, and reconciliation are proven.

## 7. Reconciliation

Reconciliation compares system expected provider balance with provider balance. Mismatch or unknown status creates `RiskAlert` with type `WALLET_LEDGER_MISMATCH`.

Use `/reconciliation-center` to run and review snapshots.

## 8. Testing before real money

Required checks:

- Adapter Test Harness passes for health, launch, balance, transfer-in, transfer-out, sync games, webhook validation.
- Provider Risk has no blockers.
- WalletLedger balances are correct.
- GameTransfer status and provider transaction IDs are correct.
- Reconciliation is matched.
- Webhook duplicate and invalid signature behavior is verified.
