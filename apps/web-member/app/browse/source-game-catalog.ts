import {
  loadMemberGameCatalog,
  mapMemberCatalogGame,
  type MemberCatalogGame,
  type RawCatalogGame,
} from '../lib/member-game-catalog';
import {
  resolveGameAssetOrSource,
  resolveProviderAssetOrSource,
  type LocalProviderArtworkKind,
} from '../lib/local-asset-by-basename';
import type {
  SourceGameFilterKey,
  SourceGameItem,
  SourceGameProvider,
} from './source-game-category-page';

export type SourceCatalogPlatform = 'pc' | 'mobile';
export type CatalogGame = RawCatalogGame;

export type SourceCategoryCatalog = {
  games: SourceGameItem[];
  providers: SourceGameProvider[];
  total: number;
  incomplete: boolean;
  sourcePlatform?: SourceCatalogPlatform;
};

const CATEGORY_API_GROUPS: Record<string, readonly string[]> = {
  casino: ['casino', 'live'],
  slot: ['slot', 'arcade'],
  fishing: ['fishing', 'fish'],
  sport: ['sport', 'sports'],
  card: ['card', 'table'],
  lotto: ['lottery', 'lotto'],
  lottery: ['lottery', 'lotto'],
};

const SOURCE_FILTER_KEYS = new Set<SourceGameFilterKey>([
  'arcade',
  'buy',
  'hot',
  'new',
  'slot',
  'table',
]);

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
  let sourcePlatform = platform;
  let incomplete = false;
  let catalogGames: MemberCatalogGame[] = [];

  try {
    catalogGames = await loadMemberGameCatalog(platform, signal, categories);
  } catch (error) {
    if (isAbortError(error)) throw error;
    incomplete = true;
  }

  if (platform === 'mobile' && catalogGames.length === 0) {
    sourcePlatform = 'pc';
    incomplete = true;
    try {
      catalogGames = await loadMemberGameCatalog('pc', signal, categories);
    } catch (error) {
      if (isAbortError(error)) throw error;
      catalogGames = [];
    }
  }

  const games = catalogGames
    .map((game) => mapLoadedCatalogGame(game, platform))
    .filter((game): game is SourceGameItem => Boolean(game));
  const providers = buildLoadedProviders(
    catalogGames,
    games,
    configuredProviders,
    platform,
  );

  return {
    games,
    providers,
    total: games.length,
    incomplete,
    sourcePlatform,
  };
}

export function mapCatalogGame(
  item: CatalogGame,
  configuredProviders: readonly SourceGameProvider[] = [],
  requestedPlatform: SourceCatalogPlatform = 'pc',
): SourceGameItem | null {
  const mapped = mapMemberCatalogGame(item, requestedPlatform);
  if (!mapped) return null;

  const providerCode = normalizeProviderCode(mapped.provider);
  const configuredProvider = configuredProviders.find(
    (provider) => normalizeProviderCode(provider.code) === providerCode,
  );
  const providerArtwork = new Set(
    [
      configuredProvider?.card,
      configuredProvider?.badge,
      configuredProvider?.background,
      configuredProvider?.title,
      configuredProvider?.avatar,
    ].filter((source): source is string => Boolean(source)),
  );
  const providerObject = item.provider && typeof item.provider === 'object'
    ? item.provider
    : null;
  const selectedMedia = selectMedia(item.media, requestedPlatform);
  const firstMedia = item.media?.[0];
  const image = resolveDistinctGameArtwork(
    requestedPlatform,
    providerCode,
    mapped.providerGameCode || mapped.id,
    providerArtwork,
    selectedMedia?.cachedUrl,
    item.imageUrl,
    selectedMedia?.sourceUrl,
    item.iconUrl,
    firstMedia?.cachedUrl,
    firstMedia?.sourceUrl,
  );
  if (!image) return null;

  const providerBadge = resolveProviderArtwork(
    requestedPlatform,
    providerCode,
    'badge',
    providerObject?.badgeUrl,
    item.providerLogoUrl,
    providerObject?.logoUrl,
    configuredProvider?.badge,
    mapped.providerIconSource,
    mapped.providerIcon,
    providerCode ? providerAssetSource('badge', providerCode) : undefined,
  );

  return {
    id: mapped.providerGameCode || mapped.id,
    name: mapped.name,
    image,
    provider: providerCode || null,
    ...(providerBadge ? { providerBadge } : {}),
    isNew: mapped.fresh,
    isHot: mapped.popular,
    tags: toSourceTags(mapped.tags),
    origin: 'catalog',
    platform: mapped.platform,
  };
}

