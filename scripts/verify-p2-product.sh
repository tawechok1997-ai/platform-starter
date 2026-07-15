#!/usr/bin/env bash
set -euo pipefail

printf 'Running P2 repository verification...\n'

pnpm audit:admin-permissions
pnpm audit:admin-ui-permissions
pnpm --filter @platform/api exec jest --runInBand
pnpm --filter @platform/api test:db:promotions
pnpm --filter @platform/api test:db:risk-watchlist
pnpm --filter @platform/api test:db:kyc
pnpm build:api
pnpm build:web-admin
pnpm build:web-member

printf 'P2 repository verification passed.\n'
printf 'Authenticated browser and deployed-provider checks remain environment-gated and are tracked in docs/p2-closure-report.md.\n'
