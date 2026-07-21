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

const FALLBACK_PROMOTIONS: HomePromotionCard[] = [
  {
    id: 'reference-promotion-1',
    title: 'โปรโมชั่นสมาชิก',
    subtitle: 'สิทธิพิเศษและกิจกรรมแนะนำ',
    imageUrl: '/images/member-lobby/noah345-reference/0015_1782630857612-4098241f-e70d-4a32-b41b-623d74b974b6_b58847238e.jpg',
    href: '/promotions',
    badge: 'HOT',
  },
  {
    id: 'reference-promotion-2',
    title: 'กิจกรรมประจำวัน',
    subtitle: 'ติดตามกิจกรรมใหม่สำหรับสมาชิก',
    imageUrl: '/images/member-lobby/noah345-reference/0014_1782990586367-b41e5c36-0d4d-4e7c-80ed-bb145a2e3a77_0728e0b61b.jpg',
    href: '/promotions',
    badge: 'NEW',
  },
  {
    id: 'reference-promotion-3',
    title: 'รางวัลและโบนัส',
    subtitle: 'ตรวจสอบเงื่อนไขก่อนเข้าร่วม',
    imageUrl: '/images/member-lobby/noah345-reference/0016_1780250534847-0b47bd80-15a3-4117-bdd3-f383308509bc_c438ce1b3e.jpg',
    href: '/promotions',
    badge: '',
  },
];

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

  return dedupeCards([...cmsCards, ...FALLBACK_PROMOTIONS]).slice(0, 6);
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
  const text = value.trim().replace(/\s+/g, ' ');
  return text ? text.slice(0, 120) : fallback;
}

function resolveImageUrl(value: unknown) {
  if (typeof value !== 'string') return '';
  const candidate = value.trim();
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
