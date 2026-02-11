#!/usr/bin/env bash
set -euo pipefail

BASE_REF="${GITHUB_BASE_REF:-}"

if [[ -n "$BASE_REF" ]]; then
  git fetch --no-tags --prune --depth=1 origin "$BASE_REF"
  RANGE="origin/$BASE_REF...HEAD"
elif git rev-parse --verify HEAD~1 >/dev/null 2>&1; then
  RANGE="HEAD~1...HEAD"
else
  RANGE=""
fi

if [[ -z "$RANGE" ]]; then
  echo "No diff range available; skipping Prisma migration drift check."
  exit 0
fi

CHANGED_FILES="$(git diff --name-only "$RANGE")"
SCHEMA_CHANGED=false
MIGRATION_CHANGED=false

while IFS= read -r file; do
  [[ -z "$file" ]] && continue
  if [[ "$file" == "prisma/schema.prisma" ]]; then
    SCHEMA_CHANGED=true
  fi
  if [[ "$file" == prisma/migrations/*/migration.sql ]]; then
    MIGRATION_CHANGED=true
  fi
done <<< "$CHANGED_FILES"

if [[ "$SCHEMA_CHANGED" == true && "$MIGRATION_CHANGED" == false ]]; then
  echo "Prisma schema changed but no migration SQL was added."
  echo "Add a migration under prisma/migrations/<timestamp_name>/migration.sql."
  exit 1
fi

echo "Prisma migration drift check passed."
