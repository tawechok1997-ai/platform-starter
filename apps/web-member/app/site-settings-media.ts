import { createApiClient } from '@platform/api-client';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
const publicSettingsClient = createApiClient({ baseUrl: API_URL, timeoutMs: 10000, retry: 1 });

export type CmsAsset = {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'link';
  tag?: string;
  enabled: boolean;
  source?: 'upload' | 'url' | 'bundled';
  storageKey?: string;
};

export type CmsResponsiveMedia = {
  imageUrl?: string;
  desktopImageUrl?: string;
  mobileImageUrl?: string;
  assetId?: string;
  desktopAssetId?: string;
  mobileAssetId?: string;
};

export type CmsBanner = CmsResponsiveMedia & {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  enabled: boolean;
  lifecycle?: 'draft' | 'published' | 'archived';
};

export type CmsAnnouncement = CmsResponsiveMedia & {
  id: string;
  kind: 'news' | 'event' | 'promotion' | 'system';
  title: string;
  message: string;
  href?: string;
  enabled: boolean;
  lifecycle?: 'draft' | 'published' | 'archived';
};

export type CmsContent = {
  assets: CmsAsset[];
  banners: CmsBanner[];
  popup: CmsResponsiveMedia & {
    title: string;
    message: string;
    ctaLabel: string;
    href: string;
    enabled: boolean;
    lifecycle?: 'draft' | 'published' | 'archived';
    version?: string;
  };
  announcements: CmsAnnouncement[];
  faqs: Array<{ id?: string; question: string; answer: string; enabled: boolean; lifecycle?: 'draft' | 'published' | 'archived' }>;
};

export type IconKey =
  | 'home'
  | 'deposit'
  | 'withdraw'
  | 'games'
  | 'bonus'
  | 'affiliate'
  | 'support'
  | 'history'
  | 'bank'
  | 'profile'
  | 'notification'
  | 'promotion'
  | 'vip'
  | 'wallet';
export type SiteIconSettings = Record<IconKey, string>;

export type MemberFeatureFlags = {
  registration: boolean;
  login: boolean;
  deposit: boolean;
  withdraw: boolean;
  promotion: boolean;
  bonus: boolean;
  affiliate: boolean;
  support: boolean;
  kyc: boolean;
  games: boolean;
  profile: boolean;
  notifications: boolean;
};

export type PromotionCampaign = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
  lifecycle?: 'draft' | 'published' | 'archived';
  bonusType: 'fixed' | 'percent';
  bonusValue: number;
  minDeposit: number;
  maxBonus: number;
  turnoverMultiplier: number;
  claimMode: 'manual_review' | 'auto_pending';
  imageUrl?: string;
  desktopImageUrl?: string;
  mobileImageUrl?: string;
  desktopAssetId?: string;
  mobileAssetId?: string;
  iconUrl?: string;
  badgeText?: string;
  accentColor?: string;
  href?: string;
  priority?: number;
  startsAt?: string;
  endsAt?: string;
};

export type PublicSiteSettings = {
  website?: Record<string, unknown>;
  branding?: Record<string, unknown>;
  theme?: Record<string, unknown>;
  icons?: Record<string, unknown>;
  seo?: Record<string, unknown>;
  contact?: Record<string, unknown>;
  maintenance?: Record<string, unknown>;
  features?: Record<string, unknown>;
  legal?: Record<string, unknown>;
};

