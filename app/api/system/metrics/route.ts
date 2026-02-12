import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getCacheHealth } from '@/lib/cache/valkey';
import { logError } from '@/lib/observability/logger';
import { bindRequestContextToSentry, getRequestContext, withRequestId } from '@/lib/observability/request-context';

export const dynamic = 'force-dynamic';

function boolToGauge(value: boolean): number {
  return value ? 1 : 0;
}

function formatMetrics(payload: {
  checkedAtUnix: number;
  latencyMs: number;
  databaseHealthy: boolean;
  cacheConfigured: boolean;
  cacheHealthy: boolean;
  overallHealthy: boolean;
}): string {
  return [
    '# HELP risebyeden_overall_health Overall system health status (1=ok, 0=degraded).',
    '# TYPE risebyeden_overall_health gauge',
    `risebyeden_overall_health ${boolToGauge(payload.overallHealthy)}`,
    '# HELP risebyeden_service_health Service health status (1=ok, 0=degraded).',
    '# TYPE risebyeden_service_health gauge',
    `risebyeden_service_health{service="database"} ${boolToGauge(payload.databaseHealthy)}`,
    `risebyeden_service_health{service="cache"} ${boolToGauge(payload.cacheHealthy)}`,
    '# HELP risebyeden_service_configured Service configured status (1=configured, 0=not_configured).',
    '# TYPE risebyeden_service_configured gauge',
    'risebyeden_service_configured{service="database"} 1',
    `risebyeden_service_configured{service="cache"} ${boolToGauge(payload.cacheConfigured)}`,
    '# HELP risebyeden_health_check_latency_ms End-to-end health probe latency in milliseconds.',
    '# TYPE risebyeden_health_check_latency_ms gauge',
    `risebyeden_health_check_latency_ms ${payload.latencyMs}`,
    '# HELP risebyeden_health_checked_at_unix Unix timestamp when metrics were produced.',
    '# TYPE risebyeden_health_checked_at_unix gauge',
    `risebyeden_health_checked_at_unix ${payload.checkedAtUnix}`,
    '',
  ].join('\n');
}

export async function GET(request: Request) {
  const requestContext = getRequestContext(request);
  bindRequestContextToSentry(requestContext);
  const startedAt = Date.now();

  let databaseHealthy = true;
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    databaseHealthy = false;
    logError('system.metrics.database_failed', error, { requestId: requestContext.requestId });
  }

  const cacheHealth = await getCacheHealth();
  const overallHealthy = databaseHealthy && (!cacheHealth.configured || cacheHealth.healthy);
  const checkedAtUnix = Math.floor(Date.now() / 1000);
  const latencyMs = Date.now() - startedAt;

  const body = formatMetrics({
    checkedAtUnix,
    latencyMs,
    databaseHealthy,
    cacheConfigured: cacheHealth.configured,
    cacheHealthy: cacheHealth.healthy,
    overallHealthy,
  });

  return withRequestId(
    new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }),
    requestContext.requestId,
  );
}

