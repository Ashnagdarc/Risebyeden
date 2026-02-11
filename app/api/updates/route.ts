import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { CACHE_KEYS } from '@/lib/cache/keys';
import { getCachedJson, setCachedJson } from '@/lib/cache/valkey';

export async function GET() {
  const cached = await getCachedJson<{ updates: unknown[] }>(CACHE_KEYS.updates);
  if (cached) {
    return NextResponse.json(cached);
  }

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

  const payload = { updates };
  await setCachedJson(CACHE_KEYS.updates, payload, 300);

  return NextResponse.json(payload);
}