const HERO_ROOT = '/assets/asset-pc/images/FEZX/imageslides';
const LOBBY_ROOT = '/assets/asset-pc/images/FEZX/lobby_settings';
const bundledAssets: CmsAsset[] = [
  bundled('member.logo.primary', 'โลโก้ Member', '/reference-v6/logo.webp', 'logo brand'),
  bundled('member.home.banner.01', 'Banner 01', `${HERO_ROOT}/1778979600098-3be41f05-c93f-4c12-b278-54cfe390de4c.jpg`, 'banner hero desktop mobile'),
  bundled('member.home.banner.02', 'Banner 02', `${HERO_ROOT}/1780250534847-0b47bd80-15a3-4117-bdd3-f383308509bc.jpg`, 'banner hero desktop mobile'),
  bundled('member.home.banner.03', 'Banner 03', `${HERO_ROOT}/1782630857612-4098241f-e70d-4a32-b41b-623d74b974b6.jpg`, 'banner hero desktop mobile'),
  bundled('member.home.banner.04', 'Banner 04', `${HERO_ROOT}/1782914061717-d7de2072-63f1-4dd5-95f6-8628990ba631.jpg`, 'banner hero desktop mobile login'),
  bundled('member.home.banner.05', 'Banner 05', `${HERO_ROOT}/1782990586367-b41e5c36-0d4d-4e7c-80ed-bb145a2e3a77.jpg`, 'banner hero desktop mobile'),
  bundled('member.home.banner.06', 'Banner 06', `${HERO_ROOT}/1783665647358-f637b660-a3e9-46e3-989d-a62654566985.jpg`, 'banner hero desktop mobile news'),
  bundled('member.home.banner.07', 'Banner 07', `${HERO_ROOT}/1784196704798-2fc7e5da-8d52-42a1-8a40-4f0f0465a264.jpg`, 'banner hero desktop mobile winners'),
  bundled('member.home.quick.promotion', 'การ์ดโปรโมชั่น', `${LOBBY_ROOT}/9d4a5498-3fd3-49fe-aca2-2fe6266bffdb.png`, 'promotion promo bonus quick card'),
  bundled('member.home.quick.activity', 'การ์ดกิจกรรม', `${LOBBY_ROOT}/ba6e40e2-2ce7-4ae8-a0dc-344197a35625.png`, 'activity event mission quick card'),
  bundled('member.home.quick.news', 'การ์ดข่าวสาร', `${LOBBY_ROOT}/ced6a371-3b8f-409b-889f-71f4952cd4cb.png`, 'news announcement notice quick card'),
  bundled('member.home.quick.promotion.background', 'พื้นหลังโปรโมชั่น', `${LOBBY_ROOT}/cc956ae5-4906-4190-8ee4-84a840a525eb.png`, 'promotion background'),
  bundled('member.home.quick.activity.background', 'พื้นหลังกิจกรรม', `${LOBBY_ROOT}/3e57c423-07f9-4334-80a9-43ebb2040871.png`, 'activity background'),
  bundled('member.home.quick.news.background', 'พื้นหลังข่าวสาร', `${LOBBY_ROOT}/87c8770e-e158-4491-b511-5e1e271ac486.png`, 'news background'),
  bundled('member.home.announcement.icon', 'ไอคอนประกาศ', '/assets/asset-pc/images/home/coin.webp', 'announcement icon'),
  bundled('member.home.tournament', 'Tournament', '/assets/asset-pc/images/ZAB1/tournament/4a7df032-03f5-4999-ba59-f38d12c13761.png', 'tournament competition activity'),
  bundled('member.home.jackpot', 'Jackpot', '/assets/asset-pc/images/FEZX/highlight/1725948738165-4cb4f1ec-44ed-4b21-99ed-398fbb6d7b25.gif', 'jackpot highlight'),
];

export const defaultCmsContent: CmsContent = {
  assets: bundledAssets,
  banners: bundledAssets.filter((asset) => asset.id.startsWith('member.home.banner.')).map((asset, index) => ({
    id: `home-banner-${String(index + 1).padStart(2, '0')}`,
    title: `Banner ${String(index + 1).padStart(2, '0')}`,
    subtitle: 'โปรโมชั่นแนะนำ',
    imageUrl: asset.url,
    desktopImageUrl: asset.url,
    mobileImageUrl: asset.url,
    assetId: asset.id,
    desktopAssetId: asset.id,
    mobileAssetId: asset.id,
    href: index === 6 ? '/browse/promotions' : '/',
    enabled: true,
    lifecycle: 'published',
  })),
  popup: { title: 'ประกาศ', message: 'ยินดีต้อนรับ', ctaLabel: 'ดูเกม', href: '/browse/games', enabled: false, lifecycle: 'draft', version: 'v1', imageUrl: '', desktopImageUrl: '', mobileImageUrl: '', assetId: '', desktopAssetId: '', mobileAssetId: '' },
  announcements: [{ id: 'system-ready', kind: 'system', title: 'ระบบพร้อมใช้งาน', message: 'ฝาก ถอน และเกมเปิดให้บริการตามปกติ', href: '/support', enabled: true, lifecycle: 'published', imageUrl: '', desktopImageUrl: '', mobileImageUrl: '', assetId: '', desktopAssetId: '', mobileAssetId: '' }],
  faqs: [{ id: 'deposit-duration', question: 'ฝากใช้เวลานานไหม', answer: 'หลังแนบสลิป แอดมินจะตรวจและอนุมัติให้เร็วที่สุด', enabled: true, lifecycle: 'published' }],
};

