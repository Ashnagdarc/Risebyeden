type RateLimitConfig = {
  windowMs: number;
  maxAttempts: number;
  blockMs: number;
};

type RateLimitEntry = {
  windowStartedAt: number;
  attempts: number;
  blockedUntil: number;
};

type RateLimitState = {
  entries: Map<string, RateLimitEntry>;
};

type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const globalForRateLimit = globalThis as unknown as {
  __risebyedenRateLimit?: RateLimitState;
};

const state: RateLimitState = globalForRateLimit.__risebyedenRateLimit ?? {
  entries: new Map<string, RateLimitEntry>(),
};

if (!globalForRateLimit.__risebyedenRateLimit) {
  globalForRateLimit.__risebyedenRateLimit = state;
}

function getOrCreateEntry(key: string, now: number): RateLimitEntry {
  const existing = state.entries.get(key);
  if (existing) {
    return existing;
  }

  const created: RateLimitEntry = {
    windowStartedAt: now,
    attempts: 0,
    blockedUntil: 0,
  };
  state.entries.set(key, created);
  return created;
}

export function consumeRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const entry = getOrCreateEntry(key, now);

  if (entry.blockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((entry.blockedUntil - now) / 1000),
    };
  }

  if (now - entry.windowStartedAt >= config.windowMs) {
    entry.windowStartedAt = now;
    entry.attempts = 0;
  }

  entry.attempts += 1;

  if (entry.attempts > config.maxAttempts) {
    entry.blockedUntil = now + config.blockMs;
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(config.blockMs / 1000),
    };
  }

  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetRateLimit(key: string) {
  state.entries.delete(key);
}
