import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCacheHealth } from '@/lib/cache/valkey';
import { logError } from '@/lib/observability/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startedAt = Date.now();

  let databaseHealthy = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    databaseHealthy = false;
    logError('system.health.database_failed', error);
  }

  const cacheHealth = await getCacheHealth();
  const overallHealthy = databaseHealthy && (!cacheHealth.configured || cacheHealth.healthy);

  const payload = {
    status: overallHealthy ? 'ok' : 'degraded',
    services: {
      database: databaseHealthy ? 'ok' : 'degraded',
      cache: !cacheHealth.configured ? 'not_configured' : cacheHealth.healthy ? 'ok' : 'degraded',
    },
    checkedAt: new Date().toISOString(),
    latencyMs: Date.now() - startedAt,
  };

  return NextResponse.json(payload, {
    status: overallHealthy ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

