import { memberApiFetch } from '../member-api';
import { resolveLocalAssetOrSource } from './local-asset-by-basename';

export type MemberGamePlatform = 'pc' | 'mobile';
export type MemberGameBadge = 'HOT' | 'NEW' | '';

export type MemberCatalogGame = {
  id: string;
  providerGameCode: string;
  name: string;
  provider: string;
  providerName: string;
  providerIcon: string;
  providerIconSource: string;
  image: string;
  imageSource: string;
  badge: MemberGameBadge;
  players: number;
  category: string;
  tags: string[];
  platform: MemberGamePlatform | 'both';
  popular: boolean;
  fresh: boolean;
  createdAt: string;
};

type CatalogMedia = {
  sourceUrl?: string | null;
  cachedUrl?: string | null;
  status?: string | null;
};

type CatalogProvider = {
  code?: string | null;
  name?: string | null;
  logoUrl?: string | null;
};

type RawCatalogGame = {
  id?: string | null;
  providerGameCode?: string | null;
  code?: string | null;
  name?: string | null;
  providerId?: string | null;
  provider?: string | CatalogProvider | null;
  providerLogoUrl?: string | null;
  category?: string | null;
  platform?: string | null;
  tags?: unknown;
  metadata?: unknown;
  imageUrl?: string | null;
  iconUrl?: string | null;
  media?: CatalogMedia[] | null;
  onlinePlayers?: number | null;
  playerCount?: number | null;
  isPopular?: boolean | null;
  isFeatured?: boolean | null;
  isNew?: boolean | null;
  createdAt?: string | null;
};

type CatalogPayload = {
  items?: RawCatalogGame[] | null;
  data?: RawCatalogGame[] | { items?: RawCatalogGame[] | null } | null;
  pagination?: {
    total?: number | null;
    totalPages?: number | null;
    hasMore?: boolean | null;
  } | null;
  counts?: { total?: number | null } | null;
};

const PAGE_LIMIT = 250;
const MAX_PAGES_PER_CATEGORY = 40;
const PAGE_BATCH_SIZE = 4;
const DEFAULT_CATEGORIES = ['slot', 'casino', 'arcade', 'fishing', 'sport', 'card', 'lottery'] as const;
const cachedCatalogs = new Map<MemberGamePlatform, Promise<MemberCatalogGame[]>>();

export function getMemberGameCatalog(platform: MemberGamePlatform) {
  const current = cachedCatalogs.get(platform);
  if (current) return current;

  const request = loadMemberGameCatalog(platform).catch((error) => {
    cachedCatalogs.delete(platform);
    throw error;
  });
  cachedCatalogs.set(platform, request);
  return request;
}

export async function loadMemberGameCatalog(
  platform: MemberGamePlatform,
  signal?: AbortSignal,
  categories: readonly string[] = DEFAULT_CATEGORIES,
): Promise<MemberCatalogGame[]> {
  const outcomes = await Promise.allSettled(
    Array.from(new Set(categories.map(normalizeCategory).filter(Boolean)))
      .map((category) => loadCategory(category, platform, signal)),
  );

  if (signal?.aborted) throw abortError();

  const successful = outcomes.filter(
    (outcome): outcome is PromiseFulfilledResult<RawCatalogGame[]> => outcome.status === 'fulfilled',
  );
  if (successful.length === 0) throw new Error(`catalog unavailable for ${platform}`);

  const mapped = successful.flatMap(({ value }) => value
    .map((item) => mapMemberCatalogGame(item, platform))
    .filter((item): item is MemberCatalogGame => Boolean(item)));

  return Array.from(
    new Map(mapped.map((game) => [catalogKey(game), game] as const)).values(),
  ).sort((left, right) => gameScore(right) - gameScore(left) || left.name.localeCompare(right.name, 'th'));
}

