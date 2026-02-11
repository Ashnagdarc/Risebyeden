import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '@/lib/prisma';
import { consumeRateLimit, resetRateLimit } from '@/lib/security/rate-limit';
import { verifyStoredToken } from '@/lib/security/token';
import { logError, logInfo, logWarn } from '@/lib/observability/logger';
import { bindRequestContextToSentry, getRequestContext, withRequestId } from '@/lib/observability/request-context';

function readPositiveIntEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

const enlistPayloadSchema = z.object({
  userId: z.string().trim().min(1),
  accessKey: z.string().min(1),
  accessToken: z.string().min(1),
  fullName: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
}).strict();

const ENLIST_RATE_LIMIT = {
  windowMs: readPositiveIntEnv('ENLIST_RATE_LIMIT_WINDOW_MS', 5 * 60 * 1000),
  maxAttempts: readPositiveIntEnv('ENLIST_RATE_LIMIT_MAX_ATTEMPTS', 6),
  blockMs: readPositiveIntEnv('ENLIST_RATE_LIMIT_BLOCK_MS', 15 * 60 * 1000),
};

function resolveClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

// POST — Client uses userId + accessKey + accessToken to request access
export async function POST(request: Request) {
  const requestContext = getRequestContext(request);
  bindRequestContextToSentry(requestContext);
  const respond = (body: unknown, init?: ResponseInit) =>
    withRequestId(NextResponse.json(body, init), requestContext.requestId);

  let normalizedUserId = '';
  let rateLimitKey = '';

  try {
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return respond({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const preParsed = z.object({ userId: z.string().optional() }).passthrough().safeParse(rawBody);
    normalizedUserId = String(preParsed.success ? preParsed.data.userId || '' : '').trim().toUpperCase();
    const clientIp = resolveClientIp(request);
    rateLimitKey = `enlist:${normalizedUserId || 'unknown'}:${clientIp}`;

    const limit = await consumeRateLimit(rateLimitKey, ENLIST_RATE_LIMIT);
    if (!limit.allowed) {
      logWarn('auth.enlist.rate_limited', {
        requestId: requestContext.requestId,
        userId: normalizedUserId || 'unknown',
        retryAfterSeconds: limit.retryAfterSeconds,
      });
      return respond(
        { error: 'Too many attempts. Try again later.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      );
    }

    const parsedBody = enlistPayloadSchema.safeParse(rawBody);
    if (!parsedBody.success) {
      return respond({ error: 'All fields are required' }, { status: 400 });
    }
    const body = parsedBody.data;

    const user = await prisma.user.findUnique({
      where: { userId: normalizedUserId },
    });

    if (!user) {
      return respond({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isKeyValid = await bcrypt.compare(body.accessKey, user.hashedPassword);
    if (!isKeyValid) {
      return respond({ error: 'Invalid credentials' }, { status: 401 });
    }

    const tokenIsValid = await verifyStoredToken(body.accessToken, user.accessToken);
    if (!tokenIsValid) {
      return respond({ error: 'Invalid access token' }, { status: 401 });
    }

    if (user.tokenUsed) {
      return respond({ error: 'Access token has already been used' }, { status: 400 });
    }

    if (user.status === 'ACTIVE') {
      return respond({ error: 'Account is already active' }, { status: 400 });
    }

    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          name: body.fullName.trim(),
          email: body.email.trim().toLowerCase(),
          tokenUsed: true,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return respond({ error: 'Email address is already in use' }, { status: 409 });
      }
      throw error;
    }

    await resetRateLimit(rateLimitKey);
    logInfo('auth.enlist.submitted', {
      requestId: requestContext.requestId,
      userId: normalizedUserId,
    });

    return respond({
      message: 'Access request submitted. Awaiting admin authorization.',
    });
  } catch (error) {
    logError('auth.enlist.failed', error, {
      requestId: requestContext.requestId,
      userId: normalizedUserId || 'unknown',
    });
    return respond({ error: 'Unable to process access request' }, { status: 500 });
  }
}
