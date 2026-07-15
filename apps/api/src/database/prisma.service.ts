import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';
import { QueryPerformanceMonitor } from './query-performance.monitor';

const DEFAULT_SLOW_QUERY_MS = 250;
const DEFAULT_BURST_WINDOW_MS = 1000;
const DEFAULT_BURST_THRESHOLD = 8;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('PrismaQueryPerformance');
  private readonly queryMonitor = new QueryPerformanceMonitor({
    slowQueryMs: positiveNumber(process.env.PRISMA_SLOW_QUERY_MS, DEFAULT_SLOW_QUERY_MS),
    burstWindowMs: positiveNumber(process.env.PRISMA_N1_WINDOW_MS, DEFAULT_BURST_WINDOW_MS),
    burstThreshold: positiveNumber(process.env.PRISMA_N1_BURST_THRESHOLD, DEFAULT_BURST_THRESHOLD),
  });

  constructor() {
    super({ log: [{ emit: 'event', level: 'query' }] });

    if (process.env.PRISMA_QUERY_METRICS_ENABLED !== 'false') {
      this.$on('query', (event: Prisma.QueryEvent) => {
        for (const signal of this.queryMonitor.observe(event)) {
          this.logger.warn(JSON.stringify({ event: 'prisma-query-performance', ...signal }));
        }
      });
    }
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}

function positiveNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
