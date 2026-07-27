export type CmsLifecycle = 'draft' | 'published' | 'archived';

export type CmsLifecycleState = {
  lifecycle: CmsLifecycle;
  enabled: boolean;
};

export type CmsAsset = {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'link';
  tag?: string | undefined;
  enabled: boolean;
  storageKey?: string | undefined;
  mimeType?: string | undefined;
  sizeBytes?: number | undefined;
  sha256?: string | undefined;
  source?: 'upload' | 'url' | 'bundled' | undefined;
  protected?: boolean | undefined;
};

export type CmsResponsiveMedia = {
  imageUrl?: string | undefined;
  desktopImageUrl?: string | undefined;
  mobileImageUrl?: string | undefined;
  assetId?: string | undefined;
  desktopAssetId?: string | undefined;
  mobileAssetId?: string | undefined;
};

export type CmsBanner = CmsLifecycleState & CmsResponsiveMedia & {
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export type CmsPopup = CmsLifecycleState & CmsResponsiveMedia & {
  title: string;
  message: string;
  ctaLabel: string;
  href: string;
  version?: string | undefined;
};

export type CmsAnnouncementKind = 'news' | 'event' | 'promotion' | 'system';

export type CmsAnnouncement = CmsLifecycleState & CmsResponsiveMedia & {
  id: string;
  kind: CmsAnnouncementKind;
  title: string;
  message: string;
  href?: string | undefined;
};

export type CmsFaq = CmsLifecycleState & {
  id: string;
  question: string;
  answer: string;
};

export type CmsContent = {
  assets: CmsAsset[];
  banners: CmsBanner[];
  popup: CmsPopup;
  announcements: CmsAnnouncement[];
  faqs: CmsFaq[];
};

const HERO_ROOT = '/assets/asset-pc/images/FEZX/imageslides';
const LOBBY_ROOT = '/assets/asset-pc/images/FEZX/lobby_settings';

export const bundledCmsAssets: CmsAsset[] = [
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

export const defaultContent: CmsContent = {
  assets: bundledCmsAssets,
  banners: bundledCmsAssets
    .filter((asset) => asset.id.startsWith('member.home.banner.'))
    .map((asset, index) => ({
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
  popup: {
    title: 'ประกาศ',
    message: 'ยินดีต้อนรับ',
    ctaLabel: 'ดูเกม',
    href: '/browse/games',
    enabled: false,
    lifecycle: 'draft',
    version: 'v1',
    imageUrl: '',
    desktopImageUrl: '',
    mobileImageUrl: '',
    assetId: '',
    desktopAssetId: '',
    mobileAssetId: '',
  },
  announcements: [{
    id: 'system-ready',
    kind: 'system',
    title: 'ระบบพร้อมใช้งาน',
    message: 'ฝาก ถอน และเกมเปิดให้บริการตามปกติ',
    href: '/support',
    enabled: true,
    lifecycle: 'published',
    imageUrl: '',
    desktopImageUrl: '',
    mobileImageUrl: '',
    assetId: '',
    desktopAssetId: '',
    mobileAssetId: '',
  }],
  faqs: [{
    id: 'deposit-duration',
    question: 'ฝากใช้เวลานานไหม',
    answer: 'หลังแนบสลิป แอดมินจะตรวจและอนุมัติให้เร็วที่สุด',
    enabled: true,
    lifecycle: 'published',
  }],
};

export function normalizeCmsLifecycle(value: unknown, enabled: unknown): CmsLifecycle {
  if (value === 'archived') return 'archived';
  if (value === 'published') return 'published';
  if (value === 'draft') return 'draft';
  return enabled === true ? 'published' : 'draft';
}

export function cmsLifecyclePatch(lifecycle: CmsLifecycle): CmsLifecycleState {
  return { lifecycle, enabled: lifecycle === 'published' };
}

export function isCmsPublished(item: CmsLifecycleState): boolean {
  return item.lifecycle === 'published' && item.enabled;
}

export function normalizeContent(value: unknown): CmsContent {
  const data = asRecord(value);
  const incomingAssets = Array.isArray(data.assets)
    ? data.assets.map((item, index) => normalizeAsset(item, index))
    : [];
  const assets = mergeAssets(bundledCmsAssets, incomingAssets);

  return {
    assets,
    banners: Array.isArray(data.banners) && data.banners.length
      ? data.banners.map((item, index) => normalizeBanner(item, index))
      : defaultContent.banners,
    popup: normalizePopup(data.popup),
    announcements: Array.isArray(data.announcements)
      ? data.announcements.map((item, index) => normalizeAnnouncement(item, index))
      : defaultContent.announcements,
    faqs: Array.isArray(data.faqs)
      ? data.faqs.map((item, index) => normalizeFaq(item, index))
      : defaultContent.faqs,
  };
}

export function stringifyCmsContent(content: CmsContent): string {
  return JSON.stringify(content, null, 2);
}

export function parseCmsContentJson(value: string): { ok: true; content: CmsContent } | { ok: false; message: string } {
  try {
    return { ok: true, content: normalizeContent(JSON.parse(value)) };
  } catch {
    return { ok: false, message: 'JSON ไม่ถูกต้อง กรุณาตรวจ comma, quote และวงเล็บ' };
  }
}

export function cmsAssetUrl(assets: CmsAsset[], assetId?: string) {
  if (!assetId) return '';
  return assets.find((asset) => asset.id === assetId && asset.enabled)?.url ?? '';
}

export function responsiveMediaUrls(media: CmsResponsiveMedia, assets: CmsAsset[]) {
  const legacy = cmsAssetUrl(assets, media.assetId) || media.imageUrl || '';
  const desktop = cmsAssetUrl(assets, media.desktopAssetId) || media.desktopImageUrl || legacy;
  const mobile = cmsAssetUrl(assets, media.mobileAssetId) || media.mobileImageUrl || desktop || legacy;
  return { desktop, mobile, legacy };
}

export function referencedAssetIds(content: CmsContent) {
  const ids = new Set<string>();
  const collect = (item: CmsResponsiveMedia) => {
    [item.assetId, item.desktopAssetId, item.mobileAssetId].forEach((id) => { if (id) ids.add(id); });
  };
  content.banners.forEach(collect);
  collect(content.popup);
  content.announcements.forEach(collect);
  return ids;
}

function bundled(id: string, name: string, url: string, tag: string): CmsAsset {
  return { id, name, url, type: 'image', tag, enabled: true, source: 'bundled', protected: true };
}

function mergeAssets(defaults: CmsAsset[], incoming: CmsAsset[]) {
  const byId = new Map(defaults.map((asset) => [asset.id, asset]));
  for (const asset of incoming) {
    const bundledDefault = byId.get(asset.id);
    byId.set(asset.id, bundledDefault ? { ...bundledDefault, ...asset, id: bundledDefault.id, protected: true } : asset);
  }
  return [...byId.values()];
}

function normalizeAsset(value: unknown, index: number): CmsAsset {
  const item = asRecord(value);
  const source = item.source === 'upload' || item.source === 'bundled' ? item.source : 'url';
  return {
    id: String(item.id ?? `asset_${index}`),
    name: String(item.name ?? `Asset ${index + 1}`),
    url: String(item.url ?? ''),
    type: item.type === 'video' || item.type === 'link' ? item.type : 'image',
    tag: String(item.tag ?? ''),
    enabled: item.enabled !== false,
    storageKey: typeof item.storageKey === 'string' ? item.storageKey : undefined,
    mimeType: typeof item.mimeType === 'string' ? item.mimeType : undefined,
    sizeBytes: Number.isFinite(Number(item.sizeBytes)) ? Number(item.sizeBytes) : undefined,
    sha256: typeof item.sha256 === 'string' ? item.sha256 : undefined,
    source,
    protected: item.protected === true || source === 'bundled',
  };
}

function normalizeBanner(value: unknown, index: number): CmsBanner {
  const item = asRecord(value);
  const lifecycle = normalizeCmsLifecycle(item.lifecycle, item.enabled);
  const legacyImage = String(item.imageUrl ?? item.desktopImageUrl ?? '');
  const legacyAsset = String(item.assetId ?? item.desktopAssetId ?? '');
  return {
    id: String(item.id ?? `banner-${index + 1}`),
    title: String(item.title ?? ''),
    subtitle: String(item.subtitle ?? ''),
    imageUrl: legacyImage,
    desktopImageUrl: String(item.desktopImageUrl ?? legacyImage),
    mobileImageUrl: String(item.mobileImageUrl ?? legacyImage),
    href: String(item.href ?? '/browse/promotions'),
    lifecycle,
    enabled: lifecycle === 'published' && item.enabled !== false,
    assetId: legacyAsset,
    desktopAssetId: String(item.desktopAssetId ?? legacyAsset),
    mobileAssetId: String(item.mobileAssetId ?? legacyAsset),
  };
}

function normalizePopup(value: unknown): CmsPopup {
  const item = asRecord(value);
  const lifecycle = normalizeCmsLifecycle(item.lifecycle, item.enabled);
  const legacyImage = String(item.imageUrl ?? item.desktopImageUrl ?? '');
  const legacyAsset = String(item.assetId ?? item.desktopAssetId ?? '');
  return {
    title: String(item.title ?? defaultContent.popup.title),
    message: String(item.message ?? defaultContent.popup.message),
    ctaLabel: String(item.ctaLabel ?? defaultContent.popup.ctaLabel),
    href: String(item.href ?? defaultContent.popup.href),
    lifecycle,
    enabled: lifecycle === 'published' && item.enabled !== false,
    version: String(item.version ?? defaultContent.popup.version ?? 'v1'),
    imageUrl: legacyImage,
    desktopImageUrl: String(item.desktopImageUrl ?? legacyImage),
    mobileImageUrl: String(item.mobileImageUrl ?? legacyImage),
    assetId: legacyAsset,
    desktopAssetId: String(item.desktopAssetId ?? legacyAsset),
    mobileAssetId: String(item.mobileAssetId ?? legacyAsset),
  };
}

function normalizeAnnouncement(value: unknown, index: number): CmsAnnouncement {
  const item = asRecord(value);
  const lifecycle = normalizeCmsLifecycle(item.lifecycle, item.enabled);
  const legacyImage = String(item.imageUrl ?? item.desktopImageUrl ?? '');
  const legacyAsset = String(item.assetId ?? item.desktopAssetId ?? '');
  const kind: CmsAnnouncementKind = item.kind === 'news' || item.kind === 'event' || item.kind === 'promotion' ? item.kind : 'system';
  return {
    id: String(item.id ?? `announcement-${index + 1}`),
    title: String(item.title ?? ''),
    message: String(item.message ?? ''),
    kind,
    href: String(item.href ?? ''),
    imageUrl: legacyImage,
    desktopImageUrl: String(item.desktopImageUrl ?? legacyImage),
    mobileImageUrl: String(item.mobileImageUrl ?? legacyImage),
    assetId: legacyAsset,
    desktopAssetId: String(item.desktopAssetId ?? legacyAsset),
    mobileAssetId: String(item.mobileAssetId ?? legacyAsset),
    lifecycle,
    enabled: lifecycle === 'published' && item.enabled !== false,
  };
}

function normalizeFaq(value: unknown, index: number): CmsFaq {
  const item = asRecord(value);
  const lifecycle = normalizeCmsLifecycle(item.lifecycle, item.enabled);
  return {
    id: String(item.id ?? `faq-${index + 1}`),
    question: String(item.question ?? ''),
    answer: String(item.answer ?? ''),
    lifecycle,
    enabled: lifecycle === 'published' && item.enabled !== false,
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
