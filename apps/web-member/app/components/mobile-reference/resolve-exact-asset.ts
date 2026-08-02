import 'server-only';

import { LOCAL_ASSET_PATHS_BY_BASENAME } from '../../generated/local-asset-basename-map';

type AssetEntry = {
  publicPath: string;
  segments: string[];
};

let assetIndex: Map<string, AssetEntry[]> | null = null;

export function resolveExactAsset(source: string) {
  const normalized = source.trim();
  if (!normalized) return '';

  const pathname = sourcePathname(normalized);
  const fileName = decodeURIComponent(pathname.split('/').filter(Boolean).pop() ?? '');
  if (!fileName || fileName.toLowerCase() === 'null') return normalized;

  const matches = getAssetIndex().get(fileName.toLowerCase()) ?? [];
  if (matches.length === 0) return normalized;

  const sourceSegments = pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => decodeURIComponent(segment).toLowerCase());

  return [...matches]
    .sort(
      (left, right) =>
        suffixScore(right.segments, sourceSegments) - suffixScore(left.segments, sourceSegments)
        || left.publicPath.localeCompare(right.publicPath),
    )[0]?.publicPath ?? normalized;
}

function getAssetIndex() {
  if (assetIndex) return assetIndex;

  const index = new Map<string, AssetEntry[]>();
  for (const [fileName, publicPaths] of Object.entries(LOCAL_ASSET_PATHS_BY_BASENAME)) {
    index.set(
      fileName.toLowerCase(),
      publicPaths.map((publicPath) => ({
        publicPath,
        segments: publicPath
          .split('/')
          .filter(Boolean)
          .map((segment) => decodeURIComponent(segment).toLowerCase()),
      })),
    );
  }

  assetIndex = index;
  return index;
}

function suffixScore(candidate: string[], source: string[]) {
  let score = 0;
  let candidateIndex = candidate.length - 1;
  let sourceIndex = source.length - 1;

  while (candidateIndex >= 0 && sourceIndex >= 0) {
    if (candidate[candidateIndex] !== source[sourceIndex]) break;
    score += 1;
    candidateIndex -= 1;
    sourceIndex -= 1;
  }

  return score;
}

function sourcePathname(value: string) {
  if (!/^https?:\/\//i.test(value)) return value.split(/[?#]/, 1)[0] ?? '';
  try {
    return new URL(value).pathname;
  } catch {
    return '';
  }
}
