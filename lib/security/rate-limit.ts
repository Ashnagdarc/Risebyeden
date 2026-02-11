import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

type RateLimitConfig = {
  windowMs: number;
  maxAttempts: number;
  blockMs: number;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const STALE_WINDOW_RETENTION_MS = 24 * 60 * 60 * 1000;
const EXPIRED_BLOCK_RETENTION_MS = 60 * 60 * 1000;
const SERIALIZABLE_RETRY_LIMIT = 4;

let lastCleanupAt = 0;
let cleanupPromise: Promise<void> | null = null;

async function maybeCleanupStaleBuckets(now: Date): Promise<void> {
  const nowMs = now.getTime();
  if (nowMs - lastCleanupAt < CLEANUP_INTERVAL_MS) {
    return;
  }

  if (cleanupPromise) {
    return cleanupPromise;
  }

  cleanupPromise = (async () => {
    lastCleanupAt = nowMs;
    const staleWindowCutoff = new Date(nowMs - STALE_WINDOW_RETENTION_MS);
    const expiredBlockCutoff = new Date(nowMs - EXPIRED_BLOCK_RETENTION_MS);

    await prisma.rateLimitBucket.deleteMany({
      where: {
        OR: [
          {
            blockedUntil: null,
            windowStartedAt: { lt: staleWindowCutoff },
          },
          {
            blockedUntil: { lt: expiredBlockCutoff },
          },
        ],
      },
    });
  })().finally(() => {
    cleanupPromise = null;
  });

  await cleanupPromise;
}

function isRetryableTransactionError(error: unknown): boolean {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    return false;
  }
  return error.code === 'P2034' || error.code === 'P2002';
}

async function runSerializableRateLimitTransaction<T>(
  operation: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  for (let attempt = 0; attempt <= SERIALIZABLE_RETRY_LIMIT; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => operation(tx),
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
      );
    } catch (error) {
      if (attempt >= SERIALIZABLE_RETRY_LIMIT || !isRetryableTransactionError(error)) {
        throw error;
      }
    }
  }

  throw new Error('Rate limit transaction retry limit exceeded');
}

export async function consumeRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const now = new Date();
  await maybeCleanupStaleBuckets(now);

  return runSerializableRateLimitTransaction(async (tx) => {
    const existing = await tx.rateLimitBucket.findUnique({ where: { key } });

    if (!existing) {
      await tx.rateLimitBucket.create({
        data: {
          key,
          attempts: 1,
          windowStartedAt: now,
        },
      });
      return { allowed: true, retryAfterSeconds: 0 };
    }

    if (existing.blockedUntil && existing.blockedUntil.getTime() > now.getTime()) {
      return {
        allowed: false,
        retryAfterSeconds: Math.ceil((existing.blockedUntil.getTime() - now.getTime()) / 1000),
      };
    }

    const shouldResetWindow = now.getTime() - existing.windowStartedAt.getTime() >= config.windowMs;
    const attempts = shouldResetWindow ? 1 : existing.attempts + 1;

    if (attempts > config.maxAttempts) {
      const blockedUntil = new Date(now.getTime() + config.blockMs);
      await tx.rateLimitBucket.update({
        where: { key },
        data: {
          attempts,
          blockedUntil,
        },
      });

      return {
        allowed: false,
        retryAfterSeconds: Math.ceil(config.blockMs / 1000),
      };
    }

    await tx.rateLimitBucket.update({
      where: { key },
      data: {
        attempts,
        windowStartedAt: shouldResetWindow ? now : existing.windowStartedAt,
        blockedUntil: null,
      },
    });

    return { allowed: true, retryAfterSeconds: 0 };
  });
}

export async function resetRateLimit(key: string): Promise<void> {
  await prisma.rateLimitBucket.deleteMany({ where: { key } });
}
