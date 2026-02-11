import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  consumeRateLimit: vi.fn(),
  resetRateLimit: vi.fn(),
  verifyStoredToken: vi.fn(),
  bcryptCompare: vi.fn(),
  userFindUnique: vi.fn(),
  userUpdate: vi.fn(),
}));

vi.mock('@/lib/security/rate-limit', () => ({
  consumeRateLimit: mocks.consumeRateLimit,
  resetRateLimit: mocks.resetRateLimit,
}));

vi.mock('@/lib/security/token', () => ({
  verifyStoredToken: mocks.verifyStoredToken,
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: mocks.bcryptCompare,
  },
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: mocks.userFindUnique,
      update: mocks.userUpdate,
    },
  },
}));

import { POST } from '@/app/api/auth/enlist/route';

describe('POST /api/auth/enlist', () => {
  beforeEach(() => {
    mocks.consumeRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.resetRateLimit.mockResolvedValue(undefined);
    mocks.verifyStoredToken.mockResolvedValue(true);
    mocks.bcryptCompare.mockResolvedValue(true);
    mocks.userFindUnique.mockResolvedValue({
      id: 'user-1',
      userId: 'RBE-ABCD',
      hashedPassword: 'hashed-password',
      accessToken: 'hashed-token',
      tokenUsed: false,
      status: 'PENDING',
    });
    mocks.userUpdate.mockResolvedValue({ id: 'user-1' });
  });

  it('returns 400 when required enlist fields are missing', async () => {
    const request = new Request('http://localhost/api/auth/enlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'rbe-abcd',
        accessKey: 'ACCESS',
        accessToken: 'TOKEN',
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toBe('All fields are required');
  });

  it('returns 401 for unknown users', async () => {
    mocks.userFindUnique.mockResolvedValueOnce(null);

    const request = new Request('http://localhost/api/auth/enlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'rbe-not-found',
        accessKey: 'ACCESS',
        accessToken: 'TOKEN',
        fullName: 'Client User',
        email: 'client@example.com',
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toBe('Invalid credentials');
  });

  it('stores full name and email on successful enlist request', async () => {
    const request = new Request('http://localhost/api/auth/enlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'rbe-abcd',
        accessKey: 'ACCESS',
        accessToken: 'TOKEN',
        fullName: 'Jane Doe',
        email: 'Jane.Doe@Example.com',
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.message).toContain('Access request submitted');
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: {
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
        tokenUsed: true,
      },
    });
    expect(mocks.resetRateLimit).toHaveBeenCalledTimes(1);
  });
});