async function loadCategory(
  category: string,
  platform: MemberGamePlatform,
  signal?: AbortSignal,
): Promise<RawCatalogGame[]> {
  const first = await fetchCatalogPage(category, platform, 1, signal);
  const items = [...readCatalogItems(first)];
  const totalPages = Math.min(MAX_PAGES_PER_CATEGORY, readTotalPages(first, items.length));

  for (let start = 2; start <= totalPages; start += PAGE_BATCH_SIZE) {
    const pages = Array.from(
      { length: Math.min(PAGE_BATCH_SIZE, totalPages - start + 1) },
      (_, index) => start + index,
    );
    const outcomes = await Promise.allSettled(
      pages.map((page) => fetchCatalogPage(category, platform, page, signal)),
    );
    outcomes.forEach((outcome) => {
      if (outcome.status === 'fulfilled') items.push(...readCatalogItems(outcome.value));
    });
    if (signal?.aborted) throw abortError();
  }

  return items;
}

async function fetchCatalogPage(
  category: string,
  platform: MemberGamePlatform,
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
    ...(signal ? { signal } : {}),
    skipAuth: true,
    suppressSessionExpiryRedirect: true,
  });
  if (!response.ok) throw new Error(`catalog ${platform}/${category}/${page}: ${response.status}`);
  return response.json().catch(() => null) as Promise<CatalogPayload | null>;
}

function readCatalogItems(payload: CatalogPayload | null): RawCatalogGame[] {
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (payload?.data && typeof payload.data === 'object' && Array.isArray(payload.data.items)) {
    return payload.data.items;
  }
  return [];
}

function readTotalPages(payload: CatalogPayload | null, fallbackCount: number) {
  const direct = Number(payload?.pagination?.totalPages);
  if (Number.isFinite(direct) && direct > 0) return Math.floor(direct);

  const total = Number(payload?.pagination?.total ?? payload?.counts?.total ?? fallbackCount);
  if (!Number.isFinite(total) || total <= 0) return 1;
  return Math.max(1, Math.ceil(total / PAGE_LIMIT));
}

export function mapMemberCatalogGame(
  item: RawCatalogGame,
  requestedPlatform: MemberGamePlatform,
): MemberCatalogGame | null {
  const providerObject = item.provider && typeof item.provider === 'object' ? item.provider : null;
  const provider = normalizeProvider(firstText(
    providerObject?.code,
    item.providerId,
    typeof item.provider === 'string' ? item.provider : null,
  ));
  const providerName = firstText(
    providerObject?.name,
    typeof item.provider === 'string' ? item.provider : null,
    providerObject?.code,
    item.providerId,
  ).toUpperCase();
  const id = firstText(item.providerGameCode, item.code, item.id);
  const name = firstText(item.name);
  const readyMedia = item.media?.find((media) => media.status === 'READY');
  const firstMedia = item.media?.[0];
  const imageSource = firstText(
    readyMedia?.cachedUrl,
    item.imageUrl,
    readyMedia?.sourceUrl,
    item.iconUrl,
    firstMedia?.cachedUrl,
    firstMedia?.sourceUrl,
  );
  if (!id || !name || !imageSource) return null;

  const providerIconSource = firstText(
    item.providerLogoUrl,
    providerObject?.logoUrl,
    provider ? `https://cdn.zabbet.com/providers/set/1_1_badge/${provider}.png` : null,
  );
  const category = normalizeCategory(item.category);
  const tags = collectMemberGameTags(item, category);
  const popular = item.isPopular === true || item.isFeatured === true || tags.includes('hot') || tags.includes('popular');
  const fresh = item.isNew === true || tags.includes('new');

  return {
    id,
    providerGameCode: firstText(item.providerGameCode, item.code, item.id),
    name,
    provider,
    providerName: providerName || provider.toUpperCase(),
    providerIcon: resolveAsset(providerIconSource, requestedPlatform),
    providerIconSource,
    image: resolveAsset(imageSource, requestedPlatform),
    imageSource,
    badge: popular ? 'HOT' : fresh ? 'NEW' : '',
    players: readPlayers(item),
    category,
    tags,
    platform: normalizePlatform(item.platform, requestedPlatform),
    popular,
    fresh,
    createdAt: firstText(item.createdAt),
  };
}

