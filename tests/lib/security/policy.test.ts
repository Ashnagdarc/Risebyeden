import { describe, expect, it } from 'vitest';
import { isAuthorized, resolveSessionRole, resolveSessionUserId } from '@/lib/security/policy';

describe('security/policy', () => {
  it('normalizes and resolves session role safely', () => {
    expect(resolveSessionRole(null)).toBe('unknown');
    expect(resolveSessionRole({ user: { role: 'ADMIN' } } as any)).toBe('admin');
    expect(resolveSessionRole({ user: { role: 'agent' } } as any)).toBe('agent');
    expect(resolveSessionRole({ user: { role: 'CLIENT' } } as any)).toBe('client');
  });

  it('enforces allowed roles and userId requirements', () => {
    const adminSession = { user: { role: 'admin', id: 'u-1' } } as any;
    const clientSession = { user: { role: 'client', id: 'u-2' } } as any;

    expect(isAuthorized(adminSession, { allowedRoles: ['admin'] })).toBe(true);
    expect(isAuthorized(clientSession, { allowedRoles: ['admin'] })).toBe(false);
    expect(isAuthorized(clientSession, { requireUserId: true })).toBe(true);
    expect(isAuthorized({ user: { role: 'client' } } as any, { requireUserId: true })).toBe(false);
  });

  it('extracts userId safely from session', () => {
    expect(resolveSessionUserId(null)).toBeNull();
    expect(resolveSessionUserId({ user: {} } as any)).toBeNull();
    expect(resolveSessionUserId({ user: { id: 'abc' } } as any)).toBe('abc');
  });
});
