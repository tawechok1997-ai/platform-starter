import { resolveLocalAssetOrSource } from '../lib/local-asset-by-basename';
import { memberApiFetch } from '../member-api';
import type {
  SourceGameFilterKey,
  SourceGameItem,
  SourceGameProvider,
} from './source-game-category-page';

type CatalogMedia = {
  sourceUrl?: string | null;
  cachedUrl?: string | null;
  status?: string | null;
};

export type SourceCatalogPlatform = 'pc' | 'mobile';

type CatalogProvider = {
  code?: string | null;
  name?: string | null;
  logoUrl?: string | null;
};

export type CatalogGame = {
  id?: string | null;
  providerGameCode?: string | null;
  name?: string | null;
  category?: string | null;
  platform?: string | null;
  imageUrl?: string | null;
  iconUrl?: string | null;
  isNew?: boolean | null;
  isPopular?: boolean | null;
  metadata?: unknown;
  provider?: CatalogProvider | null;
  media?: CatalogMedia[] | null;
};

type CatalogPayload = {
  items?: CatalogGame[] | null;
  pagination?: {
    page?: number | null;
    total?: number | null;
    totalPages?: number | null;
    hasMore?: boolean | null;
  } | null;
  counts?: { total?: number | null } | null;
};

export type SourceCategoryCatalog = {
  games: SourceGameItem[];
  providers: SourceGameProvider[];
  total: number;
  incomplete: boolean;
};

const PAGE_LIMIT = 250;
const MAX_PAGES_PER_CATEGORY = 40;
const PAGE_BATCH_SIZE = 4;

const CATEGORY_API_GROUPS: Record<string, readonly string[]> = {
  casino: ['casino', 'live'],
  slot: ['slot', 'arcade'],
  fishing: ['fishing', 'fish'],
  sport: ['sport', 'sports'],
  card: ['card', 'table'],
  lotto: ['lottery', 'lotto'],
  lottery: ['lottery', 'lotto'],
};

export function catalogGroupsForSlug(slug: string) {
  const normalized = normalizeCategory(slug);
  return Array.from(new Set(CATEGORY_API_GROUPS[normalized] ?? [normalized]));
}

export async function loadSourceCategoryCatalog(
  slug: string,
  configuredProviders: readonly SourceGameProvider[],
  platform: SourceCatalogPlatform,
  signal?: AbortSignal,
): Promise<SourceCategoryCatalog> {
  const categories = catalogGroupsForSlug(slug);
  const outcomes = await Promise.all(categories.map((category) => loadCatalogCategory(category, platform, signal)));
  const rawItems = outcomes.flatMap((outcome) => outcome.items);
  const uniqueItems = Array.from(
    new Map(rawItems.map((item) => [catalogIdentity(item, platform), item] as const)).values(),
  );
  const localizedProviders = configuredProviders.map((provider) => localizeProvider(provider, platform));
  const games = uniqueItems
    .map((item) => mapCatalogGame(item, localizedProviders, platform))
    .filter((item): item is SourceGameItem => Boolean(item));

  return {
    games,
    providers: buildCatalogProviders(uniqueItems, games, localizedProviders, platform),
    total: games.length,
    incomplete: outcomes.some((outcome) => outcome.incomplete),
  };
}

async function loadCatalogCategory(
  category: string,
  platform: SourceCatalogPlatform,
  signal?: AbortSignal,
) {
  try {
    const first = await fetchCatalogPage(category, platform, 1, signal);
    const items = [...readCatalogItems(first)];
    const totalPages = Math.min(MAX_PAGES_PER_CATEGORY, readTotalPages(first, items.length));
    let incomplete = false;

    for (let start = 2; start <= totalPages; start += PAGE_BATCH_SIZE) {
      const pages = Array.from(
        { length: Math.min(PAGE_BATCH_SIZE, totalPages - start + 1) },
        (_, index) => start + index,
      );
      const results = await Promise.allSettled(pages.map((page) => fetchCatalogPage(category, platform, page, signal)));
      results.forEach((result) => {
        if (result.status === 'fulfilled') items.push(...readCatalogItems(result.value));
        else if (!isAbortError(result.reason)) incomplete = true;
      });
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    }

    return { items, incomplete };
  } catch (error) {
    if (isAbortError(error)) throw error;
    return { items: [] as CatalogGame[], incomplete: true };
  }
}

