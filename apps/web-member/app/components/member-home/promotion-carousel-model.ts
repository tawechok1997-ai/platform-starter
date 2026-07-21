import type { CmsContent } from '../../site-settings';
import { API_URL, cmsAssetUrl } from '../../site-settings';
import type { PromotionCarouselItem } from './promotion-carousel';

export function normalizeCarouselIndex(index: number, count: number) {
  if (!Number.isFinite(index) || count <= 0) return 0;
  return ((Math.trunc(index) % count) + count) % count;
}

/**
 * Member promotions are sourced only from Admin/CMS settings.
 * The member app must not invent fallback promotions because that creates a
 * second source of truth and can show campaigns that admins have not enabled.
 */
export function buildHomePromotionItems(content: CmsContent): PromotionCarouselItem[] {
  const cmsItems = Array.isArray(content?.banners)
    ? content.banners.flatMap((banner, index) => {
        if (!banner?.enabled) return [];
        const assetUrl = cmsAssetUrl(content, banner.assetId);
        const imageUrl = resolveCmsUrl(assetUrl || banner.imageUrl || '');
        if (!imageUrl) return [];
        return [{
          id: String(banner.assetId || `cms-${index + 1}`),
          title: cleanText(banner.title, `โปรโมชั่น ${index + 1}`),
          imageUrl,
          href: safeInternalHref(banner.href) || '/promotions',
          alt: cleanText(banner.title, 'โปรโมชั่น'),
        }];
      })
    : [];

  return dedupePromotionItems(cmsItems);
}

export function dedupePromotionItems(items: PromotionCarouselItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.imageUrl.trim().toLowerCase();
    if (!item.id || !key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function resolveCmsUrl(value: string) {
  const candidate = String(value || '').trim();
  if (!candidate) return '';
  if (/^https:\/\//i.test(candidate)) return candidate;
  if (candidate.startsWith('/') && !candidate.startsWith('//') && !candidate.includes('\\')) return `${API_URL}${candidate}`;
  return '';
}

function safeInternalHref(value: unknown) {
  if (typeof value !== 'string') return '';
  const candidate = value.trim();
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) return '';
  return candidate;
}

function cleanText(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback;
  const text = value.replace(/[<>]/g, '').replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, 120) : fallback;
}
