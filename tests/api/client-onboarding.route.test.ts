import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireSessionPolicy: vi.fn(),
  queryRaw: vi.fn(),
  transaction: vi.fn(),
  txGoalCreate: vi.fn(),
  txExecuteRaw: vi.fn(),
  txClientProfileUpsert: vi.fn(),
  txUserSettingsUpsert: vi.fn(),
}));

vi.mock('@/lib/security/policy', () => ({
  requireSessionPolicy: mocks.requireSessionPolicy,
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    $queryRaw: mocks.queryRaw,
    $transaction: mocks.transaction,
  },
}));

import { GET, POST } from '@/app/api/client/onboarding/route';

describe('client onboarding route', () => {
  beforeEach(() => {
    mocks.requireSessionPolicy.mockResolvedValue({
      ok: true,
      userId: 'user-1',
      role: 'client',
      session: {},
    });

    mocks.queryRaw.mockResolvedValue([
      {
        onboardingCompleted: false,
        onboardingCompletedAt: null,
        name: 'Client User',
      },
    ]);

    mocks.txGoalCreate.mockResolvedValue({ id: 'goal-1' });
    mocks.txExecuteRaw.mockResolvedValue(1);
    mocks.txClientProfileUpsert.mockResolvedValue({});
    mocks.txUserSettingsUpsert.mockResolvedValue({});

    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => Promise<void>) => {
      await callback({
        goal: {
          create: mocks.txGoalCreate,
        },
        clientProfile: {
          upsert: mocks.txClientProfileUpsert,
        },
        userSettings: {
          upsert: mocks.txUserSettingsUpsert,
        },
        $executeRaw: mocks.txExecuteRaw,
      });
    });
  });

  it('returns onboarding status and catalog on GET', async () => {
    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.onboardingCompleted).toBe(false);
    expect(Array.isArray(payload.goalCatalog)).toBe(true);
    expect(payload.goalCatalog.length).toBe(15);
    expect(mocks.queryRaw).toHaveBeenCalledTimes(1);
  });

  it('rejects invalid goal count on POST', async () => {
    const request = new Request('http://localhost/api/client/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goals: [
          { goalId: 'goal-grow-portfolio-value' },
          { goalId: 'goal-buy-first-property' },
        ],
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('creates goals and marks onboarding complete', async () => {
    const request = new Request('http://localhost/api/client/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        goals: [
          { goalId: 'goal-grow-portfolio-value' },
          { goalId: 'goal-buy-second-property' },
          { goalId: 'goal-buy-third-property' },
        ],
      }),
    });

    const response = await POST(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(mocks.txGoalCreate).toHaveBeenCalledTimes(3);
    expect(mocks.txExecuteRaw).toHaveBeenCalledTimes(1);
  });
});
