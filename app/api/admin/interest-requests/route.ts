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
