import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { CACHE_KEYS } from '@/lib/cache/keys';
import { deleteCacheKeys } from '@/lib/cache/valkey';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || (role || '').toLowerCase() !== 'admin') {
    return null;
  }
  return session;
}

type AdvisorPayload = {
  id?: string;
  name?: string;
  title?: string;
  specialty?: string | null;
  status?: 'AVAILABLE' | 'BUSY' | 'INACTIVE';
};

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const advisors = await prisma.advisor.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      name: true,
      title: true,
      specialty: true,
      status: true,
    },
  });

  return NextResponse.json({ advisors });
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as AdvisorPayload;
  if (!body.name || !body.title) {
    return NextResponse.json({ error: 'Name and title are required' }, { status: 400 });
  }

  try {
    const advisor = await prisma.advisor.create({
      data: {
        name: body.name.trim(),
        title: body.title.trim(),
        specialty: body.specialty?.trim() || null,
        status: body.status || 'AVAILABLE',
      },
      select: {
        id: true,
        name: true,
        title: true,
        specialty: true,
        status: true,
      },
    });

    await deleteCacheKeys([CACHE_KEYS.clientAdvisorsActive, CACHE_KEYS.adminOverview]);

    return NextResponse.json({ advisor });
  } catch {
    return NextResponse.json({ error: 'Unable to create advisor' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as AdvisorPayload;
  if (!body.id) {
    return NextResponse.json({ error: 'Advisor id is required' }, { status: 400 });
  }

  try {
    const advisor = await prisma.advisor.update({
      where: { id: body.id },
      data: {
        name: body.name === undefined ? undefined : body.name.trim(),
        title: body.title === undefined ? undefined : body.title.trim(),
        specialty: body.specialty === undefined ? undefined : body.specialty?.trim() || null,
        status: body.status || undefined,
      },
      select: {
        id: true,
        name: true,
        title: true,
        specialty: true,
        status: true,
      },
    });

    await deleteCacheKeys([CACHE_KEYS.clientAdvisorsActive, CACHE_KEYS.adminOverview]);

    return NextResponse.json({ advisor });
  } catch {
    return NextResponse.json({ error: 'Unable to update advisor' }, { status: 500 });
  }
}
