import {
  cmsAssetUrl as strictCmsAssetUrl,
  cmsContentSetting as strictCmsContentSetting,
  cmsResponsiveMediaUrls as strictCmsResponsiveMediaUrls,
  defaultCmsContent as strictDefaultCmsContent,
  promotionMediaUrls as strictPromotionMediaUrls,
  resolveCmsMediaUrl as strictResolveCmsMediaUrl,
} from './site-settings-media';
import type {
  CmsAnnouncement as StrictCmsAnnouncement,
  CmsAsset,
  CmsBanner as StrictCmsBanner,
  CmsContent as StrictCmsContent,
  CmsResponsiveMedia,
  IconKey,
  MemberFeatureFlags,
  PromotionCampaign,
  PublicSiteSettings,
  SiteIconSettings,
} from './site-settings-media';
import { resolveLocalAssetOrSource } from './lib/local-asset-by-basename';

export {
  API_URL,
  defaultFeatureFlags,
  defaultIconSettings,
  defaultSettings,
  isIconUrl,
  loadPublicSiteSettings,
  memberFeatureFlags,
  promotionCampaignsSetting,
  textSetting,
} from './site-settings-media';

export type {
  CmsAsset,
  CmsResponsiveMedia,
  IconKey,
  MemberFeatureFlags,
  PromotionCampaign,
  PublicSiteSettings,
  SiteIconSettings,
};

export type CmsBanner = Omit<StrictCmsBanner, 'id'> & {
  id?: string | undefined;
};

export type CmsAnnouncement = Omit<StrictCmsAnnouncement, 'id' | 'kind'> & {
  id?: string | undefined;
  kind?: StrictCmsAnnouncement['kind'] | undefined;
  thumbnailImageUrl?: string | undefined;
  bannerImageUrl?: string | undefined;
  detailImageUrl?: string | undefined;
  endsAt?: string | undefined;
  expiresAt?: string | undefined;
  statusLabel?: string | undefined;
  activityType?: string | undefined;
  numberPrediction?: boolean | undefined;
  terms?: string[] | undefined;
};

export type CmsContent = Omit<StrictCmsContent, 'banners' | 'announcements'> & {
  banners: CmsBanner[];
  announcements: CmsAnnouncement[];
};

export const defaultCmsContent = strictDefaultCmsContent as CmsContent;

export function cmsContentSetting(settings: PublicSiteSettings): CmsContent {
  const normalized = strictCmsContentSetting(settings) as CmsContent;
  const rawContent = asRecord(settings.features?.cms_content);
  const rawAnnouncements = Array.isArray(rawContent.announcements) ? rawContent.announcements : [];
  const rawById = new Map<string, Record<string, unknown>>();

  rawAnnouncements.forEach((value) => {
    const item = asRecord(value);
    const id = optionalString(item.id);
    if (id) rawById.set(id, item);
  });

  return {
    ...normalized,
    announcements: normalized.announcements.map((announcement, index) => {
      const raw = (announcement.id ? rawById.get(announcement.id) : undefined)
        ?? asRecord(rawAnnouncements[index]);
      return {
        ...announcement,
        thumbnailImageUrl: optionalString(raw.thumbnailImageUrl ?? raw.thumbnailUrl ?? raw.cardImageUrl),
        bannerImageUrl: optionalString(raw.bannerImageUrl ?? raw.detailImageUrl ?? raw.heroImageUrl ?? raw.coverImageUrl),
        detailImageUrl: optionalString(raw.detailImageUrl),
        endsAt: optionalString(raw.endsAt ?? raw.endDate),
        expiresAt: optionalString(raw.expiresAt),
        statusLabel: optionalString(raw.statusLabel ?? raw.statusText),
        activityType: optionalString(raw.activityType ?? raw.eventType),
        numberPrediction: optionalBoolean(raw.numberPrediction),
        terms: optionalStringArray(raw.terms),
      } satisfies CmsAnnouncement;
    }),
  };
}

export function cmsAssetUrl(content: CmsContent, assetId?: string) {
  return localFirst(strictCmsAssetUrl(content as StrictCmsContent, assetId));
}

export function cmsResponsiveMediaUrls(content: CmsContent, media: CmsResponsiveMedia) {
  const urls = strictCmsResponsiveMediaUrls(content as StrictCmsContent, media);
  return {
    desktop: localFirst(urls.desktop),
    mobile: localFirst(urls.mobile),
    legacy: localFirst(urls.legacy),
  };
}

export function promotionMediaUrls(content: CmsContent, campaign: PromotionCampaign) {
  const urls = strictPromotionMediaUrls(content as StrictCmsContent, campaign);
  return {
    desktop: localFirst(urls.desktop),
    mobile: localFirst(urls.mobile),
  };
}

export function resolveCmsMediaUrl(value: string) {
  return localFirst(strictResolveCmsMediaUrl(value));
}

function localFirst(value?: string | null) {
  return resolveLocalAssetOrSource(value, 'any');
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function optionalString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function optionalBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1' || value === 1) return true;
  if (value === 'false' || value === '0' || value === 0) return false;
  return undefined;
}

function optionalStringArray(value: unknown) {
  if (Array.isArray(value)) {
    const items = value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean);
    return items.length ? items : undefined;
  }
  if (typeof value !== 'string') return undefined;
  const items = value.split(/\r?\n|\|/).map((item) => item.trim()).filter(Boolean);
  return items.length ? items : undefined;
}
