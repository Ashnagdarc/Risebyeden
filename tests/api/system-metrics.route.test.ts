import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  getCacheHealth: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    $queryRaw: mocks.queryRaw,
  },
}));

vi.mock('@/lib/cache/valkey', () => ({
  getCacheHealth: mocks.getCacheHealth,
}));

import { GET } from '@/app/api/system/metrics/route';

describe('GET /api/system/metrics', () => {
  beforeEach(() => {
    mocks.queryRaw.mockResolvedValue([1]);
    mocks.getCacheHealth.mockResolvedValue({ configured: true, healthy: true });
  });

  it('returns prometheus metrics with correlation header', async () => {
    const request = new Request('http://localhost/api/system/metrics', {
      headers: { 'x-request-id': 'req-metrics-1' },
    });

    const response = await GET(request);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/plain');
    expect(response.headers.get('x-request-id')).toBe('req-metrics-1');
    expect(body).toContain('risebyeden_overall_health 1');
    expect(body).toContain('risebyeden_service_health{service="database"} 1');
    expect(body).toContain('risebyeden_service_health{service="cache"} 1');
    expect(body).toContain('risebyeden_service_configured{service="cache"} 1');
  });

  it('reports degraded status when database probe fails', async () => {
    mocks.queryRaw.mockRejectedValueOnce(new Error('db down'));
    mocks.getCacheHealth.mockResolvedValueOnce({ configured: false, healthy: false });

    const request = new Request('http://localhost/api/system/metrics', {
      headers: { 'x-request-id': 'req-metrics-2' },
    });

    const response = await GET(request);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain('risebyeden_overall_health 0');
    expect(body).toContain('risebyeden_service_health{service="database"} 0');
    expect(body).toContain('risebyeden_service_configured{service="cache"} 0');
  });
});

