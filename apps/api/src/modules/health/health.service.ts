import { Injectable } from '@nestjs/common';
import { mkdir } from 'fs/promises';
import { runtimeMetricsSnapshot } from '../../common/observability/runtime-metrics';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async health() {
    const database = await this.checkDatabase();
    const privateMedia = await this.checkPrivateMedia();
    return { status: database === 'ok' && privateMedia === 'ok' ? 'ok' : 'degraded', service: 'api', database, privateMedia, time: new Date().toISOString() };
  }

  version() {
    return { service: 'api', version: process.env.APP_VERSION ?? '0.1.0', commit: process.env.GIT_COMMIT_SHA ?? process.env.RAILWAY_GIT_COMMIT_SHA ?? 'unknown', environment: process.env.NODE_ENV ?? 'development', builtAt: process.env.BUILT_AT ?? 'unknown', time: new Date().toISOString() };
  }

  metrics() {
    return runtimeMetricsSnapshot();
  }

  private async checkDatabase() {
    try { await this.prisma.user.count(); return 'ok'; } catch { return 'error'; }
  }

  private async checkPrivateMedia() {
    try { await mkdir(process.env.PRIVATE_MEDIA_DIR || '/tmp/platform-private-media/topup-slips', { recursive: true }); return 'ok'; } catch { return 'error'; }
  }
}
