import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { consumeRateLimit, resetRateLimit } from '@/lib/security/rate-limit';
import { verifyStoredToken } from '@/lib/security/token';

type EnlistPayload = {
  userId: string;
  accessKey: string;
  accessToken: string;
  organization: string;
};

const ENLIST_RATE_LIMIT = {
  windowMs: 5 * 60 * 1000,
  maxAttempts: 6,
  blockMs: 15 * 60 * 1000,
} as const;

function resolveClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

// POST — Client uses userId + accessKey + accessToken to request access
export async function POST(request: Request) {
  const body = (await request.json()) as Partial<EnlistPayload>;
  const normalizedUserId = String(body.userId || '').trim().toUpperCase();
  const clientIp = resolveClientIp(request);
  const rateLimitKey = `enlist:${normalizedUserId || 'unknown'}:${clientIp}`;

  const limit = await consumeRateLimit(rateLimitKey, ENLIST_RATE_LIMIT);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  if (!normalizedUserId || !body.accessKey || !body.accessToken || !body.organization) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { userId: normalizedUserId },
  });

  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Verify access key
  const isKeyValid = await bcrypt.compare(body.accessKey, user.hashedPassword);
  if (!isKeyValid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  // Verify access token
  const tokenIsValid = await verifyStoredToken(body.accessToken, user.accessToken);
  if (!tokenIsValid) {
    return NextResponse.json({ error: 'Invalid access token' }, { status: 401 });
  }

  if (user.tokenUsed) {
    return NextResponse.json({ error: 'Access token has already been used' }, { status: 400 });
  }

  if (user.status === 'ACTIVE') {
    return NextResponse.json({ error: 'Account is already active' }, { status: 400 });
  }

  // Mark token as used, save organization, keep status PENDING for admin approval
  await prisma.user.update({
    where: { id: user.id },
    data: {
      organization: body.organization,
      tokenUsed: true,
    },
  });

  await resetRateLimit(rateLimitKey);

  return NextResponse.json({
    message: 'Access request submitted. Awaiting admin authorization.',
  });
}
