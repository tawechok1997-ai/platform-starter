import { AdminDashboardAggregateCache } from './admin-dashboard-aggregate-cache';

describe('AdminDashboardAggregateCache', () => {
  it('reuses a live aggregate within the TTL', async () => {
    let calls = 0;
    const cache = new AdminDashboardAggregateCache({ ttlSeconds: 30, redis: null });
    const loader = async () => ({ calls: ++calls });

    await expect(cache.getOrLoad('today', loader)).resolves.toEqual({ calls: 1 });
    await expect(cache.getOrLoad('today', loader)).resolves.toEqual({ calls: 1 });
    expect(calls).toBe(1);
  });

  it('refreshes an expired aggregate', async () => {
    let now = 1_000;
    let calls = 0;
    const cache = new AdminDashboardAggregateCache({ ttlSeconds: 1, redis: null, now: () => now });
    const loader = async () => ({ calls: ++calls });

    await cache.getOrLoad('today', loader);
    now += 1_001;
    await expect(cache.getOrLoad('today', loader)).resolves.toEqual({ calls: 2 });
  });

  it('bounds memory keys and evicts the oldest entry', async () => {
    let calls = 0;
    const cache = new AdminDashboardAggregateCache({ ttlSeconds: 30, maxEntries: 2, redis: null });
    const loader = async () => ({ calls: ++calls });

    await cache.getOrLoad('a', loader);
    await cache.getOrLoad('b', loader);
    await cache.getOrLoad('c', loader);
    await expect(cache.getOrLoad('a', loader)).resolves.toEqual({ calls: 4 });
  });

  it('uses Redis before the live loader when a distributed aggregate exists', async () => {
    const redis = {
      get: jest.fn().mockResolvedValue(JSON.stringify({ source: 'redis' })),
      set: jest.fn(),
    };
    const loader = jest.fn().mockResolvedValue({ source: 'live' });
    const cache = new AdminDashboardAggregateCache({ ttlSeconds: 30, redis: redis as never });

    await expect(cache.getOrLoad('today', loader)).resolves.toEqual({ source: 'redis' });
    expect(loader).not.toHaveBeenCalled();
  });
});