function mapLoadedCatalogGame(
  game: MemberCatalogGame,
  requestedPlatform: SourceCatalogPlatform,
): SourceGameItem | null {
  const providerCode = normalizeProviderCode(game.provider);
  const image = resolveGameArtwork(
    requestedPlatform,
    providerCode,
    game.providerGameCode || game.id,
    game.imageSource,
    game.image,
  );
  if (!image) return null;

  const providerBadge = resolveProviderArtwork(
    requestedPlatform,
    providerCode,
    'badge',
    game.providerIconSource,
    game.providerIcon,
    providerCode ? providerAssetSource('badge', providerCode) : undefined,
  );

  return {
    id: game.providerGameCode || game.id,
    name: game.name,
    image,
    provider: providerCode || null,
    ...(providerBadge ? { providerBadge } : {}),
    isNew: game.fresh,
    isHot: game.popular,
    tags: toSourceTags(game.tags),
    origin: 'catalog',
    platform: game.platform,
  };
}

function buildLoadedProviders(
  catalogGames: readonly MemberCatalogGame[],
  games: readonly SourceGameItem[],
  configuredProviders: readonly SourceGameProvider[],
  requestedPlatform: SourceCatalogPlatform,
) {
  const configured = new Map(
    configuredProviders.map((provider) => [normalizeProviderCode(provider.code), provider] as const),
  );
  const firstCatalogByProvider = new Map<string, MemberCatalogGame>();
  const firstGameByProvider = new Map<string, SourceGameItem>();

  catalogGames.forEach((game) => {
    const code = normalizeProviderCode(game.provider);
    if (code && !firstCatalogByProvider.has(code)) firstCatalogByProvider.set(code, game);
  });
  games.forEach((game) => {
    if (game.provider && !firstGameByProvider.has(game.provider)) {
      firstGameByProvider.set(game.provider, game);
    }
  });

  return Array.from(firstCatalogByProvider.entries()).map(([code, catalogGame]) => {
    const configuredProvider = configured.get(code);
    const firstGame = firstGameByProvider.get(code);
    const badge = resolveProviderArtwork(
      requestedPlatform,
      code,
      'badge',
      catalogGame.providerIconSource,
      catalogGame.providerIcon,
      configuredProvider?.badge,
      firstGame?.providerBadge,
      providerAssetSource('badge', code),
    );
    const card = resolveProviderArtwork(
      requestedPlatform,
      code,
      'card',
      configuredProvider?.card,
      providerAssetSource('card', code),
      firstGame?.image,
      badge,
    );

    return {
      code,
      name: firstText(catalogGame.providerName, configuredProvider?.name, code.toUpperCase()),
      badge,
      card,
      background: resolveProviderArtwork(
        requestedPlatform,
        code,
        'background',
        configuredProvider?.background,
        providerAssetSource('background', code),
      ),
      title: resolveProviderArtwork(
        requestedPlatform,
        code,
        'title',
        configuredProvider?.title,
        providerAssetSource('title', code),
      ),
      avatar: resolveProviderArtwork(
        requestedPlatform,
        code,
        'avatar',
        configuredProvider?.avatar,
        providerAssetSource('avatar', code),
      ),
      ...(configuredProvider?.maintenance ? { maintenance: true } : {}),
    } satisfies SourceGameProvider;
  });
}

