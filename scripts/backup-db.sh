#!/usr/bin/env bash
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "ERROR: DATABASE_URL is required" >&2
  echo "Usage: DATABASE_URL='postgresql://...' ./scripts/backup-db.sh" >&2
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "ERROR: pg_dump is not installed" >&2
  exit 1
fi

BACKUP_DIR="${BACKUP_DIR:-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
APP_NAME="${APP_NAME:-platform}"
TIMESTAMP="$(date -u +%Y%m%d-%H%M%S)"
OUTPUT_DIR="${BACKUP_DIR}/${APP_NAME}"
OUTPUT_FILE="${OUTPUT_DIR}/${APP_NAME}-${TIMESTAMP}.dump"
LATEST_FILE="${OUTPUT_DIR}/${APP_NAME}-latest.dump"

mkdir -p "${OUTPUT_DIR}"

echo "Creating database backup..."
pg_dump "${DATABASE_URL}" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="${OUTPUT_FILE}"

cp "${OUTPUT_FILE}" "${LATEST_FILE}"

if [ "${RETENTION_DAYS}" != "0" ]; then
  find "${OUTPUT_DIR}" -type f -name "${APP_NAME}-*.dump" -mtime "+${RETENTION_DAYS}" -not -name "${APP_NAME}-latest.dump" -delete
fi

BYTES="$(wc -c < "${OUTPUT_FILE}" | tr -d ' ')"

echo "Backup completed"
echo "File: ${OUTPUT_FILE}"
echo "Bytes: ${BYTES}"
echo "Latest: ${LATEST_FILE}"
