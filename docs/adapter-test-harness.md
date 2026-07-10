# Adapter Test Harness

The Adapter Test Harness is an admin tool for testing provider adapters method by method before connecting real money flows.

## Admin page

```text
/apps/web-admin/app/(admin)/adapter-test/page.tsx
```

Route:

```text
/adapter-test
```

## API endpoints

```text
GET  /admin/game-providers/:providerId/adapter-test
POST /admin/game-providers/:providerId/adapter-test/:method
```

Supported methods:

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

## What it shows

The response includes:

```text
provider code
method
latencyMs
sanitized input
sanitized adapter result
checkedAt
```

Secrets, signatures, encrypted values, and credential maps are redacted before showing results.

## Recommended test order

1. `healthCheck`
2. `syncGames`
3. `launchGame`
4. `getBalance`
5. `transferIn`
6. `transferOut`
7. `validateWebhook`
8. `parseWebhook`

## Why this exists

Real providers fail in many boring ways: wrong endpoint, wrong signature, missing merchant ID, unexpected response shape, timeout, duplicate transaction ID, or documentation that was apparently written during a power outage.

This harness isolates provider adapter behavior from member UI and wallet workflows so integration bugs can be diagnosed faster.
