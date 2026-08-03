import {
  resolveGameAssetOrSource,
  resolveProviderAssetOrSource,
} from './local-asset-by-basename';

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
  metadata?: unknown;
};

type CatalogProvider = {
  code?: string | null;
  name?: string | null;
  logoUrl?: string | null;
  badgeUrl?: string | null;
  cardUrl?: string | null;
  backgroundUrl?: string | null;
  titleUrl?: string | null;
  avatarUrl?: string | null;
};

export type RawCatalogGame = {
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
  const selectedMedia = selectMedia(item.media, requestedPlatform);
  const firstMedia = item.media?.[0];
  const imageSource = firstText(
    item.imageUrl,
    selectedMedia?.cachedUrl,
    selectedMedia?.sourceUrl,
    item.iconUrl,
    firstMedia?.cachedUrl,
    firstMedia?.sourceUrl,
  );
  if (!id || !name || !imageSource) return null;

  const providerIconSource = firstText(
    providerObject?.badgeUrl,
    item.providerLogoUrl,
    providerObject?.logoUrl,
    provider ? `https://cdn.zabbet.com/providers/set/1_1_badge/${provider}.png` : null,
  );
  const category = normalizeMemberGameCategory(item.category);
  const tags = collectMemberGameTags(item, category);
  const popular = item.isPopular === true || item.isFeatured === true || tags.includes('hot') || tags.includes('popular');
  const fresh = item.isNew === true || tags.includes('new');

  return {
    id,
    providerGameCode: firstText(item.providerGameCode, item.code, item.id),
    name,
    provider,
    providerName: providerName || provider.toUpperCase(),
    providerIcon: resolveProviderAssetOrSource(
      providerIconSource,
      requestedPlatform,
      provider,
      'badge',
    ),
    providerIconSource,
    image: resolveGameAssetOrSource(
      imageSource,
      requestedPlatform,
      provider,
      id,
    ),
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

export function collectMemberGameTags(
  item: RawCatalogGame,
  normalizedCategory = normalizeMemberGameCategory(item.category),
) {
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

export function normalizeMemberGameCategory(value: unknown) {
  const category = String(value ?? '').trim().toLowerCase();
  if (category === 'fish') return 'fishing';
  if (category === 'sports') return 'sport';
  if (category === 'table') return 'card';
  if (category === 'lotto') return 'lottery';
  if (category === 'live') return 'casino';
  return category || 'slot';
}

function selectMedia(items: readonly CatalogMedia[] | null | undefined, platform: MemberGamePlatform) {
  if (!items?.length) return undefined;
  const ready = items.filter((item) => item.status === 'READY' || item.status === 'FALLBACK' || !item.status);
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

function normalizePlatform(value: unknown, fallback: MemberGamePlatform): MemberGamePlatform | 'both' {
  const platform = String(value ?? '').trim().toLowerCase();
  if (platform === 'mobile') return 'mobile';
  if (platform === 'pc' || platform === 'desktop') return 'pc';
  if (platform === 'both') return 'both';
  return fallback;
}

function readPlayers(item: RawCatalogGame) {
  const value = Number(item.onlinePlayers ?? item.playerCount);
  return Number.isFinite(value) && value > 0 ? Math.round(value) : 0;
}

function firstText(...values: Array<string | null | undefined>) {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() ?? '';
}
