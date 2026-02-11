import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { CACHE_KEYS } from '@/lib/cache/keys';
import { deleteCacheKeys } from '@/lib/cache/valkey';
import { parseJsonBody } from '@/lib/api/validation';

async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return null;
  }
  return session;
}

const interestRequestSchema = z.object({
  propertyId: z.string().min(1),
}).strict();

export async function POST(request: Request) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const parsedBody = await parseJsonBody(request, interestRequestSchema);
  if (!parsedBody.success) {
    return parsedBody.response;
  }
  const body = parsedBody.data;

  const property = await prisma.property.findUnique({
    where: { id: body.propertyId },
    select: { id: true },
  });
  if (!property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 });
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

  await deleteCacheKeys([CACHE_KEYS.adminOverview]);

  return NextResponse.json({ request: requestEntry });
}
