import { memberApiFetch } from '../member-api';
import {
  mapMemberCatalogGame,
  type MemberCatalogGame,
  type MemberGamePlatform,
  type RawCatalogGame,
} from './member-game-catalog-model';

export {
  collectMemberGameTags,
  mapMemberCatalogGame,
  normalizeMemberGameCategory,
} from './member-game-catalog-model';
export type {
  MemberCatalogGame,
  MemberGameBadge,
  MemberGamePlatform,
  RawCatalogGame,
} from './member-game-catalog-model';

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
const DEFAULT_CATEGORIES = [
  'slot',
  'arcade',
  'casino',
  'live',
  'fishing',
  'fish',
  'sport',
  'sports',
  'card',
  'table',
  'lottery',
  'lotto',
] as const;
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
  const queryCategories = Array.from(
    new Set(categories.map(normalizeCatalogQueryCategory).filter(Boolean)),
  );
  const outcomes = await Promise.allSettled(
    queryCategories.map((category) => loadCategory(category, platform, signal)),
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

function normalizeCatalogQueryCategory(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

function gameScore(game: MemberCatalogGame) {
  return (game.popular ? 1_000_000 : 0)
    + (game.fresh ? 100_000 : 0)
    + game.players;
}

function catalogKey(game: MemberCatalogGame) {
  return `${game.platform}:${game.provider}:${game.providerGameCode || game.id}`.toLowerCase();
}

function abortError() {
  return new DOMException('Aborted', 'AbortError');
}
