# Game Catalog QA Checklist

Use this checklist after provider, catalog, media, sync, and member lobby changes.

## Build checks

```bash
pnpm prisma generate
pnpm build:api
pnpm build:web-admin
pnpm build:web-member
pnpm test:e2e:smoke
```

Optional seed:

```bash
pnpm db:seed:games
```

## Admin Game Providers

- Open `/game-providers`.
- Select `demo-provider`.
- Confirm readiness checklist renders.
- Click `Test Connection`.
- Confirm health result is shown.
- Click `Sync Games`.
- Confirm result shows created/updated/skipped counts.
- Refresh and confirm provider game count changed.

## Admin Game Catalog

- Open `/games`.
- Confirm games load from `/admin/games`.
- Create a manual game.
- Edit game name/category/status.
- Toggle Active/Maintenance.
- Toggle Featured/New/Popular.
- Add media URL as COVER.
- Confirm media count increases in the game card.

## Member Game Lobby

- Log in as member.
- Open `/games`.
- Confirm lobby loads from `/member/games`.
- Confirm categories render.
- Confirm Featured/New/Popular sections render when data exists.
- Confirm game cards show provider name and media/fallback.
- Confirm play button is disabled and labeled as coming soon.

## Safety notes

- Sync Games is dry-run/safe adapter flow only for now.
- Member lobby does not launch games yet.
- Wallet transfer and provider webhook processing are not enabled yet.
- Do not enable real-money launch/transfer until session, idempotency, webhook validation, and reconciliation are complete.
