import type { CmsContent, PromotionCampaign, SiteIconSettings } from './site-settings';

export type WebsiteSettings = {
  site_name: string;
  site_description: string;
  registration_enabled: boolean;
  login_enabled: boolean;
  maintenance_mode: boolean;
  [key: string]: unknown;
};

type BrandingSettings = {
  logo_url?: string;
  logo_mobile_url?: string;
  logo_login_url?: string;
  logo_register_url?: string;
  favicon_url?: string;
  language_icon_url?: string;
  brand_mark?: string;
  primary_color: string;
  background_color: string;
  card_color: string;
  text_color: string;
  success_color: string;
  danger_color: string;
  [key: string]: unknown;
};

type ThemeSettings = {
  animation_level?: 'off' | 'subtle' | 'lively';
  show_balance_header: boolean;
  show_deposit_withdraw_buttons: boolean;
  show_promotion_banner: boolean;
  show_game_categories: boolean;
  show_popular_providers: boolean;
  show_recommended_games: boolean;
  [key: string]: unknown;
};

type FeatureSettings = {
  registration_enabled: boolean;
  login_enabled: boolean;
  deposit_enabled: boolean;
  withdraw_enabled: boolean;
  promotion_enabled: boolean;
  bonus_enabled: boolean;
  affiliate_enabled: boolean;
  support_enabled: boolean;
  kyc_enabled: boolean;
  game_lobby_enabled: boolean;
  profile_enabled: boolean;
  notification_enabled: boolean;
  cms_content: CmsContent;
  promotion_campaigns: PromotionCampaign[];
  [key: string]: unknown;
};

type ContactSettings = {
  line_oa?: string;
  telegram?: string;
  facebook?: string;
  email?: string;
  phone?: string;
  live_chat_url?: string;
  support_hours?: string;
  company_name?: string;
  address?: string;
  [key: string]: unknown;
};

type LegalSettings = {
  terms?: string;
  privacy?: string;
  cookie?: string;
  responsible_use?: string;
  about_us?: string;
  contact_policy?: string;
  [key: string]: unknown;
};

type MaintenanceSettings = {
  enabled: boolean;
  member_enabled: boolean;
  message: string;
  [key: string]: unknown;
};

export type PublicIconSettings = SiteIconSettings & Record<string, string>;

export type TypedPublicSiteSettings = {
  website: WebsiteSettings;
  branding: BrandingSettings;
  theme: ThemeSettings;
  icons: PublicIconSettings;
  seo: Record<string, unknown>;
  contact: ContactSettings;
  maintenance: MaintenanceSettings;
  features: FeatureSettings;
  legal: LegalSettings;
};
