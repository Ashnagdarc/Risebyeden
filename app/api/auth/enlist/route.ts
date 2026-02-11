import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { consumeRateLimit, resetRateLimit } from '@/lib/security/rate-limit';
import { verifyStoredToken } from '@/lib/security/token';

const enlistPayloadSchema = z.object({
  userId: z.string().trim().min(1),
  accessKey: z.string().min(1),
  accessToken: z.string().min(1),
  organization: z.string().trim().min(1).max(160),
}).strict();

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
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const preParsed = z.object({ userId: z.string().optional() }).passthrough().safeParse(rawBody);
  const normalizedUserId = String(preParsed.success ? preParsed.data.userId || '' : '').trim().toUpperCase();
  const clientIp = resolveClientIp(request);
  const rateLimitKey = `enlist:${normalizedUserId || 'unknown'}:${clientIp}`;

  const limit = await consumeRateLimit(rateLimitKey, ENLIST_RATE_LIMIT);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
    );
  }

  const parsedBody = enlistPayloadSchema.safeParse(rawBody);
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
  }
  const body = parsedBody.data;

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
