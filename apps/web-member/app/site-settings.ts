import { createApiClient } from '@platform/api-client';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const publicSettingsClient = createApiClient({ baseUrl: API_URL, timeoutMs: 10000, retry: 1 });

export type CmsAsset = { id: string; name: string; url: string; type: 'image' | 'video' | 'link'; tag?: string; enabled: boolean };
export type CmsContent = {
  assets: CmsAsset[];
  banners: Array<{ title: string; subtitle: string; imageUrl: string; href: string; enabled: boolean; assetId?: string }>;
  popup: { title: string; message: string; ctaLabel: string; href: string; enabled: boolean; version?: string; assetId?: string; imageUrl?: string };
  announcements: Array<{ title: string; message: string; enabled: boolean }>;
  faqs: Array<{ question: string; answer: string; enabled: boolean }>;
};

export type IconKey = 'home' | 'deposit' | 'withdraw' | 'games' | 'bonus' | 'affiliate' | 'support' | 'history' | 'bank' | 'profile' | 'notification' | 'promotion' | 'vip' | 'wallet';
export type SiteIconSettings = Record<IconKey, string>;
export type MemberFeatureFlags = {
  registration: boolean; login: boolean; deposit: boolean; withdraw: boolean; promotion: boolean; bonus: boolean; affiliate: boolean; support: boolean; kyc: boolean; games: boolean; profile: boolean; notifications: boolean;
};

export type PromotionCampaign = {
  id: string; title: string; description: string; enabled: boolean; bonusType: 'fixed' | 'percent'; bonusValue: number; minDeposit: number; maxBonus: number; turnoverMultiplier: number; claimMode: 'manual_review' | 'auto_pending'; imageUrl?: string; iconUrl?: string; badgeText?: string; accentColor?: string; priority?: number; startsAt?: string; endsAt?: string;
};

export type PublicSiteSettings = {
  website?: Record<string, unknown>; branding?: Record<string, unknown>; theme?: Record<string, unknown>; icons?: Record<string, unknown>; seo?: Record<string, unknown>; contact?: Record<string, unknown>; maintenance?: Record<string, unknown>; features?: Record<string, unknown>; legal?: Record<string, unknown>;
};

export const defaultCmsContent: CmsContent = {
  assets: [],
  banners: [
    { title: 'FIFA World Cup 2026', subtitle: 'โปรโมชั่นแนะนำ', imageUrl: '/images/member-lobby/promotions/world-cup.jpeg', href: '/promotions', enabled: true },
    { title: 'Daily Login', subtitle: 'กิจกรรมสมาชิก', imageUrl: '/images/member-lobby/promotions/daily-login.jpeg', href: '/promotions', enabled: true },
    { title: 'กิจกรรมทายผล', subtitle: 'กิจกรรมโปรโมชั่น', imageUrl: '/images/member-lobby/promotions/lottery-event.jpeg', href: '/promotions', enabled: true },
    { title: 'โปรโมชั่นสล็อต', subtitle: 'โปรโมชั่นแนะนำ', imageUrl: '/images/member-lobby/promotions/slot-promotion.jpeg', href: '/promotions', enabled: true },
  ],
  popup: { title: 'ประกาศ', message: 'ยินดีต้อนรับ', ctaLabel: 'ดูเกม', href: '/games', enabled: false, version: 'v1' },
  announcements: [{ title: 'ระบบพร้อมใช้งาน', message: 'ฝาก ถอน และเกมเปิดให้บริการตามปกติ', enabled: true }],
  faqs: [{ question: 'ฝากใช้เวลานานไหม', answer: 'หลังแนบสลิป แอดมินจะตรวจและอนุมัติให้เร็วที่สุด', enabled: true }],
};

export const defaultIconSettings: SiteIconSettings = { home: '⌂', deposit: '＋', withdraw: '↗', games: '🎮', bonus: '★', affiliate: '↔', support: '✉', history: '≡', bank: '◈', profile: '👤', notification: '🔔', promotion: '🎁', vip: '♛', wallet: '฿' };
export const defaultFeatureFlags: MemberFeatureFlags = { registration: true, login: true, deposit: true, withdraw: true, promotion: true, bonus: true, affiliate: true, support: true, kyc: true, games: true, profile: true, notifications: true };
export const defaultPromotionCampaigns: PromotionCampaign[] = [{ id: 'welcome-bonus', title: 'โบนัสต้อนรับ', description: 'รับโบนัสสำหรับรายการฝากแรกตามเงื่อนไขที่กำหนด', enabled: false, bonusType: 'percent', bonusValue: 10, minDeposit: 100, maxBonus: 500, turnoverMultiplier: 3, claimMode: 'manual_review', badgeText: 'WELCOME', accentColor: '#f5c542', priority: 10 }];

export const defaultSettings: PublicSiteSettings = {
  website: { site_name: 'Platform Starter', site_description: 'Member platform starter', registration_enabled: true, login_enabled: true, maintenance_mode: false },
  branding: { primary_color: '#f5c542', background_color: '#080808', card_color: '#181818', text_color: '#ffffff', success_color: '#22c55e', danger_color: '#ef4444' },
  theme: { show_balance_header: true, show_deposit_withdraw_buttons: true, show_promotion_banner: true, show_game_categories: true, show_popular_providers: true, show_recommended_games: true },
  icons: defaultIconSettings,
  maintenance: { enabled: false, member_enabled: false, message: 'ระบบกำลังปรับปรุง' },
  features: { registration_enabled: true, login_enabled: true, deposit_enabled: true, withdraw_enabled: true, promotion_enabled: true, bonus_enabled: true, affiliate_enabled: true, support_enabled: true, kyc_enabled: true, game_lobby_enabled: true, profile_enabled: true, notification_enabled: true, cms_content: defaultCmsContent, promotion_campaigns: defaultPromotionCampaigns },
};

