import { createClient } from 'redis';

type ValkeyClient = ReturnType<typeof createClient>;

type CacheEnvelope<T> = {
  data: T;
};

const VALKEY_URL = process.env.VALKEY_URL || process.env.REDIS_URL || '';
const CACHE_DEBUG = process.env.CACHE_DEBUG === 'true';

type CacheStats = {
  hits: number;
  misses: number;
  sets: number;
  invalidations: number;
  errors: number;
};

const globalForValkey = globalThis as unknown as {
  __risebyedenValkeyClient?: ValkeyClient;
  __risebyedenValkeyConnectPromise?: Promise<ValkeyClient | null>;
  __risebyedenCacheStats?: CacheStats;
};

const cacheStats: CacheStats = globalForValkey.__risebyedenCacheStats ?? {
  hits: 0,
  misses: 0,
  sets: 0,
  invalidations: 0,
  errors: 0,
};

if (!globalForValkey.__risebyedenCacheStats) {
  globalForValkey.__risebyedenCacheStats = cacheStats;
}

function isCacheConfigured(): boolean {
  return Boolean(VALKEY_URL);
}

function trace(event: string, payload: Record<string, unknown>) {
  if (!CACHE_DEBUG) {
    return;
  }
  console.info(`valkey:${event}`, payload);
}

async function getClient(): Promise<ValkeyClient | null> {
  if (!isCacheConfigured()) {
    return null;
  }

  if (globalForValkey.__risebyedenValkeyClient?.isOpen) {
    return globalForValkey.__risebyedenValkeyClient;
  }

  if (globalForValkey.__risebyedenValkeyConnectPromise) {
    return globalForValkey.__risebyedenValkeyConnectPromise;
  }

  const client = createClient({ url: VALKEY_URL });
  client.on('error', (error) => {
    console.error('valkey:error', error);
  });

  globalForValkey.__risebyedenValkeyConnectPromise = client.connect()
    .then(() => {
      globalForValkey.__risebyedenValkeyClient = client;
      return client;
    })
    .catch((error) => {
      console.error('valkey:connect-failed', error);
      return null;
    })
    .finally(() => {
      globalForValkey.__risebyedenValkeyConnectPromise = undefined;
    });

  return globalForValkey.__risebyedenValkeyConnectPromise;
}

export async function getCachedJson<T>(key: string): Promise<T | null> {
  try {
    const client = await getClient();
    if (!client) {
      cacheStats.misses += 1;
      trace('miss', { key, reason: 'client-unavailable' });
      return null;
    }

    const raw = await client.get(key);
    if (!raw) {
      cacheStats.misses += 1;
      trace('miss', { key, reason: 'key-not-found' });
      return null;
    }

    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    cacheStats.hits += 1;
    trace('hit', { key });
    return parsed.data;
  } catch (error) {
    cacheStats.errors += 1;
    console.error('valkey:get-failed', { key, error });
    return null;
  }
}

export async function setCachedJson<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  try {
    const client = await getClient();
    if (!client) {
      cacheStats.errors += 1;
      trace('set-skipped', { key, reason: 'client-unavailable' });
      return;
    }

    const payload: CacheEnvelope<T> = { data: value };
    await client.set(key, JSON.stringify(payload), { EX: ttlSeconds });
    cacheStats.sets += 1;
    trace('set', { key, ttlSeconds });
  } catch (error) {
    cacheStats.errors += 1;
    console.error('valkey:set-failed', { key, error });
  }
}

export async function deleteCacheKeys(keys: string[]): Promise<void> {
  if (!keys.length) {
    return;
  }

  try {
    const client = await getClient();
    if (!client) {
      cacheStats.errors += 1;
      trace('delete-skipped', { keys, reason: 'client-unavailable' });
      return;
    }

    await client.del(keys);
    cacheStats.invalidations += keys.length;
    trace('delete', { keys });
  } catch (error) {
    cacheStats.errors += 1;
    console.error('valkey:delete-failed', { keys, error });
  }
}

export function getCacheStats(): CacheStats {
  return { ...cacheStats };
}
