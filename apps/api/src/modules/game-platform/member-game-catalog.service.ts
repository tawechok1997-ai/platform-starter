import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  assetUrl,
  GAME_CATALOG,
  PROVIDER_DISPLAY_NAMES,
} from '../provider-simulator/provider-simulator-catalog';

type MemberGamePlatform = 'mobile' | 'pc';
type MemberGamePlatformFilter = 'all' | MemberGamePlatform | 'both';

type DatabaseProvider = {
  id: string;
  name: string;
  code: string;
  status: string;
  logoUrl: string | null;
  metadata: Prisma.JsonValue | null;
};

type DatabaseMedia = {
  id: string;
  type: string;
  sourceUrl: string | null;
  cachedUrl: string | null;
  status: string;
  isOverride: boolean;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
};

type DatabaseCatalogItem = {
  id: string;
  providerGameCode: string;
  name: string;
  category: string;
  status: string;
  sortOrder: number;
  isFeatured: boolean;
  isNew: boolean;
  isPopular: boolean;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
  provider: DatabaseProvider;
  media: DatabaseMedia[];
};

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
        provider: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
            logoUrl: true,
            metadata: true,
          },
        },
        media: {
          where: { status: { in: ['READY', 'FALLBACK'] } },
          orderBy: [{ isOverride: 'desc' }, { createdAt: 'desc' }],
          take: 12,
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

    const normalizedDatabaseItems = (databaseItems as DatabaseCatalogItem[])
      .map((item) => normalizeDatabaseItem(item, platform))
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
        badgeUrl: item.provider.badgeUrl ?? item.provider.logoUrl ?? null,
        cardUrl: item.provider.cardUrl ?? null,
        backgroundUrl: item.provider.backgroundUrl ?? null,
        titleUrl: item.provider.titleUrl ?? null,
        avatarUrl: item.provider.avatarUrl ?? null,
      }])).values(),
    ).sort((a, b) => a.name.localeCompare(b.name, 'th'));

    const featured = allItems.filter((item) => item.isFeatured);
    const presentationFeatured = featured.length > 0
      ? featured
      : allItems.filter((item) => item.isPopular || item.isNew).slice(0, 12);

    return {
      items,
      categories,
      providers,
      featured: presentationFeatured.slice(0, 12),
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
    const tags = item.tags ?? [];
    const isNew = tags.some(isNewTag);
    const isPopular = tags.some(isPopularTag);
    const imageUrl = assetUrl(item.assetPath, '');
    const logoUrl = assetUrl(item.providerLogoPath, '');
    return {
      id: `catalog:${item.platform}:${item.provider}:${item.code}`,
      providerGameCode: item.code,
      name: item.name,
      category: item.category,
      platform: item.platform,
      status: 'CATALOG_ONLY',
      isFeatured: isPopular || isNew,
      isNew,
      isPopular,
      sortOrder: 1000,
      metadata: { source: 'generated-catalog', launchReady: false, tags, platform: item.platform },
      provider: {
        id: `catalog:${item.provider}`,
        name: providerName,
        code: item.provider,
        status: 'ACTIVE',
        logoUrl,
        badgeUrl: logoUrl,
        cardUrl: providerAssetUrl('card', item.provider),
        backgroundUrl: providerAssetUrl('background', item.provider),
        titleUrl: providerAssetUrl('title', item.provider),
        avatarUrl: providerAssetUrl('avatar', item.provider),
      },
      media: imageUrl
        ? [
            {
              id: `catalog-media:${item.platform}:${item.provider}:${item.code}`,
              type: 'COVER',
              sourceUrl: imageUrl,
              cachedUrl: imageUrl,
              status: 'READY',
              isOverride: false,
              metadata: { platform: item.platform, source: 'generated-catalog' },
            },
          ]
        : [],
      imageUrl,
      iconUrl: imageUrl,
    };
  }
}

