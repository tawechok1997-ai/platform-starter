import {
  LOCAL_ASSET_PATHS_BY_BASENAME,
  LOCAL_GAME_ASSET_PATHS_BY_IDENTITY,
  LOCAL_PROVIDER_ASSET_PATHS_BY_IDENTITY,
} from '../generated/local-asset-basename-map';

export type LocalAssetPreference = 'pc' | 'mobile' | 'any';
export type LocalProviderArtworkKind =
  | 'badge'
  | 'icon'
  | 'card'
  | 'logo'
  | 'background'
  | 'title'
  | 'avatar'
  | 'any';

const CANONICAL_PC_ASSET_ROOT = '/assets/asset-pc/images/';
const CANONICAL_MOBILE_ASSET_ROOT = '/assets/asset-mobile/';
const MEMBER_IMAGE_FALLBACK = '/images/fallbacks/noah345-placeholder.svg';

const GENERIC_IDENTITY_SEGMENTS = new Set([
  'asset',
  'assets',
  'asset-pc',
  'asset-mobile',
  'asset-moblie',
  'images',
  'image',
  'games',
  'game',
  'gamecard',
  'providers',
  'provider',
  'set',
  'cdn-zabbet-com',
  'www',
  'public',
  'catalog',
  'mobile',
  'pc',
  'desktop',
  'shared',
  'icon',
  'icons',
  'badge',
  'badges',
  'card',
  'cards',
  'logo',
  'logos',
  'background',
  'backgrounds',
  'bg',
  'title',
  'titles',
  'avatar',
  'avatars',
]);

const PROVIDER_ID_ALIASES: Readonly<Record<string, readonly string[]>> = {
  cq: ['cq9'],
  evp: ['evolution-play', 'evolutionplay'],
  fachai: ['fa-chai'],
  jkgx2: ['jdb'],
  jl: ['jili'],
  kingm: ['kingmaker', 'km'],
  misolt: ['miso'],
  nlc: ['nolimit-city', 'nolimitcity'],
  pgsoft: ['pg-soft'],
  pp: ['pragmatic-play', 'pragmaticplay'],
  spg: ['spadegaming'],
  spp: ['simple-play', 'simpleplay'],
  ygg: ['yggdrasil'],
};

export function resolveLocalAssetByBasename(
  sourceUrl?: string | null,
  preference: LocalAssetPreference = 'any',
): string {
  const source = String(sourceUrl ?? '').trim();
  if (!source) return '';

  const canonicalSource = canonicalizeLocalAssetPath(source);
  const sourcePath = extractPathname(canonicalSource);
  if (!sourcePath) return '';

  const fileName = decodeFileName(sourcePath).toLowerCase();
  if (!fileName || fileName.includes('..')) return '';

  const candidates = LOCAL_ASSET_PATHS_BY_BASENAME[fileName];
  if (!candidates?.length) return '';

  return rankCandidates(candidates, sourcePath, preference)[0] ?? '';
}

export function resolveLocalAssetOrSource(
  sourceUrl?: string | null,
  preference: LocalAssetPreference = 'any',
): string {
  const source = String(sourceUrl ?? '').trim();
  if (!source) return '';
  const canonicalSource = canonicalizeLocalAssetPath(source);
  const sourcePath = extractPathname(canonicalSource);
  const assetType = classifyStructuredAsset(sourcePath);

  if (assetType === 'provider') {
    return resolveProviderAssetOrSource(canonicalSource, preference);
  }
  if (assetType === 'game') {
    return resolveGameAssetOrSource(canonicalSource, preference);
  }

  return resolveLocalAssetByBasename(canonicalSource, preference)
    || unresolvedSourceOrFallback(canonicalSource);
}