export function collectMemberGameTags(item: RawCatalogGame, normalizedCategory = normalizeCategory(item.category)) {
  const tags = new Set<string>();
  if (normalizedCategory) tags.add(normalizedCategory);
  if (normalizedCategory === 'card') tags.add('table');
  if (normalizedCategory === 'arcade') tags.add('classic');

  for (const rawTag of [...readTags(item.tags), ...readMetadataTags(item.metadata)]) {
    const normalized = normalizeTag(rawTag);
    if (normalized) tags.add(normalized);
    if (/อาเขต|arcade|classic/.test(normalized)) tags.add('arcade');
    if (/ฟรีสปิน|free[- ]?spin|buy|bonus/.test(normalized)) tags.add('buy');
    if (/ฮิต|hot|popular|ยอดนิยม/.test(normalized)) tags.add('hot');
    if (/ใหม่|new/.test(normalized)) tags.add('new');
    if (/สล็อต|slot/.test(normalized)) tags.add('slot');
    if (/โต๊ะ|table|card|ไพ่/.test(normalized)) tags.add('table');
    if (/คาสิโน|casino|live/.test(normalized)) tags.add('casino');
    if (/ปลา|fish/.test(normalized)) tags.add('fishing');
    if (/กีฬา|sport/.test(normalized)) tags.add('sport');
    if (/หวย|lottery|lotto/.test(normalized)) tags.add('lottery');
  }

  const name = firstText(item.name).toLowerCase();
  if (/buy feature|buy bonus|free spin|ฟรีสปิน/.test(name)) tags.add('buy');
  if (item.isPopular || item.isFeatured) tags.add('hot');
  if (item.isPopular) tags.add('popular');
  if (item.isNew) tags.add('new');
  return Array.from(tags);
}

function readTags(value: unknown) {
  return Array.isArray(value)
    ? value.filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0)
    : [];
}

function readMetadataTags(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return readTags((value as { tags?: unknown }).tags);
}

function normalizeTag(value: string) {
  return value.trim().toLocaleLowerCase('th').replace(/\s+/g, ' ');
}

function normalizeProvider(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.(?:png|jpe?g|webp|svg)$/i, '')
    .replace(/[^a-z0-9_-]+/g, '');
}

function normalizeCategory(value: unknown) {
  const category = String(value ?? '').trim().toLowerCase();
  if (category === 'fish') return 'fishing';
  if (category === 'sports') return 'sport';
  if (category === 'table') return 'card';
  if (category === 'lotto') return 'lottery';
  if (category === 'live') return 'casino';
  return category || 'slot';
}

function normalizePlatform(value: unknown, fallback: MemberGamePlatform): MemberGamePlatform | 'both' {
  const platform = String(value ?? '').trim().toLowerCase();
  if (platform === 'mobile') return 'mobile';
  if (platform === 'pc' || platform === 'desktop') return 'pc';
  if (platform === 'both') return 'both';
  return fallback;
}

function resolveAsset(source: string, platform: MemberGamePlatform) {
  if (!source) return '';
  return resolveLocalAssetOrSource(source, platform) || source;
}

function readPlayers(item: RawCatalogGame) {
  const value = Number(item.onlinePlayers ?? item.playerCount);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
}

function gameScore(game: MemberCatalogGame) {
  return (game.popular ? 1_000_000 : 0)
    + (game.fresh ? 100_000 : 0)
    + game.players;
}

function catalogKey(game: MemberCatalogGame) {
  return `${game.platform}:${game.provider}:${game.providerGameCode || game.id}`.toLowerCase();
}

function firstText(...values: Array<string | null | undefined>) {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() ?? '';
}

function abortError() {
  return new DOMException('Aborted', 'AbortError');
}
