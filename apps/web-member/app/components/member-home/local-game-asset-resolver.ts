import type { Game, GameProviderSummary } from '../../types/member-api';
import { REFERENCE_GAMES, REFERENCE_PROVIDERS } from '../reference-asset-catalog';

const GAME_ASSET_BY_KEY = new Map<string, string>();
const PROVIDER_ASSET_BY_KEY = new Map<string, string>();

for (const asset of REFERENCE_GAMES) {
  const key = normalizeAssetKey(asset.name);
  if (key) GAME_ASSET_BY_KEY.set(key, asset.url);
}

for (const provider of REFERENCE_PROVIDERS) {
  const key = normalizeAssetKey(provider.name);
  if (key) PROVIDER_ASSET_BY_KEY.set(key, provider.url);
}

const PROVIDER_ALIASES: Record<string, string> = {
  cq: 'cq9',
  cq9: 'cq9',
  evp: 'evolution',
  evolution: 'evolution',
  fachai: 'fachai',
  jl: 'jili',
  jili: 'jili',
  jkg: 'joker',
  jkgx2: 'joker',
  joker: 'joker',
  kingm: 'kingmaker',
  kingmaker: 'kingmaker',
  nlc: 'nolimitcity',
  nolimit: 'nolimitcity',
  nolimitcity: 'nolimitcity',
  pg: 'pgsoft',
  pgsoft: 'pgsoft',
  pp: 'pragmaticplay',
  ppcasino: 'pragmaticplay',
  pragmatic: 'pragmaticplay',
  pragmaticplay: 'pragmaticplay',
  ps: 'playstar',
  playstar: 'playstar',
  redtiger: 'redtiger',
  rsg: 'redtiger',
  ygr: 'ygr',
};

export function resolveHomeGameImage(game: Game): string {
  const media = Array.isArray(game.media) ? game.media : [];
  const sourceCandidates = [
    game.imageUrl,
    game.iconUrl,
    findMediaUrl(media, 'cachedUrl'),
    findMediaUrl(media, 'sourceUrl'),
  ];

  for (const source of sourceCandidates) {
    const mirrored = source ? resolveMirroredAsset(source, 'games') : '';
    if (mirrored) return mirrored;
  }

  const catalog = resolveCatalogGameAsset(game);
  if (catalog) return catalog;

  const cached = findMediaUrl(media, 'cachedUrl');
  if (cached) return normalizePublicAssetUrl(cached);

  const direct = game.imageUrl || game.iconUrl;
  if (direct) return normalizePublicAssetUrl(direct);

  const source = findMediaUrl(media, 'sourceUrl');
  return source ? normalizePublicAssetUrl(source) : '';
}

export function resolveHomeGameFallback(game: Game): string {
  const media = Array.isArray(game.media) ? game.media : [];
  const catalog = resolveCatalogGameAsset(game);
  if (catalog) return catalog;

  const external = [
    findMediaUrl(media, 'cachedUrl'),
    game.imageUrl,
    game.iconUrl,
    findMediaUrl(media, 'sourceUrl'),
  ].find((value) => value && !isMirroredLocalUrl(value));
  if (external) return normalizePublicAssetUrl(external);

  const seed = `${game.id || ''}:${game.provider?.code || ''}:${game.providerGameCode || ''}:${game.name || ''}`;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = ((hash << 5) - hash + seed.charCodeAt(index)) | 0;
  }
  return REFERENCE_GAMES[Math.abs(hash) % REFERENCE_GAMES.length]!.url;
}

export function resolveHomeProviderLogo(provider?: GameProviderSummary | null): string {
  if (!provider) return '';

  const candidates = [provider.code, provider.name]
    .map(normalizeAssetKey)
    .filter(Boolean);

  for (const candidate of candidates) {
    const canonical = PROVIDER_ALIASES[candidate] || candidate;
    const local = PROVIDER_ASSET_BY_KEY.get(canonical);
    if (local) return local;
  }

  const mirrored = provider.logoUrl ? resolveMirroredAsset(provider.logoUrl, 'providers') : '';
  if (mirrored) return mirrored;

  return provider.logoUrl ? normalizePublicAssetUrl(provider.logoUrl) : '';
}

export function normalizePublicAssetUrl(value: string): string {
  if (/^https?:\/\//i.test(value) || value.startsWith('/')) return value;
  return `/${value.replace(/^\.\//, '')}`;
}

function resolveCatalogGameAsset(game: Game): string {
  const candidates = [game.providerGameCode, game.name]
    .map(normalizeAssetKey)
    .filter(Boolean);

  for (const candidate of candidates) {
    const exact = GAME_ASSET_BY_KEY.get(candidate);
    if (exact) return exact;
  }

  for (const candidate of candidates) {
    if (candidate.length < 5) continue;
    const fuzzyMatches = [...GAME_ASSET_BY_KEY.entries()]
      .filter(([key]) => key.length >= 5 && (candidate.startsWith(key) || key.startsWith(candidate)))
      .sort(([left], [right]) => Math.abs(left.length - candidate.length) - Math.abs(right.length - candidate.length));
    if (fuzzyMatches[0]) return fuzzyMatches[0][1];
  }

  return '';
}

function resolveMirroredAsset(value: string, root: 'games' | 'providers'): string {
  const normalized = normalizePublicAssetUrl(value);
  let pathname = normalized;

  if (/^https?:\/\//i.test(normalized)) {
    try {
      pathname = new URL(normalized).pathname;
    } catch {
      return '';
    }
  }

  if (root === 'games') {
    const marker = '/games/';
    const index = pathname.toLowerCase().lastIndexOf(marker);
    if (index < 0) return '';

    const fileName = pathname.slice(index + marker.length).split('/').filter(Boolean).pop() ?? '';
    if (!fileName || fileName.includes('..')) return '';
    return `/assets/asset-pc/images/games/${fileName}`;
  }

  if (normalized.startsWith('/assets/asset-pc/images/')) return normalized;

  const marker = `/${root}/`;
  const index = pathname.toLowerCase().indexOf(marker);
  if (index < 0) return '';

  const relative = pathname.slice(index + 1).replace(/^\/+/, '');
  if (!relative || relative.includes('..')) return '';
  return `/assets/asset-pc/images/${relative}`;
}

function isMirroredLocalUrl(value: string): boolean {
  return normalizePublicAssetUrl(value).startsWith('/assets/asset-pc/images/');
}

function findMediaUrl(media: NonNullable<Game['media']>, field: 'cachedUrl' | 'sourceUrl'): string {
  const priority = ['COVER', 'THUMBNAIL', 'ICON', 'FALLBACK'];
  for (const type of priority) {
    const value = media.find((item) => item?.type?.toUpperCase() === type)?.[field];
    if (value) return value;
  }
  return media.find((item) => item?.[field])?.[field] || '';
}

function normalizeAssetKey(value?: string | null): string {
  return String(value ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}
