# Database Ops Runbook

This runbook defines production database operations for Risebyeden.

## Stack assumptions

- PostgreSQL 16+
- Prisma migrations (`prisma/migrations`)
- App runtime via Next.js API routes
- Optional pooling via PgBouncer/managed pooler

## 1) Backups

### Backup command

```bash
npm run db:backup
```

This executes `scripts/db-backup.sh` and creates:

- `backups/risebyeden_<UTC_TIMESTAMP>.dump.gz`
- checksum file (`.sha256`) when checksum tooling is available

### Backup env vars

- `DIRECT_DATABASE_URL` (preferred)
- `DATABASE_URL` (fallback)
- `DB_BACKUP_DIR` (optional, default `backups`)
- `DB_BACKUP_KEEP_DAYS` (optional, default `14`)

### Backup policy

- Daily logical backup at minimum.
- Keep at least 14 days of rolling backups.
- Replicate backups off-host/object storage.

## 2) Restore drills

### Restore command

```bash
DB_RESTORE_CONFIRM=YES npm run db:restore -- backups/<file>.dump.gz "<target_database_url>"
```

This executes `scripts/db-restore.sh` using `pg_restore` with `--clean --if-exists`.

Restore target resolution order:

1. second CLI arg (`<target_database_url>`)
2. `DATABASE_URL_RESTORE`
3. `DIRECT_DATABASE_URL`
4. `DATABASE_URL`

### Drill policy

- Weekly restore drill to non-production target.
- Validate application startup against restored snapshot.
- Record restore start/end times and success/failure.

## 3) Migration rollback strategy

Prisma migrations are forward-only by default. Rollback strategy is operational:

1. Stop writes (maintenance mode or write-blocking middleware).
2. Capture immediate backup (`npm run db:backup`).
3. If migration partially failed, reconcile migration state first:
   - `npx prisma migrate resolve --rolled-back <migration_name>`
   - or `--applied <migration_name>` only when DB already matches migration changes.
4. Restore last known-good backup if needed.
5. Re-run `npx prisma migrate status` and `npx prisma migrate deploy` after fix.

## 4) Connection pooling / PgBouncer guidance

Recommended production topology:

- App connections -> PgBouncer transaction pool
- Prisma migrate/maintenance -> direct Postgres connection

Recommended env layout:

- `DATABASE_URL` = pooled URL (runtime)
- `DIRECT_DATABASE_URL` = direct DB URL (migrations/maintenance)

If using transaction pooling, keep Prisma query patterns compatible with pooling and monitor transaction duration.

## 5) Monitoring and alerts

### Monitoring command

```bash
npm run db:monitor
```

This executes `scripts/db-monitor.ts` and reports:

- `pg_stat_database` summary
- connection state counts (`pg_stat_activity`)
- long-running active queries
- top statement timings when `pg_stat_statements` is enabled

### Minimum alerting thresholds

- DB connectivity failures > 0 in 5m
- Spike in long-running queries
- Connection saturation nearing pool max
- Deadlock count increase
- High error rates on write APIs (Sentry + logs)

## Command prerequisites

- `db:backup` requires `pg_dump` and `gzip` binaries.
- `db:restore` requires `pg_restore`; `.gz` input also requires `gunzip`.
- `db:monitor` requires DB credentials with read access to system views (limited output is returned if optional views are unavailable).

## 6) Pre-deploy DB checklist

1. `npx prisma validate`
2. `npx prisma migrate status`
3. Backup before production migration (`npm run db:backup`)
4. `npx prisma migrate deploy`
5. Post-deploy smoke check for auth + critical writes

## 7) Audit trail

For each migration or restore event, record:

- operator
- timestamp (UTC)
- command executed
- DB target
- outcome
- incident/ticket reference
