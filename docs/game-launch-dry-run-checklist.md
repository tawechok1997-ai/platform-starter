# Game Launch Dry-run Checklist

This checklist covers the first playable dry-run flow. No real wallet transfer is enabled yet.

## Build checks

```bash
pnpm prisma generate
pnpm build:api
pnpm build:web-admin
pnpm build:web-member
pnpm test:e2e:smoke
```

## Setup

1. Confirm API/Web variables point to the same Railway domain set.
2. Run DB push/generate if schema is not already applied.
3. Seed demo games if needed:

```bash
pnpm db:seed:games
```

4. In Admin `/game-providers`, activate `demo-provider`.
5. Enable at least the LAUNCH endpoint for demo-provider.
6. Confirm `DemoProviderAdapter` is registered.

## Member launch flow

1. Log in as member.
2. Open `/games`.
3. Click `เล่น` on an active game.
4. Confirm the member app calls:

```text
POST /member/games/:gameId/launch
```

5. Confirm API creates `GameSession` with `CREATED` first.
6. Confirm API calls `DemoProviderAdapter.launchGame()`.
7. Confirm API updates session to `LAUNCHED`.
8. Confirm response includes:

```text
launchUrl
providerSessionId
session
```

## Admin session log

1. Open Admin `/game-sessions`.
2. Confirm latest session appears.
3. Confirm game/provider/user/status are visible.
4. Confirm providerSessionId is visible.
5. Confirm failed launches show errorCode/errorMessage.

## Safety notes

- This flow does not debit or credit wallet.
- This flow does not call real provider APIs unless a real adapter is intentionally registered.
- Transfers, webhooks, and reconciliation must be completed before enabling real-money gameplay.
