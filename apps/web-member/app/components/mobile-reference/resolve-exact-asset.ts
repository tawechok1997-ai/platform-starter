import { resolveLocalAssetOrSource } from '../../lib/local-asset-by-basename';

/**
 * Mobile and desktop share the checked-in asset-pc library by default.
 * A platform-specific URL supplied by the Admin runtime is resolved before
 * this fallback reaches the component, so choosing the PC preference here
 * does not erase explicit Mobile overrides.
 */
export function resolveExactAsset(source: string) {
  return resolveLocalAssetOrSource(source, 'pc');
}
