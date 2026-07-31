import 'server-only';

import { readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const PUBLIC_ROOT = join(process.cwd(), 'public');
const ASSET_ROOTS = [
  join(PUBLIC_ROOT, 'assets', 'asset-mobile', 'images'),
  join(PUBLIC_ROOT, 'assets', 'asset-moblie', 'images'),
  join(PUBLIC_ROOT, 'assets', 'asset-pc', 'images'),
] as const;

type AssetEntry = {
  fileName: string;
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
    .sort((left, right) => suffixScore(right.segments, sourceSegments) - suffixScore(left.segments, sourceSegments)
      || left.publicPath.localeCompare(right.publicPath))[0]?.publicPath ?? normalized;
}

function getAssetIndex() {
  if (assetIndex) return assetIndex;

  const index = new Map<string, AssetEntry[]>();
  for (const root of ASSET_ROOTS) {
    walk(root, (absolutePath) => {
      const fileName = absolutePath.split(sep).pop() ?? '';
      if (!fileName) return;

      const publicPath = `/${relative(PUBLIC_ROOT, absolutePath).split(sep).join('/')}`;
      const segments = publicPath.split('/').filter(Boolean).map((segment) => decodeURIComponent(segment).toLowerCase());
      const key = fileName.toLowerCase();
      const current = index.get(key) ?? [];
      current.push({ fileName, publicPath, segments });
      index.set(key, current);
    });
  }

  assetIndex = index;
  return index;
}

function walk(directory: string, onFile: (path: string) => void) {
  try {
    for (const name of readdirSync(directory)) {
      const absolutePath = join(directory, name);
      try {
        const stats = statSync(absolutePath);
        if (stats.isDirectory()) walk(absolutePath, onFile);
        else if (stats.isFile()) onFile(absolutePath);
      } catch {
        // Ignore files that disappear while the deployment image is being assembled.
      }
    }
  } catch {
    // A root may not exist in every deployment. The remaining roots are still valid.
  }
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