export function resolveProviderAssetOrSource(
  sourceUrl?: string | null,
  preference: LocalAssetPreference = 'any',
  providerCode?: string | null,
  kind: LocalProviderArtworkKind = 'any',
): string {
  const source = canonicalizeLocalAssetPath(String(sourceUrl ?? '').trim());
  if (!source) return '';
  const sourcePath = extractPathname(source);
  if (!sourcePath) return unresolvedSourceOrFallback(source);

  const providerIdentities = providerIdentityCandidates(providerCode, sourcePath);
  const kinds = providerKindCandidates(kind, sourcePath);
  const platforms = identityPlatforms(preference);

  for (const platform of platforms) {
    for (const providerIdentity of providerIdentities) {
      for (const artworkKind of kinds) {
        const candidates = LOCAL_PROVIDER_ASSET_PATHS_BY_IDENTITY[
          `${platform}|${providerIdentity}|${artworkKind}`
        ];
        const selected = candidates?.length
          ? rankCandidates(candidates, sourcePath, preference)[0]
          : '';
        if (selected) return selected;
      }
    }
  }

  return resolveStrictPlatformBasename(source, preference)
    || unresolvedSourceOrFallback(source);
}

export function resolveGameAssetOrSource(
  sourceUrl?: string | null,
  preference: LocalAssetPreference = 'any',
  providerCode?: string | null,
  gameId?: string | null,
): string {
  const source = canonicalizeLocalAssetPath(String(sourceUrl ?? '').trim());
  if (!source) return '';
  const sourcePath = extractPathname(source);
  if (!sourcePath) return unresolvedSourceOrFallback(source);

  const gameIdentities = gameIdentityCandidates(gameId, sourcePath);
  const providerIdentities = gameProviderIdentityCandidates(providerCode, sourcePath);
  const platforms = identityPlatforms(preference);

  for (const platform of platforms) {
    for (const providerIdentity of providerIdentities) {
      for (const gameIdentity of gameIdentities) {
        const candidates = LOCAL_GAME_ASSET_PATHS_BY_IDENTITY[
          `${platform}|${providerIdentity}|${gameIdentity}`
        ];
        const selected = candidates?.length
          ? rankCandidates(candidates, sourcePath, preference)[0]
          : '';
        if (selected) return selected;
      }
    }
  }

  return resolveStrictPlatformBasename(source, preference)
    || unresolvedSourceOrFallback(source);
}

export function extractAssetBasename(sourceUrl?: string | null): string {
  const sourcePath = extractPathname(String(sourceUrl ?? '').trim());
  return sourcePath ? decodeFileName(sourcePath) : '';
}

