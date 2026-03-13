#!/usr/bin/env bash
set -euo pipefail

DB_HOST="${POSTGRES_HOST:-localhost}"
DB_PORT="${POSTGRES_PORT:-5432}"
MAX_WAIT=30
elapsed=0

echo "Checking database at ${DB_HOST}:${DB_PORT}..."

while ! nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
  if [ "$elapsed" -ge "$MAX_WAIT" ]; then
    echo "ERROR: Database not reachable at ${DB_HOST}:${DB_PORT} after ${MAX_WAIT}s." >&2
    echo "Make sure your database container is running: docker compose up -d db" >&2
    exit 1
  fi
  echo "  Waiting for database... (${elapsed}s)"
  sleep 2
  elapsed=$((elapsed + 2))
done

echo "Database ready. Starting dev server..."
npm run dev
