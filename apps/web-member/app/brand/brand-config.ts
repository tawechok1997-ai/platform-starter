import type { CSSProperties } from 'react';
import type { TypedPublicSiteSettings } from '../site-settings-types';

export type BrandThemeStyle = CSSProperties & Record<`--${string}`, string>;

export type BrandAssetKey =
  | 'logo'
  | 'logoHorizontal'
  | 'logoSquare'
  | 'logoDark'
  | 'logoLight'
  | 'logoMobile'
  | 'logoLogin'
  | 'logoRegister'
  | 'favicon'
  | 'appleTouchIcon'
  | 'pwaIcon'
  | 'openGraphImage'
  | 'defaultAvatar'
  | 'gamePlaceholder'
  | 'promotionPlaceholder';

export type BrandAssetMap = Record<BrandAssetKey, string>;

export type BrandRuntimeConfig = {
  code: string;
  name: string;
  description: string;
  assets: BrandAssetMap;
  themeStyle: BrandThemeStyle;
};

const EMPTY_ASSETS: BrandAssetMap = {
  logo: '',
  logoHorizontal: '',
  logoSquare: '',
  logoDark: '',
  logoLight: '',
  logoMobile: '',
  logoLogin: '',
  logoRegister: '',
  favicon: '',
  appleTouchIcon: '',
  pwaIcon: '',
  openGraphImage: '',
  defaultAvatar: '',
  gamePlaceholder: '',
  promotionPlaceholder: '',
};

export function createBrandRuntimeConfig(settings: TypedPublicSiteSettings): BrandRuntimeConfig {
  const { website, branding } = settings;
  const primary = safeColor(branding.primary_color, '#f5c542');
  const secondary = safeColor(readString(branding.secondary_color), primary);
  const accent = safeColor(readString(branding.accent_color), primary);
  const background = safeColor(branding.background_color, '#080808');
  const card = safeColor(branding.card_color, '#181818');
  const text = safeColor(branding.text_color, '#ffffff');
  const muted = safeColor(readString(branding.muted_text_color), '#a3a3a3');
  const border = safeColor(readString(branding.border_color), 'rgba(255,255,255,.12)');
  const success = safeColor(branding.success_color, '#22c55e');
  const warning = safeColor(readString(branding.warning_color), '#f59e0b');
  const danger = safeColor(branding.danger_color, '#ef4444');
  const info = safeColor(readString(branding.info_color), '#38bdf8');

  return {
    code: readString(website.brand_code) || 'default',
    name: website.site_name,
    description: website.site_description,
    assets: {
      ...EMPTY_ASSETS,
      logo: safeAssetUrl(readString(branding.logo_url)),
      logoHorizontal: safeAssetUrl(readString(branding.logo_horizontal_url)),
      logoSquare: safeAssetUrl(readString(branding.logo_square_url)),
      logoDark: safeAssetUrl(readString(branding.logo_dark_url)),
      logoLight: safeAssetUrl(readString(branding.logo_light_url)),
      logoMobile: safeAssetUrl(readString(branding.logo_mobile_url)),
      logoLogin: safeAssetUrl(readString(branding.logo_login_url)),
      logoRegister: safeAssetUrl(readString(branding.logo_register_url)),
      favicon: safeAssetUrl(readString(branding.favicon_url)),
      appleTouchIcon: safeAssetUrl(readString(branding.apple_touch_icon_url)),
      pwaIcon: safeAssetUrl(readString(branding.pwa_icon_url)),
      openGraphImage: safeAssetUrl(readString(branding.open_graph_image_url)),
      defaultAvatar: safeAssetUrl(readString(branding.default_avatar_url)),
      gamePlaceholder: safeAssetUrl(readString(branding.game_placeholder_url)),
      promotionPlaceholder: safeAssetUrl(readString(branding.promotion_placeholder_url)),
    },
    themeStyle: {
      colorScheme: readString(branding.color_scheme) === 'light' ? 'light' : 'dark',
      background,
      color: text,
      '--brand-primary': primary,
      '--brand-secondary': secondary,
      '--brand-accent': accent,
      '--brand-background': background,
      '--brand-card': card,
      '--brand-text': text,
      '--brand-text-muted': muted,
      '--brand-border': border,
      '--brand-success': success,
      '--brand-warning': warning,
      '--brand-danger': danger,
      '--brand-info': info,
      '--brand-radius-card': safeCssLength(readString(branding.card_radius), '16px'),
      '--brand-content-width': safeCssLength(readString(branding.content_width), '1440px'),
      '--brand-font-thai': safeFontFamily(readString(branding.font_thai), 'LINE Seed Sans TH, Noto Sans Thai, sans-serif'),
      '--brand-font-latin': safeFontFamily(readString(branding.font_latin), 'Inter, sans-serif'),
      '--brand-font-numeric': safeFontFamily(readString(branding.font_numeric), 'Inter, sans-serif'),
    },
  };
}

function readString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function safeColor(value: unknown, fallback: string) {
  const candidate = readString(value);
  if (!candidate) return fallback;
  if (/^#[0-9a-f]{3,8}$/i.test(candidate)) return candidate;
  if (/^(rgb|rgba|hsl|hsla)\([\d\s.,%+-]+\)$/i.test(candidate)) return candidate;
  if (/^var\(--[a-z0-9-_]+\)$/i.test(candidate)) return candidate;
  return fallback;
}

function safeAssetUrl(value: string) {
  if (!value) return '';
  if (value.startsWith('/')) return value;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? value : '';
  } catch {
    return '';
  }
}

function safeCssLength(value: string, fallback: string) {
  return /^(\d+(\.\d+)?)(px|rem|em|vw|vh|%)$/i.test(value) ? value : fallback;
}

function safeFontFamily(value: string, fallback: string) {
  if (!value || /[;{}]/.test(value)) return fallback;
  return value.slice(0, 160);
}
