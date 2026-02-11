import { describe, expect, it } from 'vitest';
import { isAdminRole, normalizeRole } from '@/lib/security/role';

describe('security/role', () => {
  it('normalizes app roles', () => {
    expect(normalizeRole(undefined)).toBe('unknown');
    expect(normalizeRole('ADMIN')).toBe('admin');
    expect(normalizeRole('agent')).toBe('agent');
    expect(normalizeRole('client')).toBe('client');
    expect(normalizeRole('something-else')).toBe('unknown');
  });

  it('identifies admin role reliably', () => {
    expect(isAdminRole('admin')).toBe(true);
    expect(isAdminRole('ADMIN')).toBe(true);
    expect(isAdminRole('agent')).toBe(false);
  });
});
