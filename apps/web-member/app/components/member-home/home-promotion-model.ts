import type { CmsContent } from '../../site-settings';
import { dedupeHomePromotions, normalizeHomePromotions } from './promotion-model';

export type HomePromotionCard = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  href: string;
  badge: string;
};

/** Promotion cards are controlled exclusively from Admin/CMS settings. */
export function buildHomePromotionCards(content: CmsContent): HomePromotionCard[] {
  return normalizeHomePromotions(content)
    .slice(0, 6)
    .map((item, index) => ({
      id: item.id,
      title: item.title,
      subtitle: item.subtitle,
      imageUrl: item.imageUrl,
      href: item.href,
      badge: index === 0 ? 'HOT' : '',
    }));
}

export function dedupeCards(cards: HomePromotionCard[]) {
  return dedupeHomePromotions(cards);
}
