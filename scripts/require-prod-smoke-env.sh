#!/usr/bin/env bash
set -euo pipefail

missing=()

for name in PROD_BASE_URL PROD_ADMIN_TOKEN PROD_MEMBER_TOKEN; do
  if [[ -z "${!name:-}" ]]; then
    missing+=("$name")
  fi
done

if (( ${#missing[@]} > 0 )); then
  printf 'Production smoke configuration is incomplete. Missing: %s\n' "${missing[*]}" >&2
  exit 1
fi

printf 'Production smoke credentials are present.\n'
