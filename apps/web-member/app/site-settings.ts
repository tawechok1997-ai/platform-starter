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
};

export type CmsContent = Omit<StrictCmsContent, 'banners' | 'announcements'> & {
  banners: CmsBanner[];
  announcements: CmsAnnouncement[];
};

export const defaultCmsContent = strictDefaultCmsContent as CmsContent;

export function cmsContentSetting(settings: PublicSiteSettings): CmsContent {
  return strictCmsContentSetting(settings) as CmsContent;
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
