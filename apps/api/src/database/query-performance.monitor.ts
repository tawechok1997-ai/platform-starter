import { createHash } from 'node:crypto';

type QueryPerformanceEvent = {
  query: string;
  duration: number;
  target?: string;
  timestamp?: Date | number;
};

export type QueryPerformanceSignal =
  | {
      kind: 'slow-query';
      fingerprint: string;
      durationMs: number;
      target: string | null;
      thresholdMs: number;
    }
  | {
      kind: 'n-plus-one-burst';
      fingerprint: string;
      count: number;
      windowMs: number;
      target: string | null;
    };

type BurstState = { startedAt: number; count: number; lastReportedCount: number };

export class QueryPerformanceMonitor {
  private readonly bursts = new Map<string, BurstState>();

  constructor(
    private readonly options: {
      slowQueryMs: number;
      burstWindowMs: number;
      burstThreshold: number;
    },
  ) {}

  observe(event: QueryPerformanceEvent): QueryPerformanceSignal[] {
    const now = normalizeTimestamp(event.timestamp);
    const fingerprint = fingerprintQuery(event.query);
    const signals: QueryPerformanceSignal[] = [];

    if (event.duration >= this.options.slowQueryMs) {
      signals.push({
        kind: 'slow-query',
        fingerprint,
        durationMs: event.duration,
        target: event.target ?? null,
        thresholdMs: this.options.slowQueryMs,
      });
    }

    const current = this.bursts.get(fingerprint);
    const burst =
      !current || now - current.startedAt > this.options.burstWindowMs
        ? { startedAt: now, count: 1, lastReportedCount: 0 }
        : { ...current, count: current.count + 1 };

    if (burst.count >= this.options.burstThreshold && burst.count > burst.lastReportedCount) {
      signals.push({
        kind: 'n-plus-one-burst',
        fingerprint,
        count: burst.count,
        windowMs: this.options.burstWindowMs,
        target: event.target ?? null,
      });
      burst.lastReportedCount = burst.count;
    }

    this.bursts.set(fingerprint, burst);
    this.prune(now);
    return signals;
  }

  private prune(now: number) {
    const maxAge = this.options.burstWindowMs * 2;
    for (const [fingerprint, burst] of this.bursts) {
      if (now - burst.startedAt > maxAge) this.bursts.delete(fingerprint);
    }
  }
}

export function fingerprintQuery(query: string): string {
  const normalized = query
    .replace(/\s+/g, ' ')
    .replace(/\$\d+/g, '?')
    .trim()
    .toLowerCase();
  return createHash('sha256').update(normalized).digest('hex').slice(0, 16);
}

function normalizeTimestamp(timestamp: Date | number | undefined): number {
  if (timestamp instanceof Date) return timestamp.getTime();
  return timestamp ?? Date.now();
}
