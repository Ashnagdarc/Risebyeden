import type { Session } from 'next-auth';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { normalizeRole, type AppRole } from '@/lib/security/role';

type SessionUser = {
  id?: string;
  role?: string;
};

type PolicyOptions = {
  allowedRoles?: AppRole[];
  requireUserId?: boolean;
};

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export function resolveSessionRole(session: Session | null): AppRole {
  const rawRole = (session?.user as SessionUser | undefined)?.role;
  return normalizeRole(rawRole);
}

export function resolveSessionUserId(session: Session | null): string | null {
  const userId = (session?.user as SessionUser | undefined)?.id;
  return userId || null;
}

export function isAuthorized(session: Session | null, options: PolicyOptions = {}): boolean {
  if (!session) {
    return false;
  }

  if (options.requireUserId && !resolveSessionUserId(session)) {
    return false;
  }

  if (options.allowedRoles && options.allowedRoles.length > 0) {
    const role = resolveSessionRole(session);
    return options.allowedRoles.includes(role);
  }

  return true;
}

export async function requireSessionPolicy(options: PolicyOptions = {}): Promise<
  | { ok: true; session: Session; role: AppRole; userId: string | null }
  | { ok: false; response: NextResponse }
> {
  const session = await getServerSession(authOptions);
  if (!isAuthorized(session, options)) {
    return { ok: false, response: unauthorizedResponse() };
  }

  return {
    ok: true,
    session: session as Session,
    role: resolveSessionRole(session),
    userId: resolveSessionUserId(session),
  };
}
