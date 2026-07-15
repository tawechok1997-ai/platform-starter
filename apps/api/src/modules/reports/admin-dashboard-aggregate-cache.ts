import Redis from 'ioredis';

type CacheEntry<T> = { expiresAt: number; value: T };
type RedisLike = Pick<Redis, 'get' | 'set'>;

export type AggregateCacheOptions = {
  ttlSeconds?: number;
  maxEntries?: number;
  redisUrl?: string;
  now?: () => number;
  redis?: RedisLike | null;
};

export class AdminDashboardAggregateCache {
  private readonly memory = new Map<string, CacheEntry<unknown>>();
  private readonly ttlSeconds: number;
  private readonly maxEntries: number;
  private readonly now: () => number;
  private readonly redis: RedisLike | null;

  constructor(options: AggregateCacheOptions = {}) {
    this.ttlSeconds = positiveInteger(options.ttlSeconds, positiveInteger(Number(process.env.DASHBOARD_AGGREGATE_TTL_SECONDS), 15));
    this.maxEntries = positiveInteger(options.maxEntries, positiveInteger(Number(process.env.DASHBOARD_AGGREGATE_CACHE_MAX_ENTRIES), 100));
    this.now = options.now ?? Date.now;
    this.redis = options.redis === undefined ? createRedis(options.redisUrl ?? process.env.REDIS_URL) : options.redis;
  }

  async getOrLoad<T>(key: string, loader: () => Promise<T>): Promise<T> {
    const memoryValue = this.getMemory<T>(key);
    if (memoryValue !== undefined) return memoryValue;

    const redisValue = await this.getRedis<T>(key);
    if (redisValue !== undefined) {
      this.setMemory(key, redisValue);
      return redisValue;
    }

    const loaded = await loader();
    this.setMemory(key, loaded);
    await this.setRedis(key, loaded);
    return loaded;
  }

  private getMemory<T>(key: string): T | undefined {
    const entry = this.memory.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.now()) {
      this.memory.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  private setMemory<T>(key: string, value: T): void {
    this.pruneExpired();
    if (!this.memory.has(key) && this.memory.size >= this.maxEntries) {
      const oldestKey = this.memory.keys().next().value as string | undefined;
      if (oldestKey) this.memory.delete(oldestKey);
    }
    this.memory.delete(key);
    this.memory.set(key, { expiresAt: this.now() + this.ttlSeconds * 1000, value });
  }

  private pruneExpired(): void {
    const now = this.now();
    for (const [key, entry] of this.memory) {
      if (entry.expiresAt <= now) this.memory.delete(key);
    }
  }

  private async getRedis<T>(key: string): Promise<T | undefined> {
    if (!this.redis) return undefined;
    try {
      const raw = await this.redis.get(redisKey(key));
      return raw ? JSON.parse(raw) as T : undefined;
    } catch {
      return undefined;
    }
  }

  private async setRedis<T>(key: string, value: T): Promise<void> {
    if (!this.redis) return;
    try {
      await this.redis.set(redisKey(key), JSON.stringify(value), 'EX', this.ttlSeconds);
    } catch {
      // Redis is an optimization. The bounded in-memory fallback keeps reads available.
    }
  }
}

function createRedis(url?: string): RedisLike | null {
  if (!url) return null;
  return new Redis(url, {
    lazyConnect: false,
    maxRetriesPerRequest: 1,
    enableReadyCheck: false,
    connectTimeout: 1_500,
  });
}

function redisKey(key: string): string {
  return `aggregate:admin-dashboard:v1:${key}`;
}

function positiveInteger(value: number | undefined, fallback: number): number {
  return Number.isInteger(value) && Number(value) > 0 ? Number(value) : fallback;
}
