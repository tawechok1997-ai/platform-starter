# Game Provider Setup Guide

This guide explains the first safe setup flow for adding a game provider to the platform.

## Current implementation status

Implemented:

- `GameProvider` Prisma schema
- `GameProviderEndpoint` Prisma schema
- `GameProviderCredential` Prisma schema
- Admin API for provider CRUD
- Admin API for endpoint CRUD
- Admin API for credential CRUD
- Admin `/game-providers` page wired to real API
- Seeded demo provider for local setup

Not implemented yet:

- Real provider adapter execution
- Real game launch
- Real wallet transfer
- Real webhook processing
- Real reconciliation

Do not enable a real provider in production until adapter execution, wallet ledger integration, idempotency, and reconciliation are implemented.

## Environment variables

Recommended:

```bash
GAME_CREDENTIAL_SECRET="replace-with-long-random-secret"
```

Fallbacks currently used by the app:

- `GAME_CREDENTIAL_SECRET`
- `JWT_ACCESS_KEY`
- local fallback for development only

Production must use a stable secret. Changing it later means old encrypted provider credentials will no longer be decryptable unless migration/re-encryption is added.

Optional demo seed variables:

```bash
DEMO_PROVIDER_BASE_URL="https://provider.example.local/api"
DEMO_PROVIDER_API_KEY="demo-provider-api-key-change-me"
```

## Setup flow

### 1. Apply schema

Run after `prisma/schema.prisma` changes are reviewed:

```bash
pnpm prisma format
pnpm prisma generate
pnpm build:api
pnpm test:e2e:smoke
```

Only after those pass:

```bash
pnpm prisma db push
```

Never use:

```bash
pnpm prisma db push --force-reset
```

Stop if Prisma shows any data-loss warning.

### 2. Seed provider permissions and demo provider

```bash
pnpm db:seed
```

This seeds:

- `game.providers.view`
- `game.providers.manage`
- `demo-provider`
- disabled demo endpoints
- disabled masked/encrypted demo API key

The demo provider is intentionally inactive and unsafe for production use until replaced.

### 3. Open admin provider page

Go to:

```text
/admin game app route: /game-providers
```

Use the page to:

- create provider
- edit provider profile
- set status
- set wallet mode
- add endpoints
- add credentials
- rotate credential values

### 4. Provider profile fields

Required:

- `name`
- `code`
- `status`
- `walletMode`
- `currency`
- `timezone`

Recommended defaults:

```text
status: INACTIVE
walletMode: TRANSFER
currency: THB
timezone: Asia/Bangkok
```

Keep status as `INACTIVE` until endpoint and credential readiness is verified.

### 5. Endpoint setup

Supported endpoint types:

- `LAUNCH`
- `BALANCE`
- `TRANSFER_IN`
- `TRANSFER_OUT`
- `GAME_LIST`
- `BET_HISTORY`
- `WEBHOOK`
- `HEALTH_CHECK`

Endpoint fields:

- `type`
- `url`
- `method`
- `timeoutMs`
- `retryCount`
- `isEnabled`

Recommended defaults:

```text
method: POST
timeoutMs: 10000
retryCount: 2
isEnabled: false
```

Only enable endpoints after the provider adapter can call them safely.

### 6. Credential setup

Supported credential types:

- `API_KEY`
- `SECRET_KEY`
- `MERCHANT_ID`
- `AGENT_ID`
- `WEBHOOK_SECRET`
- `TOKEN`

Credentials are stored encrypted and returned to admin UI as `maskedValue` only.

Credential update behavior:

- To rotate a secret, enter a new value.
- To change enabled status only, leave value blank in edit mode.
- Raw secrets are not returned by API.

### 7. Required safety before real provider launch

Before production activation, implement and test:

- provider adapter registry
- provider health check
- game launch with session tracking
- transfer wallet flow with ledger integration
- idempotency for every transfer
- webhook signature validation
- webhook idempotency
- reconciliation and mismatch recovery
- audit logs for high-risk changes

## Useful endpoints

Provider:

```text
GET    /admin/game-providers
GET    /admin/game-providers/:id
POST   /admin/game-providers
PATCH  /admin/game-providers/:id
```

Endpoint:

```text
GET    /admin/game-providers/:providerId/endpoints
POST   /admin/game-providers/:providerId/endpoints
PATCH  /admin/game-providers/:providerId/endpoints/:endpointId
```

Credential:

```text
GET    /admin/game-providers/:providerId/credentials
POST   /admin/game-providers/:providerId/credentials
PATCH  /admin/game-providers/:providerId/credentials/:credentialId
```

## Recommended next tasks

1. Provider adapter registry
2. Game catalog CRUD/sync base
3. Game image sync and fallback handling
4. Launch session API scaffold
5. Transfer wallet dry-run mode
6. Webhook log receive-only endpoint
