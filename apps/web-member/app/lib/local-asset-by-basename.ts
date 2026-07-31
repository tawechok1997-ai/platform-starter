import { LOCAL_ASSET_PATHS_BY_BASENAME } from '../generated/local-asset-basename-map';

export type LocalAssetPreference = 'pc' | 'mobile' | 'any';

export function resolveLocalAssetByBasename(
  sourceUrl?: string | null,
  preference: LocalAssetPreference = 'pc',
): string {
  const source = String(sourceUrl ?? '').trim();
  if (!source) return '';
  if (source.startsWith('/assets/')) return source;

  const sourcePath = extractPathname(source);
  if (!sourcePath) return '';

  const fileName = decodeFileName(sourcePath).toLowerCase();
  if (!fileName || fileName.includes('..')) return '';

  const candidates = LOCAL_ASSET_PATHS_BY_BASENAME[fileName];
  if (!candidates?.length) return '';

  const ranked = [...candidates].sort((left, right) => {
    const scoreDifference = scoreCandidate(left, sourcePath, preference) - scoreCandidate(right, sourcePath, preference);
    return scoreDifference || left.localeCompare(right);
  });

  return ranked[0] ?? '';
}

export function extractAssetBasename(sourceUrl?: string | null): string {
  const sourcePath = extractPathname(String(sourceUrl ?? '').trim());
  return sourcePath ? decodeFileName(sourcePath) : '';
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

function scoreCandidate(candidate: string, sourcePath: string, preference: LocalAssetPreference): number {
  const normalizedCandidate = candidate.toLowerCase();
  const normalizedSource = sourcePath.toLowerCase().replace(/^\/+/, '');
  let score = 100;

  if (normalizedCandidate.endsWith(`/${normalizedSource}`)) score -= 80;

  const sourceParent = normalizedSource.split('/').slice(0, -1).join('/');
  if (sourceParent && normalizedCandidate.includes(`/${sourceParent}/`)) score -= 40;

  const sourceProviderSet = normalizedSource.match(/providers\/set\/([^/]+)\//)?.[1];
  if (sourceProviderSet && normalizedCandidate.includes(`/providers/set/${sourceProviderSet}/`)) score -= 30;

  if (preference === 'pc') {
    if (normalizedCandidate.includes('/asset-pc/')) score -= 20;
    if (normalizedCandidate.includes('/asset-mobile/') || normalizedCandidate.includes('/asset-moblie/')) score += 10;
  } else if (preference === 'mobile') {
    if (normalizedCandidate.includes('/asset-mobile/') || normalizedCandidate.includes('/asset-moblie/')) score -= 20;
    if (normalizedCandidate.includes('/asset-pc/')) score += 5;
  }

  if (normalizedCandidate.includes('/providers/set/1_1_badge/')) score -= 4;
  return score;
}
