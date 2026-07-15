#!/usr/bin/env bash
set -euo pipefail

printf 'Verifying P3 provider code readiness...\n'

pnpm audit:finance-workflows
pnpm audit:admin-permissions
pnpm --filter @platform/api exec jest --runInBand
pnpm build:api

printf '\nP3 provider code-readiness verification passed.\n'
printf 'External vendor endpoint, credentials, network allowlisting, callback registration, and provider-specific UAT remain environment-owned checks.\n'
