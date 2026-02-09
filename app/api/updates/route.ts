import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  const updates = await prisma.announcement.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      type: true,
      title: true,
      description: true,
      isNew: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ updates });
}
