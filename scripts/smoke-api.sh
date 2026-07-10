#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-http://localhost:4000}"
ADMIN_TOKEN="${ADMIN_TOKEN:-}"
MEMBER_TOKEN="${MEMBER_TOKEN:-}"

pass_count=0
fail_count=0

say() { printf '%s\n' "$*"; }

check_status() {
  local label="$1"
  local method="$2"
  local path="$3"
  local expected="$4"
  local token="${5:-}"
  local body="${6:-}"
  local url="${API_URL}${path}"
  local response_file
  response_file="$(mktemp)"

  local args=(-sS -o "$response_file" -w "%{http_code}" -X "$method" "$url")
  if [[ -n "$token" ]]; then args+=(-H "Authorization: Bearer $token"); fi
  if [[ -n "$body" ]]; then args+=(-H "Content-Type: application/json" --data "$body"); fi

  local status
  if ! status="$(curl "${args[@]}" 2>/tmp/platform-smoke-curl.err)"; then
    say "FAIL $label curl error: $(cat /tmp/platform-smoke-curl.err)"
    fail_count=$((fail_count + 1))
    rm -f "$response_file"
    return
  fi

  if [[ "$status" == "$expected" ]]; then
    say "PASS $label [$status]"
    pass_count=$((pass_count + 1))
  else
    say "FAIL $label expected $expected got $status"
    sed 's/^/  /' "$response_file" | head -c 600 || true
    printf '\n'
    fail_count=$((fail_count + 1))
  fi
  rm -f "$response_file"
}

say "Smoke testing API: $API_URL"
say "----------------------------------------"

check_status "health" "GET" "/health" "200"
check_status "version" "GET" "/version" "200"

say "----------------------------------------"
say "Anonymous protected endpoint checks"
check_status "admin dashboard requires auth" "GET" "/admin/finance/summary" "401"
check_status "admin reports requires auth" "GET" "/admin/reports/trends?days=7" "401"
check_status "admin queue aging requires auth" "GET" "/admin/reports/queue-aging" "401"
check_status "admin report export requires auth" "GET" "/admin/exports/report-trends.csv?days=7" "401"
check_status "admin audit requires auth" "GET" "/admin/audit-logs" "401"
check_status "admin activity requires auth" "GET" "/admin/activity/timeline" "401"
check_status "admin members requires auth" "GET" "/admin/members" "401"
check_status "admin wallets requires auth" "GET" "/admin/wallets" "401"
check_status "admin ledgers requires auth" "GET" "/admin/ledgers" "401"
check_status "admin topups requires auth" "GET" "/admin/topups" "401"
check_status "admin withdrawals requires auth" "GET" "/admin/withdrawals" "401"
check_status "admin risk alerts requires auth" "GET" "/admin/risk-alerts" "401"
check_status "admin access requires auth" "GET" "/admin/access/overview" "401"
check_status "admin sessions requires auth" "GET" "/admin/auth/sessions" "401"
check_status "admin 2fa setup requires auth" "POST" "/admin/auth/2fa/setup" "401"
check_status "admin 2fa disable requires auth" "POST" "/admin/auth/2fa/disable" "401" "" '{"code":"000000"}'
check_status "admin recovery regenerate requires auth" "POST" "/admin/auth/2fa/recovery-codes/regenerate" "401" "" '{"code":"000000"}'
check_status "member wallet requires auth" "GET" "/member/wallet" "401"
check_status "member topups requires auth" "GET" "/member/topups" "401"
check_status "member withdrawals requires auth" "GET" "/member/withdrawals" "401"

if [[ -n "$ADMIN_TOKEN" ]]; then
  say "----------------------------------------"
  say "Admin token pagination and security checks"
  check_status "admin me authorized" "GET" "/admin/auth/me" "200" "$ADMIN_TOKEN"
  check_status "admin sessions authorized" "GET" "/admin/auth/sessions" "200" "$ADMIN_TOKEN"
  check_status "admin reports trends authorized" "GET" "/admin/reports/trends?days=7" "200" "$ADMIN_TOKEN"
  check_status "admin queue aging authorized" "GET" "/admin/reports/queue-aging" "200" "$ADMIN_TOKEN"
  check_status "admin report trends export authorized" "GET" "/admin/exports/report-trends.csv?days=7" "200" "$ADMIN_TOKEN"
  check_status "admin reconciliation export authorized" "GET" "/admin/exports/reconciliation.csv?limit=1" "200" "$ADMIN_TOKEN"
  check_status "admin audit authorized" "GET" "/admin/audit-logs?page=1&take=1" "200" "$ADMIN_TOKEN"
  check_status "admin activity authorized" "GET" "/admin/activity/timeline?page=1&take=1" "200" "$ADMIN_TOKEN"
  check_status "admin activity filtered authorized" "GET" "/admin/activity/timeline?page=1&take=1&type=AUDIT&search=admin" "200" "$ADMIN_TOKEN"
  check_status "admin members authorized" "GET" "/admin/members?page=1&take=1" "200" "$ADMIN_TOKEN"
  check_status "admin wallets authorized" "GET" "/admin/wallets?page=1&take=1" "200" "$ADMIN_TOKEN"
  check_status "admin topups authorized" "GET" "/admin/topups?page=1&take=1" "200" "$ADMIN_TOKEN"
  check_status "admin withdrawals authorized" "GET" "/admin/withdrawals?page=1&take=1" "200" "$ADMIN_TOKEN"
  check_status "admin ledgers authorized" "GET" "/admin/ledgers?page=1&take=1" "200" "$ADMIN_TOKEN"
  check_status "admin risk alerts authorized" "GET" "/admin/risk-alerts?page=1&take=1" "200" "$ADMIN_TOKEN"
  check_status "admin finance summary authorized" "GET" "/admin/finance/summary" "200" "$ADMIN_TOKEN"
fi

if [[ -n "$MEMBER_TOKEN" ]]; then
  say "----------------------------------------"
  say "Member token checks"
  check_status "member wallet authorized" "GET" "/member/wallet" "200" "$MEMBER_TOKEN"
  check_status "member topups authorized" "GET" "/member/topups" "200" "$MEMBER_TOKEN"
  check_status "member withdrawals authorized" "GET" "/member/withdrawals" "200" "$MEMBER_TOKEN"
fi

say "----------------------------------------"
say "Smoke result: ${pass_count} passed, ${fail_count} failed"

if [[ "$fail_count" -gt 0 ]]; then
  exit 1
fi
