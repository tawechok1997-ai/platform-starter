import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  assetUrl,
  GAME_CATALOG,
  PROVIDER_DISPLAY_NAMES,
  type SimulatorGamePlatform,
} from '../provider-simulator/provider-simulator-catalog';

export type MemberGameCatalogQuery = {
  platform?: string;
  provider?: string;
  category?: string;
  query?: string;
  page?: string | number;
  limit?: string | number;
};

@Injectable()
export class MemberGameCatalogService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: MemberGameCatalogQuery = {}) {
    const page = clampInteger(query.page, 1, 1, 100000);
    const limit = clampInteger(query.limit, 120, 1, 250);
    const platform = normalizePlatform(query.platform);
    const provider = normalizeFilter(query.provider);
    const category = normalizeFilter(query.category);
    const search = String(query.query ?? '').trim().toLocaleLowerCase('th');

    const databaseItems = await this.prisma.game.findMany({
      where: {
        status: 'ACTIVE',
        provider: { status: 'ACTIVE' },
        ...(provider ? { provider: { status: 'ACTIVE', code: provider } } : {}),
        ...(category ? { category } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { providerGameCode: { contains: search, mode: 'insensitive' } },
                { provider: { name: { contains: search, mode: 'insensitive' } } },
                { provider: { code: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {}),
      },
      orderBy: [
        { isFeatured: 'desc' },
        { isPopular: 'desc' },
        { sortOrder: 'asc' },
        { name: 'asc' },
      ],
      include: {
        provider: { select: { id: true, name: true, code: true, status: true, logoUrl: true } },
        media: {
          where: { status: { in: ['READY', 'FALLBACK'] } },
          orderBy: [{ isOverride: 'desc' }, { createdAt: 'desc' }],
          take: 6,
        },
      },
    });

    const databaseCodes = new Set(
      databaseItems.map((item) => `${item.provider.code.toLowerCase()}:${item.providerGameCode.toLowerCase()}`),
    );

    const generatedItems = GAME_CATALOG
      .filter((item) => !databaseCodes.has(`${item.provider.toLowerCase()}:${item.code.toLowerCase()}`))
      .map((item) => this.generatedItem(item))
      .filter((item) => matchesPlatform(item.platform, platform))
      .filter((item) => !provider || item.provider.code.toLowerCase() === provider)
      .filter((item) => !category || item.category.toLowerCase() === category)
      .filter((item) => {
        if (!search) return true;
        return `${item.name} ${item.providerGameCode} ${item.provider.name} ${item.provider.code} ${item.category} ${item.platform}`
          .toLocaleLowerCase('th')
          .includes(search);
      });

    const normalizedDatabaseItems = databaseItems
      .map((item) => ({ ...item, platform: readDatabasePlatform(item.metadata) }))
      .filter((item) => matchesPlatform(item.platform, platform));

    const allItems = [...normalizedDatabaseItems, ...generatedItems];
    const start = (page - 1) * limit;
    const items = allItems.slice(start, start + limit);
    const categories = Array.from(new Set(allItems.map((item) => item.category))).sort((a, b) => a.localeCompare(b, 'th'));
    const providers = Array.from(
      new Map(allItems.map((item) => [item.provider.code, {
        code: item.provider.code,
        name: item.provider.name,
        logoUrl: item.provider.logoUrl ?? null,
      }])).values(),
    ).sort((a, b) => a.name.localeCompare(b.name, 'th'));

    return {
      items,
      categories,
      providers,
      featured: allItems.filter((item) => item.isFeatured).slice(0, 12),
      newest: allItems.filter((item) => item.isNew).slice(0, 12),
      popular: allItems.filter((item) => item.isPopular).slice(0, 12),
      pagination: {
        page,
        limit,
        total: allItems.length,
        totalPages: Math.max(1, Math.ceil(allItems.length / limit)),
        hasMore: start + items.length < allItems.length,
      },
      counts: {
        total: allItems.length,
        database: normalizedDatabaseItems.length,
        catalogOnly: generatedItems.length,
        mobile: allItems.filter((item) => item.platform === 'mobile' || item.platform === 'both').length,
        pc: allItems.filter((item) => item.platform === 'pc' || item.platform === 'both').length,
      },
    };
  }

  private generatedItem(item: (typeof GAME_CATALOG)[number]) {
    const providerName = PROVIDER_DISPLAY_NAMES[item.provider] ?? item.provider;
    return {
      id: `catalog:${item.platform}:${item.provider}:${item.code}`,
      providerGameCode: item.code,
      name: item.name,
      category: item.category,
      platform: item.platform,
      status: 'CATALOG_ONLY',
      isFeatured: false,
      isNew: false,
      isPopular: false,
      sortOrder: 1000,
      metadata: { source: 'generated-catalog', launchReady: false },
      provider: {
        id: `catalog:${item.provider}`,
        name: providerName,
        code: item.provider,
        status: 'ACTIVE',
        logoUrl: assetUrl(item.providerLogoPath, ''),
      },
      media: item.assetPath
        ? [
            {
              id: `catalog-media:${item.platform}:${item.provider}:${item.code}`,
              type: 'COVER',
              sourceUrl: assetUrl(item.assetPath, ''),
              cachedUrl: assetUrl(item.assetPath, ''),
              status: 'READY',
              isOverride: false,
            },
          ]
        : [],
      imageUrl: assetUrl(item.assetPath, ''),
      iconUrl: assetUrl(item.assetPath, ''),
    };
  }
}

function normalizeFilter(value: unknown) {
  const normalized = String(value ?? '').trim().toLowerCase();
  return !normalized || normalized === 'all' ? undefined : normalized;
}

function normalizePlatform(value: unknown): 'all' | SimulatorGamePlatform | 'both' {
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'mobile' || normalized === 'pc' || normalized === 'both' ? normalized : 'all';
}

function matchesPlatform(value: string, filter: 'all' | SimulatorGamePlatform | 'both') {
  if (filter === 'all') return true;
  return value === filter || value === 'both';
}

function readDatabasePlatform(metadata: Prisma.JsonValue | null): SimulatorGamePlatform | 'both' {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return 'both';
  const value = String((metadata as Prisma.JsonObject).platform ?? '').toLowerCase();
  return value === 'mobile' || value === 'pc' ? value : 'both';
}

function clampInteger(value: unknown, fallback: number, minimum: number, maximum: number) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, parsed));
}