export const defaultIconSettings: SiteIconSettings = {
  home: '⌂', deposit: '＋', withdraw: '↗', games: '🎮', bonus: '★', affiliate: '↔', support: '✉', history: '≡', bank: '◈', profile: '👤', notification: '🔔', promotion: '🎁', vip: '♛', wallet: '฿',
};

export const defaultFeatureFlags: MemberFeatureFlags = {
  registration: true, login: true, deposit: true, withdraw: true, promotion: true, bonus: true, affiliate: true, support: true, kyc: true, games: true, profile: true, notifications: true,
};

const defaultPromotionCampaigns: PromotionCampaign[] = [{
  id: 'welcome-bonus', title: 'โบนัสต้อนรับ', description: 'รับโบนัสสำหรับรายการฝากแรกตามเงื่อนไขที่กำหนด', enabled: false, lifecycle: 'draft', bonusType: 'percent', bonusValue: 10, minDeposit: 100, maxBonus: 500, turnoverMultiplier: 3, claimMode: 'manual_review', imageUrl: '', desktopImageUrl: '', mobileImageUrl: '', desktopAssetId: '', mobileAssetId: '', badgeText: 'WELCOME', accentColor: '#f5c542', href: '/promotions', priority: 10,
}];

export const defaultSettings: PublicSiteSettings = {
  website: {
    site_name: 'Platform Starter', site_description: 'Member platform starter', registration_enabled: true, login_enabled: true, maintenance_mode: false,
  },
  branding: {
    primary_color: '#f5c542', background_color: '#080808', card_color: '#181818', text_color: '#ffffff', success_color: '#22c55e', danger_color: '#ef4444',
  },
  theme: {
    show_balance_header: true, show_deposit_withdraw_buttons: true, show_promotion_banner: true, show_game_categories: true, show_popular_providers: true, show_recommended_games: true,
  },
  icons: defaultIconSettings,
  maintenance: { enabled: false, member_enabled: false, message: 'ระบบกำลังปรับปรุง' },
  features: {
    registration_enabled: true, login_enabled: true, deposit_enabled: true, withdraw_enabled: true, promotion_enabled: true, bonus_enabled: true, affiliate_enabled: true, support_enabled: true, kyc_enabled: true, game_lobby_enabled: true, profile_enabled: true, notification_enabled: true,
    cms_content: defaultCmsContent,
    promotion_campaigns: defaultPromotionCampaigns,
  },
};

export async function loadPublicSiteSettings(): Promise<PublicSiteSettings> {
  try {
    const data = await publicSettingsClient.request<PublicSiteSettings>('/public/site-settings', { auth: false, cache: 'no-store' });
    return {
      ...defaultSettings,
      ...data,
      icons: { ...defaultIconSettings, ...(data.icons ?? {}) },
      features: { ...defaultSettings.features, ...(data.features ?? {}) },
    };
  } catch {
    return defaultSettings;
  }
}

export function textSetting(settings: PublicSiteSettings, group: keyof PublicSiteSettings, key: string, fallback: string) {
  const value = settings[group]?.[key];
  return typeof value === 'string' ? value : fallback;
}

function boolSetting(settings: PublicSiteSettings, group: keyof PublicSiteSettings, key: string, fallback: boolean) {
  const value = settings[group]?.[key];
  return typeof value === 'boolean' ? value : fallback;
}

export function memberFeatureFlags(settings: PublicSiteSettings): MemberFeatureFlags {
  const feature = (key: string, fallback: boolean) => boolSetting(settings, 'features', key, fallback);
  return {
    registration: feature('registration_enabled', true), login: feature('login_enabled', true), deposit: feature('deposit_enabled', true), withdraw: feature('withdraw_enabled', true), promotion: feature('promotion_enabled', true), bonus: feature('bonus_enabled', true), affiliate: feature('affiliate_enabled', true), support: feature('support_enabled', true), kyc: feature('kyc_enabled', true), games: feature('game_lobby_enabled', feature('provider_enabled', true)), profile: feature('profile_enabled', true), notifications: feature('notification_enabled', true),
  };
}

