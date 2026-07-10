# Game Platform Data Model Plan

This document captures the first backend scaffold for game provider integration. It is intentionally a plan/scaffold before enabling real provider API calls or wallet transfer logic.

## Core models

### GameProvider

Stores provider profile and runtime mode.

Fields:

- `id`
- `name`
- `code`
- `logoUrl`
- `status`: `ACTIVE`, `INACTIVE`, `MAINTENANCE`, `DEGRADED`
- `walletMode`: `SEAMLESS`, `TRANSFER`, `HYBRID`
- `currency`
- `timezone`
- `sortOrder`
- `metadata`
- `createdAt`
- `updatedAt`

### GameProviderEndpoint

Maps provider-specific endpoints into internal endpoint types.

Endpoint types:

- `LAUNCH`
- `BALANCE`
- `TRANSFER_IN`
- `TRANSFER_OUT`
- `GAME_LIST`
- `BET_HISTORY`
- `WEBHOOK`
- `HEALTH_CHECK`

Fields:

- `id`
- `providerId`
- `type`
- `url`
- `method`
- `timeoutMs`
- `retryCount`
- `isEnabled`
- `createdAt`
- `updatedAt`

### GameProviderCredential

Stores encrypted provider credentials. Never expose raw values in API responses.

Credential types:

- `API_KEY`
- `SECRET_KEY`
- `MERCHANT_ID`
- `AGENT_ID`
- `WEBHOOK_SECRET`
- `TOKEN`

Fields:

- `id`
- `providerId`
- `type`
- `encryptedValue`
- `maskedValue`
- `isEnabled`
- `rotatedAt`
- `createdAt`
- `updatedAt`

### Game

Internal normalized game catalog record.

Fields:

- `id`
- `providerId`
- `providerGameCode`
- `name`
- `category`
- `status`
- `isFeatured`
- `isNew`
- `isPopular`
- `sortOrder`
- `metadata`
- `createdAt`
- `updatedAt`

### GameMedia

Stores remote and cached media references for games/providers.

Media types:

- `COVER`
- `ICON`
- `THUMBNAIL`
- `BANNER`
- `LOGO`
- `FALLBACK`

Fields:

- `id`
- `gameId`
- `providerId`
- `type`
- `sourceUrl`
- `cachedUrl`
- `status`: `PENDING`, `READY`, `BROKEN`, `FALLBACK`
- `isOverride`
- `metadata`
- `createdAt`
- `updatedAt`

### GameSession

Tracks member game launch/session lifecycle.

Fields:

- `id`
- `userId`
- `providerId`
- `gameId`
- `status`: `CREATED`, `LAUNCHED`, `ACTIVE`, `ENDED`, `FAILED`, `EXPIRED`
- `launchUrl`
- `providerSessionId`
- `ipAddress`
- `userAgent`
- `startedAt`
- `endedAt`
- `errorCode`
- `errorMessage`
- `createdAt`
- `updatedAt`

### GameTransfer

Tracks transfer wallet operations and wallet sync/recovery.

Fields:

- `id`
- `userId`
- `providerId`
- `sessionId`
- `type`: `TRANSFER_IN`, `TRANSFER_OUT`, `SYNC`, `ROLLBACK`, `ADJUSTMENT`
- `status`: `PENDING`, `SUCCESS`, `FAILED`, `REVERSED`, `CANCELLED`
- `amount`
- `currency`
- `idempotencyKey`
- `providerTransactionId`
- `requestPayload`
- `responsePayload`
- `errorCode`
- `errorMessage`
- `createdAt`
- `updatedAt`

### ProviderWalletSnapshot

Stores balance comparison between internal wallet and provider wallet.

Fields:

- `id`
- `userId`
- `providerId`
- `systemBalance`
- `providerBalance`
- `difference`
- `status`: `MATCHED`, `MISMATCH`, `UNKNOWN`
- `rawPayload`
- `checkedAt`
- `createdAt`

### WebhookLog

Stores provider webhook/callback events and processing results.

Fields:

- `id`
- `providerId`
- `eventType`
- `status`: `RECEIVED`, `PROCESSED`, `FAILED`, `DUPLICATE`, `IGNORED`, `RESOLVED`
- `signatureValid`
- `idempotencyKey`
- `providerTransactionId`
- `rawPayload`
- `normalizedPayload`
- `responseStatus`
- `retryCount`
- `errorCode`
- `errorMessage`
- `createdAt`
- `processedAt`

## API-side adapter contract

The API scaffold includes `GameProviderAdapter` with these required methods:

- `healthCheck()`
- `launchGame()`
- `getBalance()`
- `transferIn()`
- `transferOut()`
- `syncGames()`
- `getBetHistory()`
- `validateWebhook()`
- `parseWebhook()`

## Safety requirements

- Store raw secrets encrypted only.
- Return only masked secret values to admin UI.
- Use `idempotencyKey` for every transfer/callback operation.
- Store provider request/response payloads with secret masking.
- Do not debit/credit wallet twice on retry.
- Treat failed transfer and provider balance mismatch as incident records.
- Do not enable real provider transfer until ledger/reconciliation is implemented.

## Current implementation status

- API TypeScript model scaffold: added.
- API adapter interface: added.
- API module/controller/service scaffold: added.
- Real Prisma schema persistence: pending.
- Real provider calls: pending.
- Real wallet transfer/reconciliation: pending.
