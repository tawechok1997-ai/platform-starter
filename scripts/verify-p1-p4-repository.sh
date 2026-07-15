#!/usr/bin/env bash
set -euo pipefail

printf 'Running combined P1-P4 repository verification...\n'

printf '\n[P1] Security and permission repository checks\n'
pnpm audit:admin-permissions
pnpm audit:admin-ui-permissions
pnpm audit:admin-token-storage
pnpm audit:admin-xss

printf '\n[P2] Product and database regression checks\n'
pnpm --filter @platform/api exec jest --runInBand
pnpm --filter @platform/api test:db:finance
pnpm --filter @platform/api test:db:promotions
pnpm --filter @platform/api test:db:phone-otp
pnpm --filter @platform/api test:db:risk-watchlist
pnpm --filter @platform/api test:db:kyc

printf '\n[P3] Provider code-readiness checks\n'
pnpm audit:finance-workflows
pnpm --filter @platform/api exec jest provider-readiness.spec.ts --runInBand

printf '\n[P4] Architecture and cleanup closure checks\n'
pnpm audit:p4-closure
pnpm audit:r14-cleanup-inventory

printf '\n[Build] Typecheck and build all runtime applications\n'
pnpm typecheck
pnpm build:api
pnpm build:web-admin
pnpm build:web-member

printf '\nP1-P4 repository verification passed.\n'
printf 'Environment-owned checks remain: deployed browser regressions, production migrations, vendor credentials/network allowlisting and provider-specific UAT.\n'
