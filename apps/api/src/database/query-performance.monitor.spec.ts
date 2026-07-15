import { QueryPerformanceMonitor, fingerprintQuery } from './query-performance.monitor';

describe('QueryPerformanceMonitor', () => {
  it('emits a slow-query signal without exposing raw SQL', () => {
    const monitor = new QueryPerformanceMonitor({ slowQueryMs: 100, burstWindowMs: 1000, burstThreshold: 3 });
    const signals = monitor.observe({ query: 'SELECT * FROM users WHERE id = $1', duration: 150, target: 'quaint::connector' });

    expect(signals).toEqual([
      {
        kind: 'slow-query',
        fingerprint: fingerprintQuery('SELECT * FROM users WHERE id = $1'),
        durationMs: 150,
        target: 'quaint::connector',
        thresholdMs: 100,
      },
    ]);
    expect(JSON.stringify(signals)).not.toContain('SELECT');
  });

  it('emits an N+1 burst signal inside the configured window', () => {
    const monitor = new QueryPerformanceMonitor({ slowQueryMs: 1000, burstWindowMs: 500, burstThreshold: 3 });
    const query = 'SELECT "users"."id" FROM "users" WHERE "users"."id" = $1';

    expect(monitor.observe({ query, duration: 1, timestamp: 1000 })).toEqual([]);
    expect(monitor.observe({ query, duration: 1, timestamp: 1100 })).toEqual([]);
    expect(monitor.observe({ query, duration: 1, timestamp: 1200 })).toEqual([
      {
        kind: 'n-plus-one-burst',
        fingerprint: fingerprintQuery(query),
        count: 3,
        windowMs: 500,
        target: null,
      },
    ]);
  });

  it('starts a new burst after the window expires', () => {
    const monitor = new QueryPerformanceMonitor({ slowQueryMs: 1000, burstWindowMs: 100, burstThreshold: 2 });
    const query = 'SELECT 1';

    monitor.observe({ query, duration: 1, timestamp: 0 });
    expect(monitor.observe({ query, duration: 1, timestamp: 200 })).toEqual([]);
  });
});
