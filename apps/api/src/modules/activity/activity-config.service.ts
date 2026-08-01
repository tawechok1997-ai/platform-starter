import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { type ActivityConfig, parseActivityConfig } from './activity-config';

const CACHE_TTL_MS = 15_000;

@Injectable()
export class ActivityConfigService {
  private cached: { expiresAt: number; value: ActivityConfig } | null = null;

  constructor(private readonly prisma: PrismaService) {}

  async getConfig(options: { fresh?: boolean } = {}) {
    if (!options.fresh && this.cached && this.cached.expiresAt > Date.now()) return this.cached.value;

    const rows = await this.prisma.siteSetting.findMany({
      where: {
        key: { startsWith: 'features.' },
        isPublic: true,
        isSensitive: false,
      },
      orderBy: { key: 'asc' },
    });
    const settings = rows.reduce<Record<string, unknown>>((result, row) => {
      result[row.key.slice('features.'.length)] = row.valueJson;
      return result;
    }, {});
    const value = parseActivityConfig(settings);
    this.cached = { expiresAt: Date.now() + CACHE_TTL_MS, value };
    return value;
  }

  clearCache() {
    this.cached = null;
  }
}
