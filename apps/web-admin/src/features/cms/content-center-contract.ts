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
  source?: 'upload' | 'url' | undefined;
};

export type CmsBanner = CmsLifecycleState & {
  title: string;
  subtitle: string;
  imageUrl: string;
  href: string;
  assetId?: string | undefined;
};

export type CmsPopup = CmsLifecycleState & {
  title: string;
  message: string;
  ctaLabel: string;
  href: string;
  version?: string | undefined;
  assetId?: string | undefined;
  imageUrl?: string | undefined;
};

export type CmsAnnouncement = CmsLifecycleState & {
  title: string;
  message: string;
};

export type CmsFaq = CmsLifecycleState & {
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

export const defaultContent: CmsContent = {
  assets: [],
  banners: [{
    title: 'พร้อมเล่นทุกเกม',
    subtitle: 'ฝาก ถอน เล่นเกม และดูประวัติได้ในมือถือเครื่องเดียว',
    imageUrl: '',
    href: '/games',
    enabled: true,
    lifecycle: 'published',
  }],
  popup: {
    title: 'ประกาศ',
    message: 'ยินดีต้อนรับ',
    ctaLabel: 'ดูเกม',
    href: '/games',
    enabled: false,
    lifecycle: 'draft',
    version: 'v1',
  },
  announcements: [{
    title: 'ระบบพร้อมใช้งาน',
    message: 'ฝาก ถอน และเกมเปิดให้บริการตามปกติ',
    enabled: true,
    lifecycle: 'published',
  }],
  faqs: [{
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
  return {
    lifecycle,
    enabled: lifecycle === 'published',
  };
}

export function isCmsPublished(item: CmsLifecycleState): boolean {
  return item.lifecycle === 'published' && item.enabled;
}

export function normalizeContent(value: unknown): CmsContent {
  const data = asRecord(value);
  const assets = Array.isArray(data.assets)
    ? data.assets.map((value, index) => normalizeAsset(value, index))
    : defaultContent.assets;

  return {
    assets,
    banners: Array.isArray(data.banners)
      ? data.banners.map(normalizeBanner)
      : defaultContent.banners,
    popup: normalizePopup(data.popup),
    announcements: Array.isArray(data.announcements)
      ? data.announcements.map(normalizeAnnouncement)
      : defaultContent.announcements,
    faqs: Array.isArray(data.faqs)
      ? data.faqs.map(normalizeFaq)
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

function normalizeAsset(value: unknown, index: number): CmsAsset {
  const item = asRecord(value);
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
    source: item.source === 'upload' ? 'upload' : 'url',
  };
}

function normalizeBanner(value: unknown): CmsBanner {
  const item = asRecord(value);
  const lifecycle = normalizeCmsLifecycle(item.lifecycle, item.enabled);
  return {
    title: String(item.title ?? ''),
    subtitle: String(item.subtitle ?? ''),
    imageUrl: String(item.imageUrl ?? ''),
    href: String(item.href ?? '/games'),
    lifecycle,
    enabled: lifecycle === 'published' && item.enabled !== false,
    assetId: String(item.assetId ?? ''),
  };
}

function normalizePopup(value: unknown): CmsPopup {
  const item = asRecord(value);
  const lifecycle = normalizeCmsLifecycle(item.lifecycle, item.enabled);
  return {
    title: String(item.title ?? defaultContent.popup.title),
    message: String(item.message ?? defaultContent.popup.message),
    ctaLabel: String(item.ctaLabel ?? defaultContent.popup.ctaLabel),
    href: String(item.href ?? defaultContent.popup.href),
    lifecycle,
    enabled: lifecycle === 'published' && item.enabled !== false,
    version: String(item.version ?? defaultContent.popup.version ?? 'v1'),
    assetId: String(item.assetId ?? ''),
    imageUrl: String(item.imageUrl ?? ''),
  };
}

function normalizeAnnouncement(value: unknown): CmsAnnouncement {
  const item = asRecord(value);
  const lifecycle = normalizeCmsLifecycle(item.lifecycle, item.enabled);
  return {
    title: String(item.title ?? ''),
    message: String(item.message ?? ''),
    lifecycle,
    enabled: lifecycle === 'published' && item.enabled !== false,
  };
}

function normalizeFaq(value: unknown): CmsFaq {
  const item = asRecord(value);
  const lifecycle = normalizeCmsLifecycle(item.lifecycle, item.enabled);
  return {
    question: String(item.question ?? ''),
    answer: String(item.answer ?? ''),
    lifecycle,
    enabled: lifecycle === 'published' && item.enabled !== false,
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}
