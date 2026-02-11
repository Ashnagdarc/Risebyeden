import { createClient } from 'redis';

type ValkeyClient = ReturnType<typeof createClient>;

type CacheEnvelope<T> = {
  data: T;
};

const VALKEY_URL = process.env.VALKEY_URL || process.env.REDIS_URL || '';

const globalForValkey = globalThis as unknown as {
  __risebyedenValkeyClient?: ValkeyClient;
  __risebyedenValkeyConnectPromise?: Promise<ValkeyClient | null>;
};

function isCacheConfigured(): boolean {
  return Boolean(VALKEY_URL);
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
      return null;
    }

    const raw = await client.get(key);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    return parsed.data;
  } catch (error) {
    console.error('valkey:get-failed', { key, error });
    return null;
  }
}

export async function setCachedJson<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  try {
    const client = await getClient();
    if (!client) {
      return;
    }

    const payload: CacheEnvelope<T> = { data: value };
    await client.set(key, JSON.stringify(payload), { EX: ttlSeconds });
  } catch (error) {
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
      return;
    }

    await client.del(keys);
  } catch (error) {
    console.error('valkey:delete-failed', { keys, error });
  }
}
