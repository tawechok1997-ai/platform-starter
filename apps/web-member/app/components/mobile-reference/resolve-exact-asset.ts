import 'server-only';

import { resolveLocalAssetByBasename } from '../../lib/local-asset-by-basename';

export function resolveExactAsset(source: string) {
  const normalized = source.trim();
  if (!normalized) return '';

  return resolveLocalAssetByBasename(normalized, 'mobile')
    || resolveLocalAssetByBasename(normalized, 'pc')
    || normalized;
}
