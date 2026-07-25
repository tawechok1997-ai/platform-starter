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

mode="${PROD_SMOKE_MODE:-read-only}"
case "$mode" in
  read-only|mutations) ;;
  *)
    printf 'PROD_SMOKE_MODE must be read-only or mutations.\n' >&2
    exit 1
    ;;
esac

url_report="$({
  PROD_SMOKE_URL="$PROD_BASE_URL" node <<'NODE'
const raw = String(process.env.PROD_SMOKE_URL ?? '').trim();
try {
  const url = new URL(raw);
  const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '::1';
  if (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) {
    throw new Error('must use HTTPS except for localhost');
  }
  if (url.username || url.password) throw new Error('must not embed credentials');
  if (url.hash) throw new Error('must not include a fragment');
  if (!url.hostname) throw new Error('must include a hostname');
  process.stdout.write(url.hostname.toLowerCase());
} catch (error) {
  process.stderr.write(`PROD_BASE_URL is invalid: ${error instanceof Error ? error.message : 'invalid URL'}\n`);
  process.exit(1);
}
NODE
} 2>&1)" || {
  printf '%s\n' "$url_report" >&2
  exit 1
}
base_hostname="$url_report"

if [[ -n "${PROD_SMOKE_ALLOWED_HOSTS:-}" ]]; then
  host_allowed=0
  IFS=',' read -r -a allowed_hosts <<< "$PROD_SMOKE_ALLOWED_HOSTS"
  for raw_host in "${allowed_hosts[@]}"; do
    allowed_host="$(printf '%s' "$raw_host" | tr '[:upper:]' '[:lower:]' | xargs)"
    [[ -z "$allowed_host" ]] && continue
    if [[ "$base_hostname" == "$allowed_host" ]]; then
      host_allowed=1
      break
    fi
  done
  if [[ "$host_allowed" -ne 1 ]]; then
    printf 'PROD_BASE_URL host is not included in PROD_SMOKE_ALLOWED_HOSTS.\n' >&2
    exit 1
  fi
fi

validate_token() {
  local name="$1"
  local value="${!name}"
  if (( ${#value} < 24 )); then
    printf '%s is too short for a production access token.\n' "$name" >&2
    exit 1
  fi
  if [[ "$value" =~ [[:space:]] ]]; then
    printf '%s must not contain whitespace.\n' "$name" >&2
    exit 1
  fi
}

validate_token PROD_ADMIN_TOKEN
validate_token PROD_MEMBER_TOKEN

if [[ "$PROD_ADMIN_TOKEN" == "$PROD_MEMBER_TOKEN" ]]; then
  printf 'Admin and Member smoke tokens must be different.\n' >&2
  exit 1
fi

if [[ "$mode" == "mutations" ]]; then
  if [[ "${PROD_SMOKE_ALLOW_MUTATIONS:-}" != "I_ACKNOWLEDGE_PRODUCTION_MUTATIONS" ]]; then
    printf 'Mutation smoke requires PROD_SMOKE_ALLOW_MUTATIONS=I_ACKNOWLEDGE_PRODUCTION_MUTATIONS.\n' >&2
    exit 1
  fi
  if [[ ! "${PROD_SMOKE_TEST_ACCOUNT_ID:-}" =~ ^[0-9a-fA-F-]{36}$ ]]; then
    printf 'Mutation smoke requires a UUID PROD_SMOKE_TEST_ACCOUNT_ID.\n' >&2
    exit 1
  fi
  if [[ ! "${PROD_SMOKE_IDEMPOTENCY_PREFIX:-}" =~ ^smoke-[a-zA-Z0-9._-]{8,64}$ ]]; then
    printf 'Mutation smoke requires PROD_SMOKE_IDEMPOTENCY_PREFIX beginning with smoke- and 8-64 safe suffix characters.\n' >&2
    exit 1
  fi
  max_amount="${PROD_SMOKE_MAX_AMOUNT:-0}"
  if ! node -e 'const n=Number(process.argv[1]); if (!Number.isFinite(n) || n <= 0 || n > 100) process.exit(1)' "$max_amount"; then
    printf 'Mutation smoke requires PROD_SMOKE_MAX_AMOUNT greater than 0 and not above 100.\n' >&2
    exit 1
  fi
fi

printf 'Production smoke environment validated for host %s in %s mode.\n' "$base_hostname" "$mode"