async function fetchCatalogPage(
  category: string,
  platform: SourceCatalogPlatform,
  page: number,
  signal?: AbortSignal,
) {
  const params = new URLSearchParams({
    category,
    platform,
    page: String(page),
    limit: String(PAGE_LIMIT),
  });
  const response = await memberApiFetch(`/games/catalog?${params.toString()}`, {
    skipAuth: true,
    suppressSessionExpiryRedirect: true,
    ...(signal ? { signal } : {}),
  });
  if (!response.ok) throw new Error(`catalog ${category} page ${page}: ${response.status}`);
  return response.json().catch(() => null) as Promise<CatalogPayload | null>;
}

function readCatalogItems(payload: CatalogPayload | null) {
  return Array.isArray(payload?.items) ? payload.items.filter(isCatalogGame) : [];
}

function readTotalPages(payload: CatalogPayload | null, fallbackItemCount: number) {
  const direct = Number(payload?.pagination?.totalPages);
  if (Number.isFinite(direct) && direct > 0) return Math.floor(direct);
  const total = Number(payload?.pagination?.total ?? payload?.counts?.total ?? fallbackItemCount);
  if (!Number.isFinite(total) || total <= 0) return 1;
  return Math.max(1, Math.ceil(total / PAGE_LIMIT));
}

function isCatalogGame(value: CatalogGame) {
  return Boolean(value && typeof value === 'object' && (value.id || value.providerGameCode) && value.name);
}

function catalogIdentity(item: CatalogGame, requestedPlatform: SourceCatalogPlatform) {
  const platform = normalizeCatalogPlatform(item.platform, requestedPlatform);
  const provider = normalizeProviderCode(firstText(item.provider?.code));
  const id = firstText(item.providerGameCode, item.id).toLowerCase();
  return `${platform}:${provider}:${id}`;
}

export function mapCatalogGame(
  item: CatalogGame,
  configuredProviders: readonly SourceGameProvider[] = [],
  requestedPlatform: SourceCatalogPlatform = 'pc',
): SourceGameItem | null {
  const providerCode = normalizeProviderCode(firstText(item.provider?.code));
  const id = firstText(item.providerGameCode, item.id);
  const name = firstText(item.name);
  if (!id || !name) return null;

  const configuredProvider = configuredProviders.find(
    (provider) => normalizeProviderCode(provider.code) === providerCode,
  );
  const readyMedia = item.media?.find((media) => media.status === 'READY');
  const firstMedia = item.media?.[0];
  const image = resolveAssetForPlatform(
    requestedPlatform,
    readyMedia?.cachedUrl,
    item.imageUrl,
    readyMedia?.sourceUrl,
    item.iconUrl,
    firstMedia?.cachedUrl,
    firstMedia?.sourceUrl,
    configuredProvider?.card,
  );
  if (!image) return null;

  const tags = catalogTags(item);
  const providerBadge = resolveAssetForPlatform(
    requestedPlatform,
    item.provider?.logoUrl,
    configuredProvider?.badge,
    providerCode ? providerAssetSource('badge', providerCode) : undefined,
  );
  return {
    id,
    name,
    image,
    provider: providerCode || null,
    ...(providerBadge ? { providerBadge } : {}),
    isNew: item.isNew === true || tags.includes('new'),
    isHot: item.isPopular === true || tags.includes('hot'),
    tags,
    origin: 'catalog',
    platform: normalizeCatalogPlatform(item.platform, requestedPlatform),
  };
}

function catalogTags(item: CatalogGame) {
  const tags = new Set<SourceGameFilterKey>();
  const category = normalizeCategory(item.category);
  if (category === 'slot') tags.add('slot');
  if (category === 'arcade') tags.add('arcade');
  if (category === 'card' || category === 'table') tags.add('table');

  const sourceTags = readMetadataTags(item.metadata);
  for (const sourceTag of sourceTags) {
    const tag = sourceTag.toLocaleLowerCase('th');
    if (tag.includes('อาเขต') || tag.includes('arcade')) tags.add('arcade');
    if (tag.includes('ฟรีสปิน') || tag.includes('free spin') || tag.includes('buy')) tags.add('buy');
    if (tag.includes('ฮิต') || tag.includes('hot') || tag.includes('popular')) tags.add('hot');
    if (tag.includes('ใหม่') || tag === 'new') tags.add('new');
    if (tag.includes('สล็อต') || tag.includes('slot')) tags.add('slot');
    if (tag.includes('โต๊ะ') || tag.includes('table') || tag.includes('card')) tags.add('table');
  }

  const name = firstText(item.name);
  if (/buy feature|buy bonus|free spin|ฟรีสปิน/i.test(name)) tags.add('buy');
  if (item.isNew) tags.add('new');
  if (item.isPopular) tags.add('hot');
  return Array.from(tags);
}