export function canonicalizeLocalAssetPath(source: string): string {
  const value = source.trim();
  if (!value) return '';

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      url.pathname = canonicalizeLocalPathname(url.pathname);
      return url.toString();
    } catch {
      return value;
    }
  }

  const suffixIndex = value.search(/[?#]/);
  const pathname = suffixIndex >= 0 ? value.slice(0, suffixIndex) : value;
  const suffix = suffixIndex >= 0 ? value.slice(suffixIndex) : '';
  return `${canonicalizeLocalPathname(pathname)}${suffix}`;
}

function canonicalizeLocalPathname(pathname: string): string {
  return pathname
    .replace(/^\/assets\/asset-moblie\//i, CANONICAL_MOBILE_ASSET_ROOT)
    .replace(/^\/assets\/asset-pc\/(?!images(?:\/|$))/i, CANONICAL_PC_ASSET_ROOT);
}

function extractPathname(source: string): string {
  if (!source) return '';
  if (/^https?:\/\//i.test(source)) {
    try {
      return new URL(source).pathname;
    } catch {
      return '';
    }
  }
  return source.split(/[?#]/, 1)[0] ?? '';
}

function decodeFileName(pathname: string): string {
  const encoded = pathname.split('/').filter(Boolean).pop() ?? '';
  try {
    return decodeURIComponent(encoded);
  } catch {
    return encoded;
  }
}

function decodeSegment(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function normalizeIdentity(value?: string | null) {
  const source = decodeSegment(String(value ?? '').trim());
  const lastIdentityPart = source.split(/[:/\\]/).filter(Boolean).pop() ?? source;
  return lastIdentityPart
    .replace(/\.(?:avif|gif|ico|jpe?g|png|svg|webm|webp)$/i, '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function pathIdentitySegments(pathname: string) {
  return pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => normalizeIdentity(segment));
}

function usefulIdentity(value: string) {
  return Boolean(
    value
    && !GENERIC_IDENTITY_SEGMENTS.has(value)
    && !/^1-1-(?:v|h|l|bg|title|avatar|badge)$/.test(value)
  );
}

function expandProviderAliases(value?: string | null) {
  const normalized = normalizeIdentity(value);
  if (!normalized) return [];
  const result = new Set([normalized]);

  for (const [canonical, aliases] of Object.entries(PROVIDER_ID_ALIASES)) {
    if (canonical !== normalized && !aliases.includes(normalized)) continue;
    result.add(canonical);
    aliases.forEach((alias) => result.add(alias));
  }

  return Array.from(result);
}

function providerIdentityCandidates(providerCode: string | null | undefined, sourcePath: string) {
  const candidates = new Set<string>();
  expandProviderAliases(providerCode).forEach((identity) => candidates.add(identity));

  const segments = pathIdentitySegments(sourcePath);
  const providerIndex = segments.findIndex((segment) => segment === 'providers');
  if (providerIndex >= 0) {
    for (const segment of segments.slice(providerIndex + 1, -1)) {
      if (!usefulIdentity(segment)) continue;
      expandProviderAliases(segment).forEach((identity) => candidates.add(identity));
    }
  }

  expandProviderAliases(decodeFileName(sourcePath)).forEach((identity) => candidates.add(identity));
  return Array.from(candidates);
}

function gameIdentityCandidates(gameId: string | null | undefined, sourcePath: string) {
  const candidates = new Set<string>();
  const explicit = normalizeIdentity(gameId);
  if (explicit) candidates.add(explicit);
  const basename = normalizeIdentity(decodeFileName(sourcePath));
  if (basename) candidates.add(basename);
  return Array.from(candidates);
}

function gameProviderIdentityCandidates(providerCode: string | null | undefined, sourcePath: string) {
  const candidates = new Set<string>();
  expandProviderAliases(providerCode).forEach((identity) => candidates.add(identity));

  const segments = pathIdentitySegments(sourcePath);
  const markerIndex = gameMarkerIndex(segments);
  if (markerIndex >= 0) {
    for (const segment of segments.slice(markerIndex + 1, -1)) {
      if (!usefulIdentity(segment)) continue;
      expandProviderAliases(segment).forEach((identity) => candidates.add(identity));
    }
  }

  candidates.add('*');
  return Array.from(candidates);
}

function gameMarkerIndex(segments: string[]) {
  for (let index = segments.length - 2; index >= 0; index -= 1) {
    if (segments[index] === 'games' || segments[index] === 'gamecard') return index;
  }
  for (let index = segments.length - 3; index >= 0; index -= 1) {
    if (segments[index] === 'game') return index;
  }
  return -1;
}

function classifyStructuredAsset(sourcePath: string): 'provider' | 'game' | null {
  const segments = pathIdentitySegments(sourcePath);
  if (segments.includes('providers')) return 'provider';
  return gameMarkerIndex(segments) >= 0 ? 'game' : null;
}

function inferProviderArtworkKind(sourcePath: string): LocalProviderArtworkKind {
  const normalized = `/${sourcePath.toLowerCase()}/`;
  if (/\/(?:1_1_badge|badge|badges)\//.test(normalized)) return 'badge';
  if (/\/(?:icon|icons)\//.test(normalized)) return 'icon';
  if (/\/(?:1_1_avatar|avatar|avatars)\//.test(normalized)) return 'avatar';
  if (/\/(?:1_1_bg|bg|background|backgrounds)\//.test(normalized)) return 'background';
  if (/\/(?:1_1_title|title|titles)\//.test(normalized)) return 'title';
  if (/\/(?:1_1_v|1_1_h|1_1_l|card|cards)\//.test(normalized)) return 'card';
  return 'logo';
}

function providerKindCandidates(kind: LocalProviderArtworkKind, sourcePath: string) {
  const requested = kind === 'any' ? inferProviderArtworkKind(sourcePath) : kind;
  const candidates = new Set<LocalProviderArtworkKind>([requested]);

  if (requested === 'badge') {
    candidates.add('icon');
    candidates.add('logo');
  } else if (requested === 'icon') {
    candidates.add('badge');
    candidates.add('logo');
  } else if (requested === 'logo') {
    candidates.add('badge');
    candidates.add('icon');
    candidates.add('card');
  } else if (requested === 'card') {
    candidates.add('logo');
  }

  candidates.add('any');
  return Array.from(candidates);
}

function identityPlatforms(preference: LocalAssetPreference) {
  if (preference === 'any') return ['pc', 'mobile', 'other'] as const;
  return [preference, 'other'] as const;
}

function resolveStrictPlatformBasename(source: string, preference: LocalAssetPreference) {
  const sourcePath = extractPathname(source);
  const fileName = decodeFileName(sourcePath).toLowerCase();
  const candidates = LOCAL_ASSET_PATHS_BY_BASENAME[fileName];
  if (!candidates?.length) return '';

  const strictCandidates = preference === 'any'
    ? candidates
    : candidates.filter((candidate) => candidatePlatform(candidate) === preference);
  return rankCandidates(strictCandidates, sourcePath, preference)[0] ?? '';
}

function unresolvedSourceOrFallback(source: string) {
  const value = source.trim();
  const sourcePath = extractPathname(value);

  // A local asset path that is absent from the build-generated index cannot
  // become valid at runtime. Return the stable placeholder before the browser
  // starts a guaranteed 404 request.
  if (/^\/assets\//i.test(sourcePath)) return MEMBER_IMAGE_FALLBACK;

  if (/^(?:https?:\/\/|\/|\.\/|\.\.\/|data:image\/|blob:)/i.test(value)) return value;
  if (/^[^\s/]+\.(?:avif|gif|ico|jpe?g|png|svg|webm|webp)(?:[?#].*)?$/i.test(value)) return value;
  return MEMBER_IMAGE_FALLBACK;
}

function rankCandidates(
  candidates: readonly string[],
  sourcePath: string,
  preference: LocalAssetPreference,
) {
  return [...new Set(candidates)].sort((left, right) => {
    const scoreDifference = scoreCandidate(left, sourcePath, preference)
      - scoreCandidate(right, sourcePath, preference);
    return scoreDifference || left.localeCompare(right);
  });
}

function candidatePlatform(candidate: string): 'pc' | 'mobile' | 'other' {
  const normalized = candidate.toLowerCase();
  if (normalized.includes('/asset-pc/images/')) return 'pc';
  if (normalized.includes('/asset-mobile/') || normalized.includes('/asset-moblie/')) return 'mobile';
  return 'other';
}

function scoreCandidate(
  candidate: string,
  sourcePath: string,
  preference: LocalAssetPreference,
): number {
  const normalizedCandidate = candidate.toLowerCase();
  const normalizedSource = sourcePath.toLowerCase().replace(/^\/+/, '');
  const normalizedPublicSource = `/${normalizedSource}`;
  let score = 100;

  if (normalizedCandidate === normalizedPublicSource) score -= 120;
  else if (normalizedCandidate.endsWith(`/${normalizedSource}`)) score -= 80;

  const sourceParent = normalizedSource.split('/').slice(0, -1).join('/');
  if (sourceParent && normalizedCandidate.includes(`/${sourceParent}/`)) score -= 45;

  const sourceSegments = normalizedSource.split('/').filter(Boolean);
  for (let length = Math.min(4, sourceSegments.length - 1); length >= 1; length -= 1) {
    const suffix = sourceSegments.slice(-(length + 1), -1).join('/');
    if (suffix && normalizedCandidate.includes(`/${suffix}/`)) {
      score -= length * 6;
      break;
    }
  }

  const sourceProviderSet = normalizedSource.match(/providers\/set\/([^/]+)\//)?.[1];
  if (sourceProviderSet && normalizedCandidate.includes(`/providers/set/${sourceProviderSet}/`)) score -= 30;

  const platform = candidatePlatform(normalizedCandidate);
  if (preference === 'pc') {
    if (platform === 'pc') score -= 70;
    if (platform === 'mobile') score += 90;
  } else if (preference === 'mobile') {
    if (platform === 'mobile') score -= 70;
    if (platform === 'pc') score += 90;
  } else if (platform === 'pc') {
    score -= 24;
  }

  const isLegacyPcAsset = normalizedCandidate.includes('/asset-pc/')
    && !normalizedCandidate.includes('/asset-pc/images/');
  if (isLegacyPcAsset) score += 80;
  if (normalizedCandidate.includes('/reference-brand/')) score -= 12;
  if (normalizedCandidate.includes('/providers/set/1_1_badge/')) score -= 4;

  return score;
}
