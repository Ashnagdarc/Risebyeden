#!/usr/bin/env bash
set -euo pipefail

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "pg_dump is required but not installed."
  exit 1
fi

if ! command -v gzip >/dev/null 2>&1; then
  echo "gzip is required but not installed."
  exit 1
fi

DATABASE_URL_INPUT="${DIRECT_DATABASE_URL:-${DATABASE_URL:-}}"
if [[ -z "$DATABASE_URL_INPUT" ]]; then
  echo "Set DIRECT_DATABASE_URL or DATABASE_URL before running backups."
  exit 1
fi

BACKUP_DIR="${DB_BACKUP_DIR:-backups}"
KEEP_DAYS="${DB_BACKUP_KEEP_DAYS:-14}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
BASENAME="risebyeden_${TIMESTAMP}"
DUMP_PATH="${BACKUP_DIR}/${BASENAME}.dump"
GZIP_PATH="${DUMP_PATH}.gz"

mkdir -p "$BACKUP_DIR"

echo "Creating backup at ${DUMP_PATH} ..."
pg_dump \
  --dbname="$DATABASE_URL_INPUT" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="$DUMP_PATH"

gzip -f "$DUMP_PATH"

if command -v sha256sum >/dev/null 2>&1; then
  sha256sum "$GZIP_PATH" > "${GZIP_PATH}.sha256"
elif command -v shasum >/dev/null 2>&1; then
  shasum -a 256 "$GZIP_PATH" > "${GZIP_PATH}.sha256"
fi

echo "Backup created: ${GZIP_PATH}"

if [[ "$KEEP_DAYS" =~ ^[0-9]+$ ]] && [[ "$KEEP_DAYS" -gt 0 ]]; then
  find "$BACKUP_DIR" -type f \( -name 'risebyeden_*.dump.gz' -o -name 'risebyeden_*.dump.gz.sha256' \) -mtime +"$KEEP_DAYS" -delete || true
  echo "Retention cleanup complete (>${KEEP_DAYS} days)."
fi
