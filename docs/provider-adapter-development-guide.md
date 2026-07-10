# Provider Adapter Development Guide

This guide explains how to add a new game provider adapter safely.

## Current adapter architecture

Core files:

```text
apps/api/src/modules/game-platform/provider-adapter.interface.ts
apps/api/src/modules/game-platform/adapters/provider-adapter.registry.ts
apps/api/src/modules/game-platform/adapters/demo-provider.adapter.ts
```

The registry maps `GameProvider.code` to a concrete adapter implementation.

Current registered adapter:

```text
demo-provider -> DemoProviderAdapter
```

## Adapter contract

Every adapter must implement `GameProviderAdapter`:

```ts
healthCheck(context)
launchGame(context, input)
getBalance(context, input)
transferIn(context, input)
transferOut(context, input)
syncGames(context)
getBetHistory(context, input)
validateWebhook(context, headers, body)
parseWebhook(context, body)
```

## Provider context

The service builds `ProviderAdapterContext` from DB config:

```ts
providerCode
baseUrl
walletMode
currency
timeoutMs
endpointMap
credentialMap
```

Important:

- `endpointMap` only includes enabled endpoints.
- `credentialMap` currently uses masked values for health-check safe mode.
- Real adapter execution must use decrypted credential values before real provider calls are enabled.

## Health check behavior

Admin route:

```text
POST /admin/game-providers/:providerId/health-check
```

Flow:

1. Load provider with enabled endpoints and enabled credentials.
2. Build adapter context.
3. Resolve adapter by `provider.code`.
4. Run `adapter.healthCheck(context)`.
5. Return provider health, latency, readiness checks, and checked timestamp.
6. Write admin audit log.

## Readiness checklist

The API returns readiness checks for:

- adapter registered
- provider active
- LAUNCH endpoint enabled
- BALANCE endpoint enabled
- TRANSFER_IN and TRANSFER_OUT endpoints enabled
- API_KEY credential enabled
- WEBHOOK_SECRET credential enabled

This checklist is shown in the admin `/game-providers` detail panel.

## Adding a new provider adapter

### 1. Create adapter file

Example:

```text
apps/api/src/modules/game-platform/adapters/acme-provider.adapter.ts
```

Skeleton:

```ts
import { GameProviderAdapter, ProviderAdapterContext } from '../provider-adapter.interface';

export class AcmeProviderAdapter implements GameProviderAdapter {
  async healthCheck(context: ProviderAdapterContext) {
    return {
      ok: true,
      providerCode: context.providerCode,
      requestId: `acme_health_${Date.now()}`,
      payload: { status: 'ONLINE' as const, latencyMs: 1 },
    };
  }

  // implement all required interface methods
}
```

### 2. Register adapter

Update:

```text
apps/api/src/modules/game-platform/adapters/provider-adapter.registry.ts
```

Add:

```ts
this.register('acme-provider-code', new AcmeProviderAdapter());
```

The string must match `GameProvider.code` in the database.

### 3. Configure provider in Admin

Open:

```text
/game-providers
```

Create provider with matching code:

```text
code: acme-provider-code
```

Add endpoints and credentials, then run Test Connection.

## Safety rules

Before real launch/transfer/webhook processing:

- never return raw provider secrets in API responses
- never log raw secrets
- never trust provider webhook payload without signature validation
- always use idempotency keys for transfer operations
- write request/response audit logs with masked data
- normalize provider errors before exposing to admin/member UI
- keep provider in `INACTIVE` or `MAINTENANCE` until health check and dry-run flows pass

## Real provider implementation checklist

Before enabling a real provider:

1. Add adapter class.
2. Register adapter by provider code.
3. Add endpoint config in admin.
4. Add credential config in admin.
5. Confirm health check.
6. Implement game list sync.
7. Implement launch game dry-run.
8. Implement transfer wallet dry-run.
9. Implement webhook validation.
10. Implement reconciliation.
11. Only then consider real wallet transfer.

## Current limitations

- Demo adapter is safe mock only.
- Health check does not call external provider API yet unless a future real adapter implements it.
- Credentials are encrypted for storage and returned masked, but real adapter decryption is intentionally not wired into execution yet.
- Launch/transfer/webhook routes are not production-ready yet.
