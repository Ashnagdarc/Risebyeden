import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import prisma from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session || (role || '').toLowerCase() !== 'admin') {
    return null;
  }
  return session;
}

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = (await request.json()) as {
    userId?: string;
    propertyId?: string;
    quantity?: number;
    purchasePrice?: string | number | null;
    notes?: string;
  };

  if (!body.userId || !body.propertyId) {
    return NextResponse.json({ error: 'Client and property are required' }, { status: 400 });
  }

  const quantity = body.quantity && body.quantity > 0 ? Math.floor(body.quantity) : 1;
  const priceRaw = body.purchasePrice ?? null;
  const purchasePrice = priceRaw === null
    ? null
    : Number.isFinite(Number(priceRaw))
      ? Number(priceRaw)
      : null;

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

  return NextResponse.json({ purchase });
}
