import type { BrandAssetKey, BrandAssetMap } from './brand-config';

export type BrandAssetGroup = 'brand' | 'auth' | 'navigation' | 'promotion' | 'placeholder' | 'social';

export type BrandAssetManifestEntry = {
  key: BrandAssetKey;
  group: BrandAssetGroup;
  required: boolean;
  recommendedAspectRatio?: string;
  acceptedFormats: readonly string[];
};

export const BRAND_ASSET_MANIFEST: readonly BrandAssetManifestEntry[] = [
  { key: 'logo', group: 'brand', required: true, recommendedAspectRatio: '1:1', acceptedFormats: ['svg', 'png', 'webp'] },
  { key: 'logoHorizontal', group: 'brand', required: false, recommendedAspectRatio: '4:1', acceptedFormats: ['svg', 'png', 'webp'] },
  { key: 'logoSquare', group: 'brand', required: false, recommendedAspectRatio: '1:1', acceptedFormats: ['svg', 'png', 'webp'] },
  { key: 'logoDark', group: 'brand', required: false, acceptedFormats: ['svg', 'png', 'webp'] },
  { key: 'logoLight', group: 'brand', required: false, acceptedFormats: ['svg', 'png', 'webp'] },
  { key: 'logoMobile', group: 'navigation', required: false, recommendedAspectRatio: '1:1', acceptedFormats: ['svg', 'png', 'webp'] },
  { key: 'logoLogin', group: 'auth', required: false, acceptedFormats: ['svg', 'png', 'webp'] },
  { key: 'logoRegister', group: 'auth', required: false, acceptedFormats: ['svg', 'png', 'webp'] },
  { key: 'favicon', group: 'brand', required: false, recommendedAspectRatio: '1:1', acceptedFormats: ['ico', 'png', 'svg'] },
  { key: 'appleTouchIcon', group: 'brand', required: false, recommendedAspectRatio: '1:1', acceptedFormats: ['png'] },
  { key: 'pwaIcon', group: 'brand', required: false, recommendedAspectRatio: '1:1', acceptedFormats: ['png', 'webp'] },
  { key: 'openGraphImage', group: 'social', required: false, recommendedAspectRatio: '1.91:1', acceptedFormats: ['jpg', 'jpeg', 'png', 'webp'] },
  { key: 'defaultAvatar', group: 'placeholder', required: false, recommendedAspectRatio: '1:1', acceptedFormats: ['png', 'webp'] },
  { key: 'gamePlaceholder', group: 'placeholder', required: false, recommendedAspectRatio: '1:1', acceptedFormats: ['png', 'webp'] },
  { key: 'promotionPlaceholder', group: 'promotion', required: false, recommendedAspectRatio: '16:9', acceptedFormats: ['jpg', 'jpeg', 'png', 'webp'] },
] as const;

export function resolveBrandAsset(assets: BrandAssetMap, key: BrandAssetKey): string {
  const direct = assets[key];
  if (direct) return direct;

  switch (key) {
    case 'logoLogin':
    case 'logoRegister':
      return assets.logoHorizontal || assets.logo;
    case 'logoMobile':
    case 'logoSquare':
      return assets.logoSquare || assets.logo;
    case 'logoDark':
    case 'logoLight':
      return assets.logoHorizontal || assets.logo;
    case 'defaultAvatar':
      return assets.logoSquare || assets.logo;
    case 'gamePlaceholder':
    case 'promotionPlaceholder':
      return '';
    default:
      return assets.logo;
  }
}

export function missingRequiredBrandAssets(assets: BrandAssetMap): BrandAssetKey[] {
  return BRAND_ASSET_MANIFEST.filter((entry) => entry.required && !resolveBrandAsset(assets, entry.key)).map((entry) => entry.key);
}
