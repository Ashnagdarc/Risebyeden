import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { CACHE_KEYS } from '@/lib/cache/keys';
import { getCachedJson, setCachedJson } from '@/lib/cache/valkey';
import { QUERY_LIMITS } from '@/lib/db/query-limits';

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cached = await getCachedJson<{ advisors: unknown[] }>(CACHE_KEYS.clientAdvisorsActive);
  if (cached) {
    return NextResponse.json(cached);
  }

  const advisors = await prisma.advisor.findMany({
    where: { status: { not: 'INACTIVE' } },
    orderBy: { createdAt: 'asc' },
    take: QUERY_LIMITS.clientAdvisors,
    select: {
      id: true,
      name: true,
      title: true,
      specialty: true,
      status: true,
    },
  });

  const payload = { advisors };
  await setCachedJson(CACHE_KEYS.clientAdvisorsActive, payload, 180);

  return NextResponse.json(payload);
}