export function cmsContentSetting(settings: PublicSiteSettings): CmsContent {
  const value = settings.features?.cms_content;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return defaultCmsContent;
  const data = value as Record<string, unknown>;
  const incomingAssets = Array.isArray(data.assets) ? data.assets.map(normalizeAsset) : [];
  const assets = mergeAssets(bundledAssets, incomingAssets);
  return {
    assets,
    banners: Array.isArray(data.banners) && data.banners.length ? data.banners.map(normalizeBanner) : defaultCmsContent.banners,
    popup: normalizePopup(data.popup),
    announcements: Array.isArray(data.announcements) ? data.announcements.map(normalizeAnnouncement) : defaultCmsContent.announcements,
    faqs: Array.isArray(data.faqs) ? data.faqs.map((raw, index) => { const item = asRecord(raw); return { id: String(item.id ?? `faq-${index + 1}`), question: String(item.question ?? ''), answer: String(item.answer ?? ''), enabled: isPublished(item), lifecycle: lifecycle(item) }; }) : defaultCmsContent.faqs,
  };
}

export function cmsAssetUrl(content: CmsContent, assetId?: string) {
  if (!assetId) return '';
  return content.assets.find((asset) => asset.id === assetId && asset.enabled)?.url ?? '';
}

export function cmsResponsiveMediaUrls(content: CmsContent, media: CmsResponsiveMedia) {
  const legacy = cmsAssetUrl(content, media.assetId) || media.imageUrl || '';
  const desktop = cmsAssetUrl(content, media.desktopAssetId) || media.desktopImageUrl || legacy;
  const mobile = cmsAssetUrl(content, media.mobileAssetId) || media.mobileImageUrl || desktop || legacy;
  return { desktop: resolveCmsMediaUrl(desktop), mobile: resolveCmsMediaUrl(mobile), legacy: resolveCmsMediaUrl(legacy) };
}

export function resolveCmsMediaUrl(value: string) {
  if (value.startsWith('/public/cms-assets/')) return `${API_URL.replace(/\/$/, '')}${value}`;
  return value;
}

export function isIconUrl(value: string) {
  try { const url = new URL(value); return url.protocol === 'http:' || url.protocol === 'https:'; } catch { return false; }
}

export function promotionCampaignsSetting(settings: PublicSiteSettings): PromotionCampaign[] {
  const value = settings.features?.promotion_campaigns;
  if (!Array.isArray(value)) return defaultPromotionCampaigns;
  return value.map((raw, index) => {
    const item = asRecord(raw);
    const legacyImage = String(item.imageUrl ?? item.desktopImageUrl ?? '');
    return {
      id: String(item.id ?? `promotion-${index + 1}`), title: String(item.title ?? 'Promotion'), description: String(item.description ?? ''), enabled: isPublished(item), lifecycle: lifecycle(item), bonusType: item.bonusType === 'fixed' ? 'fixed' : 'percent', bonusValue: Number(item.bonusValue ?? 0), minDeposit: Number(item.minDeposit ?? 0), maxBonus: Number(item.maxBonus ?? 0), turnoverMultiplier: Number(item.turnoverMultiplier ?? 0), claimMode: item.claimMode === 'auto_pending' ? 'auto_pending' : 'manual_review',
      imageUrl: legacyImage, desktopImageUrl: String(item.desktopImageUrl ?? legacyImage), mobileImageUrl: String(item.mobileImageUrl ?? legacyImage), desktopAssetId: String(item.desktopAssetId ?? ''), mobileAssetId: String(item.mobileAssetId ?? ''), iconUrl: String(item.iconUrl ?? ''), badgeText: String(item.badgeText ?? ''), accentColor: String(item.accentColor ?? '#f5c542'), href: String(item.href ?? '/promotions'), priority: Number(item.priority ?? 0), startsAt: typeof item.startsAt === 'string' ? item.startsAt : undefined, endsAt: typeof item.endsAt === 'string' ? item.endsAt : undefined,
    };
  });
}

export function promotionMediaUrls(content: CmsContent, campaign: PromotionCampaign) {
  const desktop = cmsAssetUrl(content, campaign.desktopAssetId) || campaign.desktopImageUrl || campaign.imageUrl || '';
  const mobile = cmsAssetUrl(content, campaign.mobileAssetId) || campaign.mobileImageUrl || desktop;
  return { desktop: resolveCmsMediaUrl(desktop), mobile: resolveCmsMediaUrl(mobile) };
}

