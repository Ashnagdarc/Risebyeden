import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { CACHE_KEYS } from '@/lib/cache/keys';
import { deleteCacheKeys } from '@/lib/cache/valkey';
import { parseJsonBody } from '@/lib/api/validation';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || (role || '').toLowerCase() !== 'admin') {
    return null;
  }
  return session;
}

const createPurchaseSchema = z.object({
  userId: z.string().min(1),
  propertyId: z.string().min(1),
  quantity: z.number().int().positive().max(1000).optional(),
  purchasePrice: z.union([z.number(), z.string().trim().min(1), z.null()]).optional(),
  notes: z.string().trim().max(2000).optional(),
}).strict();

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsedBody = await parseJsonBody(request, createPurchaseSchema);
  if (!parsedBody.success) {
    return parsedBody.response;
  }
  const body = parsedBody.data;

  const quantity = body.quantity && body.quantity > 0 ? Math.floor(body.quantity) : 1;
  const priceRaw = body.purchasePrice ?? null;
  const purchasePrice = priceRaw === null
    ? null
    : Number.isFinite(Number(priceRaw))
      ? Number(priceRaw)
      : undefined;

  if (priceRaw !== null && purchasePrice === undefined) {
    return NextResponse.json({ error: 'Invalid purchase price' }, { status: 400 });
  }

  const client = await prisma.user.findUnique({
    where: { id: body.userId },
    select: { id: true, role: true },
  });

  if (!client || client.role !== 'CLIENT') {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 });
  }

  const property = await prisma.property.findUnique({
    where: { id: body.propertyId },
    select: { id: true },
  });

  if (!property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }

  const purchase = await prisma.clientProperty.create({
    data: {
      userId: body.userId,
      propertyId: body.propertyId,
      quantity,
      purchasePrice,
      notes: body.notes?.trim() || null,
    },
    select: {
      id: true,
      quantity: true,
      purchasePrice: true,
      purchasedAt: true,
    },
  });

  await deleteCacheKeys([
    CACHE_KEYS.adminOverview,
  ]);

  return NextResponse.json({ purchase });
}
