import { recordDbPerformanceSignal, recordHttpMetric, resetRuntimeMetricsForTest, runtimeMetricsSnapshot } from './runtime-metrics';

describe('runtime metrics', () => {
  beforeEach(() => resetRuntimeMetricsForTest());

  it('aggregates request latency and error-rate by module/action/result', () => {
    recordHttpMetric({ module: 'admin.auth', action: 'POST admin.auth.login', statusCode: 401, durationMs: 25, result: 'client_error' });
    recordHttpMetric({ module: 'admin.auth', action: 'POST admin.auth.login', statusCode: 200, durationMs: 15, result: 'success' });

    expect(runtimeMetricsSnapshot().http).toEqual(expect.arrayContaining([
      expect.objectContaining({ module: 'admin.auth', action: 'POST admin.auth.login', result: 'client_error', count: 1, errors: 1, avgDurationMs: 25 }),
      expect.objectContaining({ module: 'admin.auth', action: 'POST admin.auth.login', result: 'success', count: 1, errors: 0, avgDurationMs: 15 }),
    ]));
  });

  it('tracks login, money-flow, and provider callback failures', () => {
    recordHttpMetric({ module: 'member.auth', action: 'POST auth.login', statusCode: 429, durationMs: 10, result: 'client_error' });
    recordHttpMetric({ module: 'provider.webhooks', action: 'POST provider-webhooks.generic', statusCode: 500, durationMs: 30, result: 'server_error' });
    recordHttpMetric({ module: 'member.withdrawals', action: 'POST member.withdrawals', statusCode: 422, durationMs: 20, result: 'client_error' });

    expect(runtimeMetricsSnapshot().trackedFailures).toEqual(expect.arrayContaining([
      expect.objectContaining({ module: 'member.auth', action: 'POST auth.login', count: 1, lastStatusCode: 429 }),
      expect.objectContaining({ module: 'provider.webhooks', action: 'POST provider-webhooks.generic', count: 1, lastStatusCode: 500 }),
      expect.objectContaining({ module: 'member.withdrawals', action: 'POST member.withdrawals', count: 1, lastStatusCode: 422 }),
    ]));
  });

  it('records slow-query and N+1 database signals without raw SQL', () => {
    recordDbPerformanceSignal({ kind: 'slow-query', fingerprint: 'abc123', durationMs: 300, target: null, thresholdMs: 250 });
    recordDbPerformanceSignal({ kind: 'n-plus-one-burst', fingerprint: 'def456', count: 8, target: null, windowMs: 1000 });

    expect(runtimeMetricsSnapshot().database).toEqual(expect.arrayContaining([
      expect.objectContaining({ kind: 'slow-query', fingerprint: 'abc123', count: 1, maxDurationMs: 300, thresholdMs: 250 }),
      expect.objectContaining({ kind: 'n-plus-one-burst', fingerprint: 'def456', count: 1, windowMs: 1000 }),
    ]));
    expect(JSON.stringify(runtimeMetricsSnapshot())).not.toContain('SELECT');
  });
});
