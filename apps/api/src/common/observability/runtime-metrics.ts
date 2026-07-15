import type { QueryPerformanceSignal } from '../../database/query-performance.monitor';

type HttpMetricInput = {
  module?: unknown;
  action?: unknown;
  statusCode?: unknown;
  durationMs?: unknown;
  result?: unknown;
};

type HttpBucket = { count: number; errors: number; totalDurationMs: number; maxDurationMs: number };
type FailureBucket = { count: number; lastStatusCode: number | null; lastSeenAt: string | null };
type DbBucket = { count: number; maxDurationMs: number; lastSeenAt: string | null; thresholdMs?: number; windowMs?: number };

const httpBuckets = new Map<string, HttpBucket>();
const failureBuckets = new Map<string, FailureBucket>();
const dbBuckets = new Map<string, DbBucket>();

export function recordHttpMetric(input: HttpMetricInput): void {
  const moduleName = label(input.module, 'unknown');
  const action = label(input.action, 'unknown');
  const statusCode = numberOrNull(input.statusCode);
  const durationMs = numberOrZero(input.durationMs);
  const result = label(input.result, statusCode != null && statusCode >= 400 ? 'error' : 'success');
  const key = `${moduleName}|${action}|${result}`;
  const current = httpBuckets.get(key) ?? { count: 0, errors: 0, totalDurationMs: 0, maxDurationMs: 0 };
  current.count += 1;
  current.totalDurationMs += durationMs;
  current.maxDurationMs = Math.max(current.maxDurationMs, durationMs);
  if (statusCode != null && statusCode >= 400) current.errors += 1;
  httpBuckets.set(key, current);

  if (isTrackedFailure(moduleName, action, statusCode)) {
    const failureKey = `${moduleName}|${action}`;
    const failure = failureBuckets.get(failureKey) ?? { count: 0, lastStatusCode: null, lastSeenAt: null };
    failure.count += 1;
    failure.lastStatusCode = statusCode;
    failure.lastSeenAt = new Date().toISOString();
    failureBuckets.set(failureKey, failure);
  }
}

export function recordDbPerformanceSignal(signal: QueryPerformanceSignal): void {
  const key = `${signal.kind}|${signal.fingerprint}`;
  const current = dbBuckets.get(key) ?? { count: 0, maxDurationMs: 0, lastSeenAt: null };
  current.count += 1;
  current.lastSeenAt = new Date().toISOString();
  if (signal.kind === 'slow-query') {
    current.maxDurationMs = Math.max(current.maxDurationMs, signal.durationMs);
    current.thresholdMs = signal.thresholdMs;
  } else {
    current.windowMs = signal.windowMs;
  }
  dbBuckets.set(key, current);
}

export function runtimeMetricsSnapshot() {
  return {
    generatedAt: new Date().toISOString(),
    http: [...httpBuckets.entries()].map(([key, value]) => {
      const [moduleName, action, result] = key.split('|');
      return {
        module: moduleName,
        action,
        result,
        count: value.count,
        errors: value.errors,
        avgDurationMs: value.count > 0 ? Math.round(value.totalDurationMs / value.count) : 0,
        maxDurationMs: value.maxDurationMs,
      };
    }),
    trackedFailures: [...failureBuckets.entries()].map(([key, value]) => {
      const [moduleName, action] = key.split('|');
      return { module: moduleName, action, ...value };
    }),
    database: [...dbBuckets.entries()].map(([key, value]) => {
      const [kind, fingerprint] = key.split('|');
      return { kind, fingerprint, ...value };
    }),
  };
}

export function resetRuntimeMetricsForTest(): void {
  httpBuckets.clear();
  failureBuckets.clear();
  dbBuckets.clear();
}

function isTrackedFailure(moduleName: string, action: string, statusCode: number | null): boolean {
  if (statusCode == null || statusCode < 400) return false;
  return moduleName === 'admin.auth'
    || moduleName === 'member.auth'
    || moduleName === 'provider.webhooks'
    || action.includes('settlement')
    || action.includes('transfer')
    || action.includes('withdrawals')
    || action.includes('topups');
}

function label(value: unknown, fallback: string): string {
  if (typeof value !== 'string' && typeof value !== 'number') return fallback;
  const text = String(value).trim();
  return text.length > 0 ? text : fallback;
}

function numberOrNull(value: unknown): number | null {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function numberOrZero(value: unknown): number {
  return numberOrNull(value) ?? 0;
}