function bundled(id: string, name: string, url: string, tag: string): CmsAsset { return { id, name, url, type: 'image', tag, enabled: true, source: 'bundled' }; }
function mergeAssets(defaults: CmsAsset[], incoming: CmsAsset[]) { const byId = new Map(defaults.map((asset) => [asset.id, asset])); incoming.forEach((asset) => byId.set(asset.id, { ...(byId.get(asset.id) ?? {}), ...asset } as CmsAsset)); return [...byId.values()]; }
function normalizeAsset(raw: unknown, index: number): CmsAsset { const item = asRecord(raw); return { id: String(item.id ?? `asset_${index}`), name: String(item.name ?? `Asset ${index + 1}`), url: String(item.url ?? ''), type: item.type === 'video' || item.type === 'link' ? item.type : 'image', tag: String(item.tag ?? ''), enabled: item.enabled !== false, source: item.source === 'upload' || item.source === 'bundled' ? item.source : 'url', storageKey: typeof item.storageKey === 'string' ? item.storageKey : undefined }; }
function normalizeBanner(raw: unknown, index: number): CmsBanner { const item = asRecord(raw); const legacyImage = String(item.imageUrl ?? item.desktopImageUrl ?? ''); const legacyAsset = String(item.assetId ?? item.desktopAssetId ?? ''); return { id: String(item.id ?? `banner-${index + 1}`), title: String(item.title ?? ''), subtitle: String(item.subtitle ?? ''), href: String(item.href ?? '/browse/promotions'), enabled: isPublished(item), lifecycle: lifecycle(item), imageUrl: legacyImage, desktopImageUrl: String(item.desktopImageUrl ?? legacyImage), mobileImageUrl: String(item.mobileImageUrl ?? legacyImage), assetId: legacyAsset, desktopAssetId: String(item.desktopAssetId ?? legacyAsset), mobileAssetId: String(item.mobileAssetId ?? legacyAsset) }; }
function normalizePopup(raw: unknown): CmsContent['popup'] { const item = asRecord(raw); const legacyImage = String(item.imageUrl ?? item.desktopImageUrl ?? ''); const legacyAsset = String(item.assetId ?? item.desktopAssetId ?? ''); return { title: String(item.title ?? defaultCmsContent.popup.title), message: String(item.message ?? defaultCmsContent.popup.message), ctaLabel: String(item.ctaLabel ?? defaultCmsContent.popup.ctaLabel), href: String(item.href ?? defaultCmsContent.popup.href), enabled: isPublished(item), lifecycle: lifecycle(item), version: String(item.version ?? 'v1'), imageUrl: legacyImage, desktopImageUrl: String(item.desktopImageUrl ?? legacyImage), mobileImageUrl: String(item.mobileImageUrl ?? legacyImage), assetId: legacyAsset, desktopAssetId: String(item.desktopAssetId ?? legacyAsset), mobileAssetId: String(item.mobileAssetId ?? legacyAsset) }; }
function normalizeAnnouncement(raw: unknown, index: number): CmsAnnouncement { const item = asRecord(raw); const legacyImage = String(item.imageUrl ?? item.desktopImageUrl ?? ''); const legacyAsset = String(item.assetId ?? item.desktopAssetId ?? ''); return { id: String(item.id ?? `announcement-${index + 1}`), kind: item.kind === 'news' || item.kind === 'event' || item.kind === 'promotion' ? item.kind : 'system', title: String(item.title ?? ''), message: String(item.message ?? ''), href: String(item.href ?? ''), enabled: isPublished(item), lifecycle: lifecycle(item), imageUrl: legacyImage, desktopImageUrl: String(item.desktopImageUrl ?? legacyImage), mobileImageUrl: String(item.mobileImageUrl ?? legacyImage), assetId: legacyAsset, desktopAssetId: String(item.desktopAssetId ?? legacyAsset), mobileAssetId: String(item.mobileAssetId ?? legacyAsset) }; }
function lifecycle(item: Record<string, unknown>): 'draft' | 'published' | 'archived' { if (item.lifecycle === 'archived') return 'archived'; if (item.lifecycle === 'draft') return 'draft'; return item.lifecycle === 'published' || item.enabled !== false ? 'published' : 'draft'; }
function isPublished(item: Record<string, unknown>) { return lifecycle(item) === 'published' && item.enabled !== false; }
function asRecord(value: unknown): Record<string, unknown> { return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
