import type { PublicSiteSettings } from './site-settings';
import type { TypedPublicSiteSettings } from './site-settings-types';
import { cmsContentSetting, defaultSettings } from './site-settings';
import { REFERENCE_PUBLIC_SETTINGS_DEFAULTS } from './brand/reference-public-settings-defaults';

export function normalizeTypedSiteSettings(settings: PublicSiteSettings): TypedPublicSiteSettings {
  const features = {
    ...defaultSettings.features,
    ...(settings.features ?? {}),
  };

  const merged = {
    ...defaultSettings,
    ...settings,
    website: {
      ...defaultSettings.website,
      ...REFERENCE_PUBLIC_SETTINGS_DEFAULTS.website,
      ...(settings.website ?? {}),
    },
    branding: {
      ...defaultSettings.branding,
      ...REFERENCE_PUBLIC_SETTINGS_DEFAULTS.branding,
      ...(settings.branding ?? {}),
    },
    theme: { ...defaultSettings.theme, ...(settings.theme ?? {}) },
    icons: {
      ...defaultSettings.icons,
      ...REFERENCE_PUBLIC_SETTINGS_DEFAULTS.icons,
      ...(settings.icons ?? {}),
    },
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
