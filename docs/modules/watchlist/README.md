# Watchlist Module README

## Scope

Watchlist covers blacklist/watchlist entries, HMAC matching, duplicate protection, override/release lifecycle, reason taxonomy, and enforcement across registration, profile, bank, and withdrawal flows.

## Primary implementation

- `apps/api/src/modules/risk-alerts/risk-watchlist.controller.ts` — admin API surface.
- `apps/api/src/modules/risk-alerts/risk-watchlist-command.service.ts` — create, update, override, release, and command behavior.
- `apps/api/src/modules/risk-alerts/risk-watchlist-query.service.ts` — list/detail query behavior.
- `apps/api/src/modules/risk-alerts/risk-watchlist.service.ts` and `risk-enforcement.service.ts` — matching and enforcement support.
- `apps/api/src/modules/auth/member-risk-enforcement.service.ts` and `apps/api/src/modules/withdrawals/withdrawal-risk-enforcement.service.ts` — cross-flow enforcement.

## Safety boundaries

- Raw sensitive identifiers must not be stored when HMAC matching is required.
- Overrides/releases require reason and audit evidence.
- Enforcement checks must run before allowing risky registration/profile/bank/withdrawal operations.

## Regression evidence to keep current

- `pnpm --filter @platform/api test -- risk-watchlist-command.service.spec.ts risk-watchlist.service.spec.ts risk-enforcement.service.spec.ts withdrawal-risk-enforcement.service.spec.ts --runInBand`
- `pnpm --filter @platform/api test -- src/modules/risk-alerts/risk-watchlist-concurrency.db.spec.ts --runInBand`
