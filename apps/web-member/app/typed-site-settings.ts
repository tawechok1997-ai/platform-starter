import type { PublicSiteSettings } from './site-settings';
import type { TypedPublicSiteSettings } from './site-settings-types';
import { cmsContentSetting, defaultSettings } from './site-settings';

export function normalizeTypedSiteSettings(settings: PublicSiteSettings): TypedPublicSiteSettings {
  const features = {
    ...defaultSettings.features,
    ...(settings.features ?? {}),
  };

  const merged = {
    ...defaultSettings,
    ...settings,
    website: { ...defaultSettings.website, ...(settings.website ?? {}) },
    branding: { ...defaultSettings.branding, ...(settings.branding ?? {}) },
    theme: { ...defaultSettings.theme, ...(settings.theme ?? {}) },
    icons: { ...defaultSettings.icons, ...(settings.icons ?? {}) },
    seo: { ...(defaultSettings.seo ?? {}), ...(settings.seo ?? {}) },
    contact: { ...(defaultSettings.contact ?? {}), ...(settings.contact ?? {}) },
    maintenance: { ...defaultSettings.maintenance, ...(settings.maintenance ?? {}) },
    features: {
      ...features,
      cms_content: cmsContentSetting({ ...settings, features }),
      promotion_campaigns: Array.isArray(features.promotion_campaigns)
        ? features.promotion_campaigns
        : defaultSettings.features?.promotion_campaigns,
    },
    legal: { ...(defaultSettings.legal ?? {}), ...(settings.legal ?? {}) },
  };

  return merged as TypedPublicSiteSettings;
}
