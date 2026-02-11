#!/usr/bin/env bash
set -euo pipefail

if ! command -v pg_restore >/dev/null 2>&1; then
  echo "pg_restore is required but not installed."
  exit 1
fi

BACKUP_FILE="${1:-}"
TARGET_DATABASE_URL="${2:-${DATABASE_URL_RESTORE:-${DIRECT_DATABASE_URL:-${DATABASE_URL:-}}}}"

if [[ -z "$BACKUP_FILE" ]]; then
  echo "Usage: $0 <backup.dump|backup.dump.gz> [target_database_url]"
  exit 1
fi

if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "Backup file not found: $BACKUP_FILE"
  exit 1
fi

if [[ -z "$TARGET_DATABASE_URL" ]]; then
  echo "Target database URL is required via arg2 or DATABASE_URL_RESTORE."
  exit 1
fi

if [[ "${DB_RESTORE_CONFIRM:-}" != "YES" ]]; then
  echo "Restore is destructive. Re-run with DB_RESTORE_CONFIRM=YES."
  exit 1
fi

WORK_FILE="$BACKUP_FILE"
TEMP_FILE=""

cleanup() {
  if [[ -n "$TEMP_FILE" ]] && [[ -f "$TEMP_FILE" ]]; then
    rm -f "$TEMP_FILE"
  fi
}
trap cleanup EXIT

if [[ "$BACKUP_FILE" == *.gz ]]; then
  if ! command -v gunzip >/dev/null 2>&1; then
    echo "gunzip is required to restore .gz backups."
    exit 1
  fi
  TEMP_FILE="$(mktemp /tmp/risebyeden-restore-XXXXXX.dump)"
  gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
  WORK_FILE="$TEMP_FILE"
fi

echo "Restoring backup ${BACKUP_FILE} to target database ..."
pg_restore \
  --dbname="$TARGET_DATABASE_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  "$WORK_FILE"

echo "Restore completed successfully."
