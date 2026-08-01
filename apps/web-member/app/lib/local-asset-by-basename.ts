import { LOCAL_ASSET_PATHS_BY_BASENAME } from '../generated/local-asset-basename-map';

export type LocalAssetPreference = 'pc' | 'mobile' | 'any';

const CANONICAL_PC_ASSET_ROOT = '/assets/asset-pc/images/';

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

  const ranked = [...candidates].sort((left, right) => {
    const scoreDifference = scoreCandidate(left, sourcePath, preference)
      - scoreCandidate(right, sourcePath, preference);
    return scoreDifference || left.localeCompare(right);
  });

  return ranked[0] ?? '';
}

export function resolveLocalAssetOrSource(
  sourceUrl?: string | null,
  preference: LocalAssetPreference = 'any',
): string {
  const source = String(sourceUrl ?? '').trim();
  if (!source) return '';
  const canonicalSource = canonicalizeLocalAssetPath(source);
  return resolveLocalAssetByBasename(canonicalSource, preference) || canonicalSource;
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
    .replace(/^\/assets\/asset-mobile\//i, CANONICAL_PC_ASSET_ROOT)
    .replace(/^\/assets\/asset-moblie\//i, CANONICAL_PC_ASSET_ROOT)
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

  if (normalizedCandidate.includes('/asset-pc/images/')) {
    score -= preference === 'any' ? 24 : 40;
  } else if (normalizedCandidate.includes('/asset-pc/')) {
    score += 80;
  }
  if (normalizedCandidate.includes('/reference-brand/')) score -= 12;
  if (normalizedCandidate.includes('/providers/set/1_1_badge/')) score -= 4;

  return score;
}
