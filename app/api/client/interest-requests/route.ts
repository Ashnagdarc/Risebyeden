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

export async function POST(request: Request) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const body = (await request.json()) as { propertyId?: string };
  if (!body.propertyId) {
    return NextResponse.json({ error: 'Property is required' }, { status: 400 });
  }

  const requestEntry = await prisma.interestRequest.create({
    data: {
      userId,
      propertyId: body.propertyId,
    },
    select: {
      id: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ request: requestEntry });
}
