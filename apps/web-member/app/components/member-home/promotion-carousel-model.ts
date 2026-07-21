import type { CmsContent } from '../../site-settings';
import { API_URL, cmsAssetUrl } from '../../site-settings';
import type { PromotionCarouselItem } from './promotion-carousel';

const REFERENCE_BANNERS = [
  '0015_1782630857612-4098241f-e70d-4a32-b41b-623d74b974b6_b58847238e.jpg',
  '0014_1782990586367-b41e5c36-0d4d-4e7c-80ed-bb145a2e3a77_0728e0b61b.jpg',
  '0016_1780250534847-0b47bd80-15a3-4117-bdd3-f383308509bc_c438ce1b3e.jpg',
  '0018_1783665647358-f637b660-a3e9-46e3-989d-a62654566985_2945931932.jpg',
] as const;

export function normalizeCarouselIndex(index: number, count: number) {
  if (!Number.isFinite(index) || count <= 0) return 0;
  return ((Math.trunc(index) % count) + count) % count;
}

export function buildHomePromotionItems(content: CmsContent): PromotionCarouselItem[] {
  const fallbackItems = REFERENCE_BANNERS.map((fileName, index) => ({
    id: `reference-${index + 1}`,
    title: `โปรโมชั่น ${index + 1}`,
    imageUrl: `/images/member-lobby/noah345-reference/${fileName}`,
    href: '/promotions',
    alt: `โปรโมชั่น ${index + 1}`,
  }));

  const cmsItems = Array.isArray(content?.banners)
    ? content.banners.flatMap((banner, index) => {
        if (!banner?.enabled) return [];
        const assetUrl = cmsAssetUrl(content, banner.assetId);
        const imageUrl = resolveCmsUrl(assetUrl || banner.imageUrl || '');
        if (!imageUrl) return [];
        return [{
          id: String(banner.id || banner.assetId || `cms-${index + 1}`),
          title: banner.title || `โปรโมชั่น ${index + 1}`,
          imageUrl,
          href: safeInternalHref(banner.href) || '/promotions',
          alt: banner.title || 'โปรโมชั่น',
        }];
      })
    : [];

  return dedupePromotionItems([...fallbackItems, ...cmsItems]);
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
  if (/^https?:\/\//i.test(candidate)) return candidate;
  if (candidate.startsWith('/')) return `${API_URL}${candidate}`;
  return '';
}

function safeInternalHref(value: unknown) {
  if (typeof value !== 'string') return '';
  const candidate = value.trim();
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.includes('\\')) return '';
  return candidate;
}
