import type { CmsContent } from '../../site-settings';
import { API_URL, cmsAssetUrl } from '../../site-settings';

export type NormalizedHomePromotion = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  href: string;
  sourceIndex: number;
};

/**
 * Canonical CMS promotion normalizer shared by the Home carousel and cards.
 * URL validation, text cleanup and duplicate handling must not drift between
 * two visual presentations of the same CMS records.
 */
export function normalizeHomePromotions(content: CmsContent): NormalizedHomePromotion[] {
  if (!Array.isArray(content?.banners)) return [];

  const items = content.banners.flatMap((banner, index) => {
    if (!banner?.enabled) return [];
    const imageUrl = resolveHomePromotionImageUrl(cmsAssetUrl(content, banner.assetId) || banner.imageUrl);
    if (!imageUrl) return [];

    return [{
      id: String(banner.assetId || `cms-promotion-${index + 1}`),
      title: cleanHomePromotionText(banner.title, `โปรโมชั่น ${index + 1}`),
      subtitle: cleanHomePromotionText(banner.subtitle, ''),
      imageUrl,
      href: safeHomePromotionHref(banner.href) || '/promotions',
      sourceIndex: index,
    }];
  });

  return dedupeHomePromotions(items);
}

export function dedupeHomePromotions<T extends { id: string; imageUrl: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.imageUrl.trim().toLowerCase();
    if (!item.id || !key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function cleanHomePromotionText(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const text = value.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, 120) : fallback;
}

export function resolveHomePromotionImageUrl(value: unknown): string {
  if (typeof value !== 'string') return '';
  const candidate = value.trim();
  if (!candidate) return '';
  if (/^https:\/\//i.test(candidate)) return candidate;
  if (candidate.startsWith('/') && !candidate.startsWith('//') && !candidate.includes('\\')) {
    return `${API_URL}${candidate}`;
  }
  return '';
}

export function safeHomePromotionHref(value: unknown): string {
  if (typeof value !== 'string') return '';
  const candidate = value.trim();
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) return '';
  return candidate;
}