function normalizeDatabaseItem(item: DatabaseCatalogItem, filter: MemberGamePlatformFilter) {
  const itemPlatform = readDatabasePlatform(item.metadata);
  const requestedPlatform = resolveRequestedPlatform(filter, itemPlatform);
  const gamePresentation = readPresentation(item.metadata);
  const providerPresentation = readPresentation(item.provider.metadata);
  const selectedMedia = selectMedia(item.media, requestedPlatform);
  const imageUrl = firstText(
    presentationUrl(gamePresentation, 'image', requestedPlatform),
    selectedMedia?.cachedUrl,
    selectedMedia?.sourceUrl,
    item.media[0]?.cachedUrl,
    item.media[0]?.sourceUrl,
  );
  const providerAssets = {
    logoUrl: firstText(
      presentationUrl(providerPresentation, 'logo', requestedPlatform),
      item.provider.logoUrl,
    ),
    badgeUrl: firstText(
      presentationUrl(providerPresentation, 'badge', requestedPlatform),
      presentationUrl(providerPresentation, 'logo', requestedPlatform),
      item.provider.logoUrl,
    ),
    cardUrl: presentationUrl(providerPresentation, 'card', requestedPlatform),
    backgroundUrl: presentationUrl(providerPresentation, 'background', requestedPlatform),
    titleUrl: presentationUrl(providerPresentation, 'title', requestedPlatform),
    avatarUrl: presentationUrl(providerPresentation, 'avatar', requestedPlatform),
  };

  const media = selectedMedia
    ? [selectedMedia, ...item.media.filter((mediaItem) => mediaItem.id !== selectedMedia.id)]
    : item.media;

  return {
    ...item,
    platform: itemPlatform,
    imageUrl,
    iconUrl: imageUrl,
    provider: {
      id: item.provider.id,
      name: item.provider.name,
      code: item.provider.code,
      status: item.provider.status,
      ...providerAssets,
    },
    media,
  };
}

function selectMedia(items: readonly DatabaseMedia[], platform: MemberGamePlatform) {
  const exact = items.find((item) => mediaPlatform(item.metadata) === platform);
  if (exact) return exact;
  const shared = items.find((item) => ['shared', 'both', ''].includes(mediaPlatform(item.metadata)));
  return shared ?? items[0];
}

function mediaPlatform(metadata: Prisma.JsonValue | null) {
  const source = jsonObject(metadata);
  const value = String(source.platform ?? source.targetPlatform ?? '').trim().toLowerCase();
  if (value === 'desktop') return 'pc';
  return value;
}

function readPresentation(metadata: Prisma.JsonValue | null) {
  const source = jsonObject(metadata);
  const nested = jsonObject(source.presentation);
  return Object.keys(nested).length > 0 ? nested : source;
}

function presentationUrl(
  presentation: Record<string, unknown>,
  kind: 'image' | 'logo' | 'badge' | 'card' | 'background' | 'title' | 'avatar',
  platform: MemberGamePlatform,
) {
  const capitalized = `${kind.charAt(0).toUpperCase()}${kind.slice(1)}`;
  const platformPrefix = platform === 'pc' ? 'pc' : 'mobile';
  return firstText(
    stringValue(presentation[`${platformPrefix}${capitalized}Url`]),
    stringValue(presentation[`${platformPrefix}_${kind}_url`]),
    stringValue(presentation[`shared${capitalized}Url`]),
    stringValue(presentation[`shared_${kind}_url`]),
    stringValue(presentation[`${kind}Url`]),
    stringValue(presentation[`${kind}_url`]),
  );
}

function providerAssetUrl(
  kind: 'card' | 'background' | 'title' | 'avatar',
  providerCode: string,
) {
  const set = kind === 'card' ? '1_1_v' : `1_1_${kind === 'background' ? 'bg' : kind}`;
  return `https://cdn.zabbet.com/providers/set/${set}/${providerCode}.png`;
}

function resolveRequestedPlatform(
  filter: MemberGamePlatformFilter,
  itemPlatform: MemberGamePlatform | 'both',
): MemberGamePlatform {
  if (filter === 'mobile' || filter === 'pc') return filter;
  return itemPlatform === 'mobile' ? 'mobile' : 'pc';
}

function jsonObject(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function firstText(...values: Array<string | null | undefined>) {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() ?? '';
}

function isNewTag(tag: string) {
  const value = tag.trim().toLocaleLowerCase('th');
  return value.includes('ใหม่') || value === 'new';
}

function isPopularTag(tag: string) {
  const value = tag.trim().toLocaleLowerCase('th');
  return value.includes('ฮิต') || value === 'hot' || value === 'popular';
}

function normalizeFilter(value: unknown) {
  const normalized = String(value ?? '').trim().toLowerCase();
  return !normalized || normalized === 'all' ? undefined : normalized;
}

function normalizePlatform(value: unknown): MemberGamePlatformFilter {
  const normalized = String(value ?? '').trim().toLowerCase();
  return normalized === 'mobile' || normalized === 'pc' || normalized === 'both' ? normalized : 'all';
}

function matchesPlatform(value: string, filter: MemberGamePlatformFilter) {
  if (filter === 'all') return true;
  return value === filter || value === 'both';
}

function readDatabasePlatform(metadata: Prisma.JsonValue | null): MemberGamePlatform | 'both' {
  const value = String(jsonObject(metadata).platform ?? '').toLowerCase();
  return value === 'mobile' || value === 'pc' ? value : 'both';
}

function clampInteger(value: unknown, fallback: number, minimum: number, maximum: number) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, parsed));
}
