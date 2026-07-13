#!/usr/bin/env bash
set -euo pipefail

required=(
  PROD_BASE_URL
  PROD_ADMIN_TOKEN
  PROD_MEMBER_TOKEN
  RATE_LIMIT_TEST_URL
)

missing=()
for name in "${required[@]}"; do
  if [[ -z "${!name:-}" ]]; then
    missing+=("$name")
  fi
done

if (( ${#missing[@]} > 0 )); then
  printf 'P1 production verification is blocked. Missing: %s\n' "${missing[*]}" >&2
  exit 2
fi

printf 'Running P1 production verification against %s\n' "$PROD_BASE_URL"

pnpm audit:admin-permissions
pnpm audit:admin-ui-permissions
pnpm audit:admin-token-storage
pnpm audit:admin-xss
pnpm test:proxy-rate-limit
pnpm test:e2e:smoke:strict

printf 'P1 production verification completed successfully.\n'