function readMetadataTags(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return [];
  const tags = (metadata as { tags?: unknown }).tags;
  if (!Array.isArray(tags)) return [];
  return tags.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0);
}

function buildCatalogProviders(
  items: readonly CatalogGame[],
  games: readonly SourceGameItem[],
  configuredProviders: readonly SourceGameProvider[],
  platform: SourceCatalogPlatform,
) {
  const configured = new Map(
    configuredProviders.map((provider) => [normalizeProviderCode(provider.code), provider] as const),
  );
  const firstGameByProvider = new Map<string, SourceGameItem>();
  games.forEach((game) => {
    if (game.provider && !firstGameByProvider.has(game.provider)) firstGameByProvider.set(game.provider, game);
  });

  const providers = new Map<string, SourceGameProvider>();
  for (const item of items) {
    const code = normalizeProviderCode(firstText(item.provider?.code));
    if (!code || providers.has(code)) continue;
    const configuredProvider = configured.get(code);
    if (configuredProvider) {
      providers.set(code, {
        ...configuredProvider,
        name: firstText(item.provider?.name, configuredProvider.name, code.toUpperCase()),
        badge: resolveAssetForPlatform(platform, item.provider?.logoUrl, configuredProvider.badge),
      });
      continue;
    }

    const firstGame = firstGameByProvider.get(code);
    const badge = resolveAssetForPlatform(
      platform,
      item.provider?.logoUrl,
      firstGame?.providerBadge,
      providerAssetSource('badge', code),
    );
    providers.set(code, {
      code,
      name: firstText(item.provider?.name, code.toUpperCase()),
      badge,
      card: resolveAssetForPlatform(platform, providerAssetSource('card', code), firstGame?.image, badge),
      background: resolveAssetForPlatform(platform, providerAssetSource('bg', code)),
      title: resolveAssetForPlatform(platform, providerAssetSource('title', code)),
      avatar: resolveAssetForPlatform(platform, providerAssetSource('avatar', code)),
    });
  }
  return Array.from(providers.values());
}

function localizeProvider(
  provider: SourceGameProvider,
  platform: SourceCatalogPlatform,
): SourceGameProvider {
  return {
    ...provider,
    badge: resolveAssetForPlatform(platform, provider.badge),
    card: resolveAssetForPlatform(platform, provider.card),
    background: resolveAssetForPlatform(platform, provider.background),
    title: resolveAssetForPlatform(platform, provider.title),
    avatar: resolveAssetForPlatform(platform, provider.avatar),
  };
}

function resolveAssetForPlatform(
  platform: SourceCatalogPlatform,
  ...values: Array<string | null | undefined>
) {
  const source = firstText(...values);
  return source ? resolveLocalAssetOrSource(source, platform) : '';
}

function providerAssetSource(kind: 'badge' | 'card' | 'bg' | 'title' | 'avatar', code: string) {
  const set = kind === 'card' ? '1_1_v' : `1_1_${kind}`;
  return `https://cdn.zabbet.com/providers/set/${set}/${code}.png`;
}

function normalizeCatalogPlatform(
  value: string | null | undefined,
  fallback: SourceCatalogPlatform,
): SourceCatalogPlatform | 'both' {
  const platform = String(value ?? '').trim().toLowerCase();
  if (platform === 'mobile') return 'mobile';
  if (platform === 'pc' || platform === 'desktop') return 'pc';
  if (platform === 'both') return 'both';
  return fallback;
}

function normalizeCategory(value?: string | null) {
  const category = String(value ?? '').trim().toLowerCase();
  if (category === 'fish') return 'fishing';
  if (category === 'sports') return 'sport';
  if (category === 'table') return 'card';
  if (category === 'lotto') return 'lottery';
  return category;
}

function normalizeProviderCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.(?:png|jpe?g|webp|svg)$/i, '')
    .replace(/[^a-z0-9_-]+/g, '');
}

function firstText(...values: Array<string | null | undefined>) {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() ?? '';
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}
