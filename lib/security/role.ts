export type AppRole = 'admin' | 'agent' | 'client' | 'unknown';

export function normalizeRole(rawRole: string | undefined): AppRole {
  const normalized = (rawRole || '').trim().toLowerCase();
  if (normalized === 'admin') {
    return 'admin';
  }
  if (normalized === 'agent') {
    return 'agent';
  }
  if (normalized === 'client') {
    return 'client';
  }
  return 'unknown';
}

export function isAdminRole(role: string | undefined): boolean {
  return normalizeRole(role) === 'admin';
}
