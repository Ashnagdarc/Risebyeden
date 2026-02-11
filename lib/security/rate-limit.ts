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

export async function consumeRateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const now = new Date();
  await maybeCleanupStaleBuckets(now);

  const existing = await prisma.rateLimitBucket.findUnique({ where: { key } });

  if (!existing) {
    await prisma.rateLimitBucket.create({
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
    await prisma.rateLimitBucket.update({
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

  await prisma.rateLimitBucket.update({
    where: { key },
    data: {
      attempts,
      windowStartedAt: shouldResetWindow ? now : existing.windowStartedAt,
      blockedUntil: null,
    },
  });

  return { allowed: true, retryAfterSeconds: 0 };
}

export async function resetRateLimit(key: string): Promise<void> {
  await prisma.rateLimitBucket.deleteMany({ where: { key } });
}
