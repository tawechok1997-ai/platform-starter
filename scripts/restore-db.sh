#!/usr/bin/env bash
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is required" >&2
  echo "Usage: DATABASE_URL='postgresql://...' BACKUP_FILE='backups/platform/platform-latest.dump' ./scripts/restore-db.sh" >&2
  exit 1
fi

if [ -z "${BACKUP_FILE:-}" ]; then
  echo "ERROR: BACKUP_FILE is required" >&2
  exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "ERROR: backup file not found: ${BACKUP_FILE}" >&2
  exit 1
fi

if ! command -v pg_restore >/dev/null 2>&1; then
  echo "ERROR: pg_restore is not installed" >&2
  exit 1
fi

CONFIRM_TARGET="${CONFIRM_TARGET:-staging}"

if [ "${CONFIRM_TARGET}" != "staging" ]; then
  echo "ERROR: restore is blocked unless CONFIRM_TARGET=staging" >&2
  echo "This script is intentionally guarded to avoid production restore accidents." >&2
  exit 1
fi

echo "Restore target confirmed: ${CONFIRM_TARGET}"
echo "Backup file: ${BACKUP_FILE}"
echo "Starting restore..."

pg_restore \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  --dbname="${DATABASE_URL}" \
  "${BACKUP_FILE}"

echo "Restore completed"