function resolveDistinctGameArtwork(
  platform: SourceCatalogPlatform,
  providerCode: string,
  gameId: string,
  excluded: ReadonlySet<string>,
  ...sources: Array<string | null | undefined>
) {
  for (const source of sources) {
    const value = firstText(source);
    if (!value || excluded.has(value)) continue;
    const resolved = resolveGameArtwork(platform, providerCode, gameId, value);
    if (resolved && !excluded.has(resolved)) return resolved;
  }
  return '';
}

function resolveGameArtwork(
  platform: SourceCatalogPlatform,
  providerCode: string,
  gameId: string,
  ...sources: Array<string | null | undefined>
) {
  const alternate = platform === 'mobile' ? 'pc' : 'mobile';
  for (const source of sources) {
    const value = firstText(source);
    if (!value) continue;
    const exact = resolveGameAssetOrSource(value, platform, providerCode, gameId);
    const alternateResolved = resolveGameAssetOrSource(value, alternate, providerCode, gameId);
    const local = [exact, alternateResolved].find(isLocalAsset);
    if (local) return local;
    if (exact) return exact;
    if (alternateResolved) return alternateResolved;
    return value;
  }
  return '';
}

function resolveProviderArtwork(
  platform: SourceCatalogPlatform,
  providerCode: string,
  kind: LocalProviderArtworkKind,
  ...sources: Array<string | null | undefined>
) {
  const alternate = platform === 'mobile' ? 'pc' : 'mobile';
  for (const source of sources) {
    const value = firstText(source);
    if (!value) continue;
    const exact = resolveProviderAssetOrSource(value, platform, providerCode, kind);
    const alternateResolved = resolveProviderAssetOrSource(value, alternate, providerCode, kind);
    const local = [exact, alternateResolved].find(isLocalAsset);
    if (local) return local;
    if (exact) return exact;
    if (alternateResolved) return alternateResolved;
    return value;
  }
  return '';
}

function selectMedia(
  items: RawCatalogGame['media'],
  platform: SourceCatalogPlatform,
) {
  if (!items?.length) return undefined;
  const ready = items.filter((item) => (
    item.status === 'READY' || item.status === 'FALLBACK' || !item.status
  ));
  const exact = ready.find((item) => mediaPlatform(item.metadata) === platform);
  if (exact) return exact;
  const shared = ready.find((item) => ['shared', 'both', ''].includes(mediaPlatform(item.metadata)));
  return shared ?? ready[0] ?? items[0];
}

function mediaPlatform(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return '';
  const source = metadata as Record<string, unknown>;
  const value = String(source.platform ?? source.targetPlatform ?? '').trim().toLowerCase();
  return value === 'desktop' ? 'pc' : value;
}

function toSourceTags(tags: readonly string[]) {
  return Array.from(new Set(
    tags.filter((tag): tag is SourceGameFilterKey => SOURCE_FILTER_KEYS.has(tag as SourceGameFilterKey)),
  ));
}

function providerAssetSource(
  kind: 'badge' | 'card' | 'background' | 'title' | 'avatar',
  code: string,
) {
  const set = kind === 'card'
    ? '1_1_v'
    : kind === 'background'
      ? '1_1_bg'
      : `1_1_${kind}`;
  return `https://cdn.zabbet.com/providers/set/${set}/${code}.png`;
}

function normalizeCategory(value?: string | null) {
  const category = String(value ?? '').trim().toLowerCase();
  if (category === 'fish') return 'fishing';
  if (category === 'sports') return 'sport';
  if (category === 'table') return 'card';
  if (category === 'lotto') return 'lottery';
  if (category === 'live') return 'casino';
  return category;
}

function normalizeProviderCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\.(?:png|jpe?g|webp|svg)$/i, '')
    .replace(/[^a-z0-9_-]+/g, '');
}

function isLocalAsset(value: string) {
  return value.startsWith('/') && !value.startsWith('//');
}

function firstText(...values: Array<string | null | undefined>) {
  return values.find((value): value is string => (
    typeof value === 'string' && value.trim().length > 0
  ))?.trim() ?? '';
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}
