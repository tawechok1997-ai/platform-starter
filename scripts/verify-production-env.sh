#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-}"
REQUIRED_ENV=(
  DATABASE_URL
  JWT_ACCESS_KEY
  TWO_FACTOR_ENCRYPTION_KEY
  GAME_CREDENTIAL_SECRET
  ANTIBOT_ENCRYPTION_KEY
  STORAGE_SIGNING_SECRET
  PASSWORD_RESET_DELIVERY_WEBHOOK_URL
  PASSWORD_RESET_DELIVERY_WEBHOOK_SECRET
  ADMIN_JWT_ACCESS_TTL
  ADMIN_REFRESH_TTL_HOURS
  MEMBER_WEB_URL
  ADMIN_WEB_URL
  PRIVATE_MEDIA_DIR
)
OPTIONAL_PROD_ENV=(
  REDIS_URL
  STORAGE_DRIVER
  S3_ENDPOINT
  S3_REGION
  S3_BUCKET
  S3_ACCESS_KEY_ID
  S3_SECRET_ACCESS_KEY
  S3_FORCE_PATH_STYLE
)

pass_count=0
warn_count=0
fail_count=0

say() { printf '%s\n' "$*"; }
pass() { say "PASS $*"; pass_count=$((pass_count + 1)); }
warn() { say "WARN $*"; warn_count=$((warn_count + 1)); }
fail() { say "FAIL $*"; fail_count=$((fail_count + 1)); }

check_env_present() {
  local name="$1"
  if [[ -n "${!name:-}" ]]; then pass "env $name is set"; else fail "env $name is missing"; fi
}

check_env_optional() {
  local name="$1"
  if [[ -n "${!name:-}" ]]; then pass "env $name is set"; else warn "env $name is not set"; fi
}

check_url() {
  local label="$1"
  local url="$2"
  if [[ "$url" =~ ^https?:// ]]; then pass "$label looks like a URL"; else warn "$label does not look like an HTTP URL"; fi
}

say "Production env verification"
say "----------------------------------------"

for name in "${REQUIRED_ENV[@]}"; do check_env_present "$name"; done
for name in "${OPTIONAL_PROD_ENV[@]}"; do check_env_optional "$name"; done

if [[ -n "${MEMBER_WEB_URL:-}" ]]; then check_url "MEMBER_WEB_URL" "$MEMBER_WEB_URL"; fi
if [[ -n "${ADMIN_WEB_URL:-}" ]]; then check_url "ADMIN_WEB_URL" "$ADMIN_WEB_URL"; fi
if [[ -n "${PASSWORD_RESET_DELIVERY_WEBHOOK_URL:-}" ]]; then
  check_url "PASSWORD_RESET_DELIVERY_WEBHOOK_URL" "$PASSWORD_RESET_DELIVERY_WEBHOOK_URL"
fi
if [[ -n "${API_URL:-}" ]]; then check_url "API_URL" "$API_URL"; fi

say "----------------------------------------"
say "Storage checks"
case "${STORAGE_DRIVER:-local}" in
  local)
    pass "storage driver is local"
    if [[ -n "${PRIVATE_MEDIA_DIR:-}" ]]; then pass "PRIVATE_MEDIA_DIR configured"; fi
    ;;
  s3)
    pass "storage driver is s3"
    for name in S3_ENDPOINT S3_BUCKET S3_ACCESS_KEY_ID S3_SECRET_ACCESS_KEY; do
      if [[ -n "${!name:-}" ]]; then pass "s3 $name is set"; else fail "s3 $name is missing"; fi
    done
    ;;
  *)
    fail "unknown STORAGE_DRIVER=${STORAGE_DRIVER:-}"
    ;;
esac

say "----------------------------------------"
say "Redis checks"
if [[ -n "${REDIS_URL:-}" ]]; then
  pass "REDIS_URL configured"
else
  warn "REDIS_URL missing, API will fall back to memory rate limits"
fi

if [[ -n "$API_URL" ]]; then
  say "----------------------------------------"
  say "API reachability checks"
  if curl -fsS "$API_URL/health" >/dev/null; then pass "GET /health reachable"; else fail "GET /health failed"; fi
  if curl -fsS "$API_URL/version" >/dev/null; then pass "GET /version reachable"; else fail "GET /version failed"; fi
fi

say "----------------------------------------"
say "Verification result: ${pass_count} passed, ${warn_count} warnings, ${fail_count} failed"

if [[ "$fail_count" -gt 0 ]]; then exit 1; fi
