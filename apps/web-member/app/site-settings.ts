import {
  cmsAssetUrl as strictCmsAssetUrl,
  cmsContentSetting as strictCmsContentSetting,
  cmsResponsiveMediaUrls as strictCmsResponsiveMediaUrls,
  defaultCmsContent as strictDefaultCmsContent,
  promotionMediaUrls as strictPromotionMediaUrls,
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

export {
  API_URL,
  defaultFeatureFlags,
  defaultIconSettings,
  defaultSettings,
  isIconUrl,
  loadPublicSiteSettings,
  memberFeatureFlags,
  promotionCampaignsSetting,
  resolveCmsMediaUrl,
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
  const content = strictCmsContentSetting(settings) as CmsContent;
  return {
    ...content,
    announcements: content.announcements.map((announcement) => (
      announcement.kind === 'promotion'
        ? { ...announcement, kind: 'system' }
        : announcement
    )),
  };
}

export function cmsAssetUrl(content: CmsContent, assetId?: string) {
  return strictCmsAssetUrl(content as StrictCmsContent, assetId);
}

export function cmsResponsiveMediaUrls(content: CmsContent, media: CmsResponsiveMedia) {
  return strictCmsResponsiveMediaUrls(content as StrictCmsContent, media);
}

export function promotionMediaUrls(content: CmsContent, campaign: PromotionCampaign) {
  return strictPromotionMediaUrls(content as StrictCmsContent, campaign);
}
