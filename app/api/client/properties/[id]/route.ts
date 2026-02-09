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

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await requireUser();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const property = await prisma.property.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      name: true,
      basePrice: true,
      location: true,
      city: true,
      state: true,
      propertyType: true,
      appreciation: true,
      bedrooms: true,
      bathrooms: true,
      squareFeet: true,
      yearBuilt: true,
      capRate: true,
      description: true,
      documents: {
        where: { type: 'OTHER' },
        select: { url: true },
        take: 1,
      },
    },
  });

  if (!property) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({ property });
}
