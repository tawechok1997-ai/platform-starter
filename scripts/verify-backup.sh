#!/usr/bin/env bash
set -euo pipefail

if [ -z "${BACKUP_FILE:-}" ]; then
  echo "ERROR: BACKUP_FILE is required" >&2
  echo "Usage: BACKUP_FILE='backups/platform/platform-latest.dump' ./scripts/verify-backup.sh" >&2
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

BYTES="$(wc -c < "${BACKUP_FILE}" | tr -d ' ')"
if [ "${BYTES}" -le 0 ]; then
  echo "ERROR: backup file is empty" >&2
  exit 1
fi

echo "Backup file: ${BACKUP_FILE}"
echo "Bytes: ${BYTES}"
echo "SHA256:"
sha256sum "${BACKUP_FILE}"
echo "Checking PostgreSQL archive structure..."
pg_restore --list "${BACKUP_FILE}" >/dev/null
OBJECT_COUNT="$(pg_restore --list "${BACKUP_FILE}" | awk 'NF && $1 !~ /^;/ { count++ } END { print count + 0 }')"
if [ "${OBJECT_COUNT}" -le 0 ]; then
  echo "ERROR: backup contains no restorable objects" >&2
  exit 1
fi

echo "Backup verification passed"
echo "Objects: ${OBJECT_COUNT}"
