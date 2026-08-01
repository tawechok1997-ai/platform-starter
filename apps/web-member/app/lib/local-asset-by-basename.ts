import { LOCAL_ASSET_PATHS_BY_BASENAME } from '../generated/local-asset-basename-map';

export type LocalAssetPreference = 'pc' | 'mobile' | 'any';

export function resolveLocalAssetByBasename(
  sourceUrl?: string | null,
  preference: LocalAssetPreference = 'any',
): string {
  const source = String(sourceUrl ?? '').trim();
  if (!source) return '';

  const canonicalSource = canonicalizeLegacyMobileAssetPath(source);
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
  return resolveLocalAssetByBasename(source, preference) || source;
}

export function extractAssetBasename(sourceUrl?: string | null): string {
  const sourcePath = extractPathname(String(sourceUrl ?? '').trim());
  return sourcePath ? decodeFileName(sourcePath) : '';
}

function canonicalizeLegacyMobileAssetPath(source: string): string {
  return source
    .replace(/^\/assets\/asset-mobile\//i, '/assets/asset-pc/')
    .replace(/^\/assets\/asset-moblie\//i, '/assets/asset-pc/');
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

  const isPcAsset = normalizedCandidate.includes('/asset-pc/');
  const isMobileAsset = normalizedCandidate.includes('/asset-mobile/')
    || normalizedCandidate.includes('/asset-moblie/');
  if (preference === 'pc') {
    if (isPcAsset) score -= 55;
    if (isMobileAsset) score += 55;
  } else if (preference === 'mobile') {
    if (isMobileAsset) score -= 55;
    if (isPcAsset) score += 55;
  } else if (isPcAsset) {
    score -= 20;
  }

  if (normalizedCandidate.includes('/reference-brand/')) score -= 12;
  if (normalizedCandidate.includes('/providers/set/1_1_badge/')) score -= 4;

  return score;
}
