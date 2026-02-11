import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  userFindFirst: vi.fn(),
  transaction: vi.fn(),
  deleteCacheKeys: vi.fn(),
  sendInterestAssignmentEmail: vi.fn(),
}));

vi.mock('next-auth/next', () => ({
  getServerSession: mocks.getServerSession,
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    interestRequest: {
      findUnique: mocks.findUnique,
      update: mocks.update,
    },
    user: {
      findFirst: mocks.userFindFirst,
    },
    $transaction: mocks.transaction,
  },
}));

vi.mock('@/lib/cache/valkey', () => ({
  deleteCacheKeys: mocks.deleteCacheKeys,
}));

vi.mock('@/lib/email', () => ({
  sendInterestAssignmentEmail: mocks.sendInterestAssignmentEmail,
}));

import { PATCH } from '@/app/api/admin/interest-requests/route';

describe('PATCH /api/admin/interest-requests', () => {
  beforeEach(() => {
    mocks.deleteCacheKeys.mockResolvedValue(undefined);
    mocks.sendInterestAssignmentEmail.mockResolvedValue({ sent: true });
  });

  it('returns 401 when user is unauthorized', async () => {
    mocks.getServerSession.mockResolvedValueOnce(null);

    const request = new Request('http://localhost/api/admin/interest-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'req-1', action: 'REJECT' }),
    });

    const response = await PATCH(request);
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error).toBe('Unauthorized');
  });

  it('rejects a request and clears assignment metadata', async () => {
    mocks.getServerSession.mockResolvedValueOnce({ user: { role: 'admin' } });
    mocks.findUnique.mockResolvedValueOnce({
      id: 'req-1',
      status: 'PENDING',
      createdAt: new Date('2026-02-01T10:00:00.000Z'),
      user: { userId: 'RBE-1234', name: 'Client User' },
      property: { name: 'Beachfront Paradise' },
    });
    mocks.update.mockResolvedValueOnce({
      id: 'req-1',
      status: 'REJECTED',
      createdAt: new Date('2026-02-01T10:00:00.000Z'),
      assignedAt: null,
      user: { userId: 'RBE-1234', name: 'Client User' },
      property: { name: 'Beachfront Paradise' },
      assignedAgent: null,
    });

    const request = new Request('http://localhost/api/admin/interest-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'req-1', action: 'REJECT' }),
    });

    const response = await PATCH(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.request.status).toBe('REJECTED');
    expect(mocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'req-1' },
        data: {
          status: 'REJECTED',
          assignedAgentId: null,
          assignedAt: null,
        },
      })
    );
  });

  it('assigns request to an active agent and triggers notifications', async () => {
    mocks.getServerSession.mockResolvedValueOnce({ user: { role: 'admin' } });
    mocks.findUnique.mockResolvedValueOnce({
      id: 'req-2',
      status: 'PENDING',
      createdAt: new Date('2026-02-03T12:00:00.000Z'),
      user: { userId: 'RBE-5678', name: 'Client Two' },
      property: { name: 'Obsidian Heights' },
    });
    mocks.userFindFirst.mockResolvedValueOnce({
      id: 'agent-1',
      userId: 'RBE-AGNT',
      name: 'Agent Smith',
      email: 'agent@example.com',
    });

    const assignedRecord = {
      id: 'req-2',
      status: 'SCHEDULED',
      createdAt: new Date('2026-02-03T12:00:00.000Z'),
      assignedAt: new Date('2026-02-03T12:10:00.000Z'),
      user: { userId: 'RBE-5678', name: 'Client Two' },
      property: { name: 'Obsidian Heights' },
      assignedAgent: { id: 'agent-1', userId: 'RBE-AGNT', name: 'Agent Smith', email: 'agent@example.com' },
    };

    mocks.transaction.mockImplementationOnce(async (callback: (tx: Record<string, unknown>) => Promise<unknown>) => callback({
      interestRequest: {
        update: vi.fn().mockResolvedValue(assignedRecord),
      },
      notification: {
        create: vi.fn().mockResolvedValue({ id: 'note-1' }),
      },
    }));

    const request = new Request('http://localhost/api/admin/interest-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: 'req-2', action: 'ASSIGN', agentUserId: 'agent-1' }),
    });

    const response = await PATCH(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.request.status).toBe('SCHEDULED');
    expect(mocks.sendInterestAssignmentEmail).toHaveBeenCalledTimes(1);
    expect(mocks.deleteCacheKeys).toHaveBeenCalled();
  });
});
