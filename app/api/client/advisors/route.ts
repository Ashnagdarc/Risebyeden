import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

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

  const advisors = await prisma.advisor.findMany({
    where: { status: { not: 'INACTIVE' } },
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
