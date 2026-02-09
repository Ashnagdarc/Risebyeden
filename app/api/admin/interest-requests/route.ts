import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || role !== 'admin') {
    return null;
  }
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const requests = await prisma.interestRequest.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      createdAt: true,
      user: { select: { userId: true, name: true } },
      property: { select: { name: true } },
    },
  });

  return NextResponse.json({ requests });
}

export async function PATCH(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as { id?: string; status?: string };

  if (!body.id || !body.status) {
    return NextResponse.json({ error: 'Missing id or status' }, { status: 400 });
  }

  const normalizedStatus = body.status.toUpperCase();
  const allowedStatuses = ['PENDING', 'SCHEDULED', 'APPROVED', 'REJECTED'];

  if (!allowedStatuses.includes(normalizedStatus)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const current = await prisma.interestRequest.findUnique({
    where: { id: body.id },
    select: { status: true },
  });

  if (!current) {
    return NextResponse.json({ error: 'Request not found' }, { status: 404 });
  }

  const transitions: Record<string, string[]> = {
    PENDING: ['SCHEDULED', 'APPROVED', 'REJECTED'],
    SCHEDULED: ['APPROVED', 'REJECTED'],
    APPROVED: [],
    REJECTED: [],
  };

  const allowedNext = transitions[current.status] || [];
  if (normalizedStatus !== current.status && !allowedNext.includes(normalizedStatus)) {
    return NextResponse.json({ error: 'Invalid status transition' }, { status: 409 });
  }

  try {
    const requestRecord = await prisma.interestRequest.update({
      where: { id: body.id },
      data: { status: normalizedStatus as 'PENDING' | 'SCHEDULED' | 'APPROVED' | 'REJECTED' },
      select: {
        id: true,
        status: true,
        createdAt: true,
        user: { select: { userId: true, name: true } },
        property: { select: { name: true } },
      },
    });

    return NextResponse.json({ request: requestRecord });
  } catch {
    return NextResponse.json({ error: 'Unable to update request' }, { status: 500 });
  }
}
