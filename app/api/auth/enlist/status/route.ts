import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { consumeRateLimit, resetRateLimit } from '@/lib/security/rate-limit';

type StatusPayload = {
  userId?: string;
  accessKey?: string;
};

const STATUS_RATE_LIMIT = {
  windowMs: 5 * 60 * 1000,
  maxAttempts: 12,
  blockMs: 10 * 60 * 1000,
} as const;

function resolveClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

export async function POST(request: Request) {
  const body = (await request.json()) as StatusPayload;
  const normalizedUserId = String(body.userId || '').trim().toUpperCase();
  const clientIp = resolveClientIp(request);
  const rateLimitKey = `enlist-status:${normalizedUserId || 'unknown'}:${clientIp}`;

  const limit = consumeRateLimit(rateLimitKey, STATUS_RATE_LIMIT);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  if (!normalizedUserId || !body.accessKey) {
    return NextResponse.json({ error: 'User ID and access key are required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { userId: normalizedUserId },
    select: { id: true, status: true, hashedPassword: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const isKeyValid = await bcrypt.compare(body.accessKey, user.hashedPassword);
  if (!isKeyValid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  resetRateLimit(rateLimitKey);

  return NextResponse.json({ status: user.status });
}