export async function loadPublicSiteSettings(): Promise<PublicSiteSettings> {
  try {
    const data = await publicSettingsClient.request<PublicSiteSettings>('/public/site-settings', { auth: false, cache: 'no-store' });
    return { ...defaultSettings, ...data, icons: { ...defaultIconSettings, ...(data.icons ?? {}) }, features: { ...defaultSettings.features, ...(data.features ?? {}) } };
  } catch { return defaultSettings; }
}

export function textSetting(settings: PublicSiteSettings, group: keyof PublicSiteSettings, key: string, fallback: string) { const value = settings[group]?.[key]; return typeof value === 'string' ? value : fallback; }
export function boolSetting(settings: PublicSiteSettings, group: keyof PublicSiteSettings, key: string, fallback: boolean) { const value = settings[group]?.[key]; return typeof value === 'boolean' ? value : fallback; }
export function memberFeatureFlags(settings: PublicSiteSettings): MemberFeatureFlags {
  const feature = (key: string, fallback: boolean) => boolSetting(settings, 'features', key, fallback);
  return { registration: feature('registration_enabled', true), login: feature('login_enabled', true), deposit: feature('deposit_enabled', true), withdraw: feature('withdraw_enabled', true), promotion: feature('promotion_enabled', true), bonus: feature('bonus_enabled', true), affiliate: feature('affiliate_enabled', true), support: feature('support_enabled', true), kyc: feature('kyc_enabled', true), games: feature('game_lobby_enabled', feature('provider_enabled', true)), profile: feature('profile_enabled', true), notifications: feature('notification_enabled', true) };
}
export function cmsContentSetting(settings: PublicSiteSettings): CmsContent {
  const value = settings.features?.cms_content;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultCmsContent;
  const data = value as Partial<CmsContent>;
  return {
    assets: Array.isArray((data as any).assets) ? (data as any).assets.map((item: any, index: number) => ({ id: String(item.id ?? `asset_${index}`), name: String(item.name ?? `Asset ${index + 1}`), url: String(item.url ?? ''), type: item.type === 'video' || item.type === 'link' ? item.type : 'image', tag: String(item.tag ?? ''), enabled: item.enabled !== false })) : defaultCmsContent.assets,
    banners: Array.isArray(data.banners) ? data.banners.map((item: any) => ({ title: String(item.title ?? ''), subtitle: String(item.subtitle ?? ''), imageUrl: String(item.imageUrl ?? ''), href: String(item.href ?? '/games'), enabled: item.enabled !== false, assetId: String(item.assetId ?? '') })) : defaultCmsContent.banners,
    popup: { ...defaultCmsContent.popup, ...(data.popup && typeof data.popup === 'object' ? data.popup : {}) } as CmsContent['popup'],
    announcements: Array.isArray(data.announcements) ? data.announcements.map((item: any) => ({ title: String(item.title ?? ''), message: String(item.message ?? ''), enabled: item.enabled !== false })) : defaultCmsContent.announcements,
    faqs: Array.isArray(data.faqs) ? data.faqs.map((item: any) => ({ question: String(item.question ?? ''), answer: String(item.answer ?? ''), enabled: item.enabled !== false })) : defaultCmsContent.faqs,
  };
}
export function cmsAssetUrl(content: CmsContent, assetId?: string) { if (!assetId) return ''; return content.assets.find((asset) => asset.id === assetId && asset.enabled)?.url ?? ''; }
export function iconSettings(settings: PublicSiteSettings): SiteIconSettings { return { ...defaultIconSettings, ...(settings.icons ?? {}) } as SiteIconSettings; }
export function iconSetting(settings: PublicSiteSettings, key: IconKey) { const value = settings.icons?.[key]; return typeof value === 'string' && value.trim() ? value.trim() : defaultIconSettings[key]; }
export function isIconUrl(value: string) { try { const url = new URL(value); return url.protocol === 'http:' || url.protocol === 'https:'; } catch { return false; } }
export function promotionCampaignsSetting(settings: PublicSiteSettings): PromotionCampaign[] {
  const value = settings.features?.promotion_campaigns;
  if (!Array.isArray(value)) return defaultPromotionCampaigns;
  return value.map((item: any, index) => ({ id: String(item.id ?? `promotion-${index + 1}`), title: String(item.title ?? 'Promotion'), description: String(item.description ?? ''), enabled: item.enabled !== false, bonusType: item.bonusType === 'fixed' ? 'fixed' : 'percent', bonusValue: Number(item.bonusValue ?? 0), minDeposit: Number(item.minDeposit ?? 0), maxBonus: Number(item.maxBonus ?? 0), turnoverMultiplier: Number(item.turnoverMultiplier ?? 0), claimMode: item.claimMode === 'auto_pending' ? 'auto_pending' : 'manual_review', imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : '', iconUrl: typeof item.iconUrl === 'string' ? item.iconUrl : '', badgeText: typeof item.badgeText === 'string' ? item.badgeText : '', accentColor: typeof item.accentColor === 'string' ? item.accentColor : '#f5c542', priority: Number(item.priority ?? 0), startsAt: typeof item.startsAt === 'string' ? item.startsAt : undefined, endsAt: typeof item.endsAt === 'string' ? item.endsAt : undefined }));
}
