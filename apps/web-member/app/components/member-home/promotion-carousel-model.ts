import type { CmsContent } from '../../site-settings';
import type { PromotionCarouselItem } from './promotion-carousel';
import { dedupeHomePromotions, normalizeHomePromotions } from './promotion-model';

export function normalizeCarouselIndex(index: number, count: number) {
  if (!Number.isFinite(index) || count <= 0) return 0;
  return ((Math.trunc(index) % count) + count) % count;
}

/** Member promotions are sourced only from Admin/CMS settings. */
export function buildHomePromotionItems(content: CmsContent): PromotionCarouselItem[] {
  return normalizeHomePromotions(content).map((item) => ({
    id: item.id,
    title: item.title,
    imageUrl: item.imageUrl,
    href: item.href,
    alt: item.title || 'โปรโมชั่น',
  }));
}

export function dedupePromotionItems(items: PromotionCarouselItem[]) {
  return dedupeHomePromotions(items);
}
