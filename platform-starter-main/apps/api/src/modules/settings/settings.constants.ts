export const SETTING_GROUPS = [
  'website',
  'branding',
  'theme',
  'seo',
  'contact',
  'maintenance',
  'scripts',
  'features',
  'legal',
] as const;

export type SettingGroupSlug = (typeof SETTING_GROUPS)[number];

export const GROUP_TO_PRISMA = {
  website: 'WEBSITE',
  branding: 'BRANDING',
  theme: 'THEME',
  seo: 'SEO',
  contact: 'CONTACT',
  maintenance: 'MAINTENANCE',
  scripts: 'SCRIPTS',
  features: 'FEATURES',
  legal: 'LEGAL',
} as const;

export const PUBLIC_GROUPS: SettingGroupSlug[] = ['website', 'branding', 'theme', 'seo', 'contact', 'maintenance', 'features', 'legal'];

export const SENSITIVE_GROUPS: SettingGroupSlug[] = ['scripts'];

export const HIGH_RISK_KEYS = new Set([
  'website.site_url',
  'website.admin_url',
  'website.registration_enabled',
  'maintenance.enabled',
  'maintenance.deposit_enabled',
  'maintenance.withdraw_enabled',
  'maintenance.provider_enabled',
  'features.registration_enabled',
  'features.deposit_enabled',
  'features.withdraw_enabled',
  'features.provider_enabled',
  'scripts.custom_header_script',
  'scripts.custom_body_script',
  'scripts.custom_footer_script',
]);

export function isSettingGroup(value: string): value is SettingGroupSlug {
  return SETTING_GROUPS.includes(value as SettingGroupSlug);
}
