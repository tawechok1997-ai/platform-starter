import type { CmsContent } from '../../site-settings';
import { API_URL, cmsAssetUrl } from '../../site-settings';

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
  const cmsCards = Array.isArray(content?.banners)
    ? content.banners.flatMap((banner, index) => {
        if (!banner?.enabled) return [];
        const imageUrl = resolveImageUrl(cmsAssetUrl(content, banner.assetId) || banner.imageUrl);
        if (!imageUrl) return [];
        return [{
          id: String(banner.assetId || `cms-promotion-${index + 1}`),
          title: cleanText(banner.title, `โปรโมชั่น ${index + 1}`),
          subtitle: cleanText(banner.subtitle, ''),
          imageUrl,
          href: safeInternalHref(banner.href) || '/promotions',
          badge: index === 0 ? 'HOT' : '',
        }];
      })
    : [];

  return dedupeCards(cmsCards).slice(0, 6);
}

export function dedupeCards(cards: HomePromotionCard[]) {
  const seen = new Set<string>();
  return cards.filter((card) => {
    const key = card.imageUrl.trim().toLowerCase();
    if (!card.id || !key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function cleanText(value: unknown, fallback: string) {
  if (typeof value !== 'string') return fallback;
  const text = value.replace(/[<>]/g, '').trim().replace(/\s+/g, ' ');
  return text ? text.slice(0, 120) : fallback;
}

function resolveImageUrl(value: unknown) {
  if (typeof value !== 'string') return '';
  const candidate = value.trim();
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
