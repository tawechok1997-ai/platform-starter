#!/usr/bin/env bash
set -euo pipefail

API_URL="${API_URL:-}"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-10}"

if [ -z "${API_URL}" ]; then
  echo "ERROR: API_URL is required" >&2
  echo "Usage: API_URL='https://api-service.up.railway.app' ./scripts/check-health.sh" >&2
  exit 1
fi

API_URL="${API_URL%/}"

check_endpoint() {
  local path="$1"
  local url="${API_URL}${path}"
  local response_file
  response_file="$(mktemp)"
  local status
  status="$(curl -sS --max-time "${TIMEOUT_SECONDS}" -o "${response_file}" -w "%{http_code}" "${url}" || true)"

  if [ "${status}" -lt 200 ] || [ "${status}" -ge 300 ]; then
    echo "FAIL ${path} status=${status}" >&2
    cat "${response_file}" >&2 || true
    rm -f "${response_file}"
    return 1
  fi

  echo "OK ${path} status=${status}"
  cat "${response_file}"
  echo
  rm -f "${response_file}"
}

check_endpoint "/health"
check_endpoint "/version"
