import { PrismaClient } from '@prisma/client';

type JsonRecord = Record<string, unknown>;

const databaseUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('Set DIRECT_DATABASE_URL or DATABASE_URL before running db:monitor.');
}

const prisma = new PrismaClient({
  datasources: {
    db: { url: databaseUrl },
  },
});

async function queryRows(sql: string): Promise<JsonRecord[]> {
  const rows = await prisma.$queryRawUnsafe<JsonRecord[]>(sql);
  return rows;
}

async function tryQueryRows(sql: string, fallbackNote: string): Promise<JsonRecord[]> {
  try {
    return await queryRows(sql);
  } catch {
    return [{ note: fallbackNote }];
  }
}

async function main() {
  const summary = await queryRows(`
    SELECT
      now() AS collected_at,
      current_database() AS database,
      numbackends,
      xact_commit,
      xact_rollback,
      blks_read,
      blks_hit,
      temp_files,
      temp_bytes,
      deadlocks
    FROM pg_stat_database
    WHERE datname = current_database()
  `);

  const connectionStates = await tryQueryRows(
    `
    SELECT state, COUNT(*)::int AS count
    FROM pg_stat_activity
    WHERE datname = current_database()
    GROUP BY state
    ORDER BY count DESC
  `,
    'Unable to read pg_stat_activity connection states with current database role',
  );

  const longRunningQueries = await tryQueryRows(
    `
    SELECT
      pid,
      usename,
      state,
      EXTRACT(EPOCH FROM (now() - query_start))::int AS duration_seconds,
      LEFT(query, 200) AS query
    FROM pg_stat_activity
    WHERE datname = current_database()
      AND state <> 'idle'
      AND query_start IS NOT NULL
    ORDER BY duration_seconds DESC
    LIMIT 10
  `,
    'Unable to read pg_stat_activity long-running queries with current database role',
  );

  const statementStats = await tryQueryRows(
    `
      SELECT
        queryid,
        calls,
        total_exec_time,
        mean_exec_time,
        rows,
        LEFT(query, 200) AS query
      FROM pg_stat_statements
      ORDER BY total_exec_time DESC
      LIMIT 10
    `,
    'pg_stat_statements not enabled or current role has insufficient privileges',
  );

  const payload = {
    summary,
    connectionStates,
    longRunningQueries,
    statementStats,
  };

  console.log(
    JSON.stringify(
      payload,
      (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error('db-monitor failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
