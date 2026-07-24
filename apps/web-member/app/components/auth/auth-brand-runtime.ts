import type { CSSProperties } from 'react';
import type { BrandRuntimeConfig } from '../../brand/brand-config';
import { createBrandRuntimeConfig } from '../../brand/brand-config';
import { normalizeTypedSiteSettings } from '../../typed-site-settings';
import type { PublicSiteSettings } from '../../site-settings';
import { createAuthBrandViewModel, type AuthBrandViewModel } from './auth-brand-model';

type AuthMode = 'login' | 'register';

type AuthCssProperties = CSSProperties & {
  [key: `--${string}`]: string | number | undefined;
};

export type AuthBrandRuntime = {
  model: AuthBrandViewModel;
  style: AuthCssProperties;
  brandMark: string;
  brandCode: string;
};

export function createAuthBrandRuntimeFromBrand(
  brand: BrandRuntimeConfig,
  mode: AuthMode,
  configuredMark?: unknown,
): AuthBrandRuntime {
  const sourceModel = createAuthBrandViewModel(brand, mode, {
    eyebrow: mode === 'login' ? 'MEMBER ACCESS' : 'CREATE ACCOUNT',
  });
  const usesStarterFallback = sourceModel.siteName.trim().toLowerCase() === 'platform starter';
  const model: AuthBrandViewModel = usesStarterFallback
    ? { ...sourceModel, siteName: 'NOAH345' }
    : sourceModel;
  const explicitMark = typeof configuredMark === 'string' ? configuredMark.trim().slice(0, 8) : '';

  return {
    model,
    style: {
      ...brand.themeStyle,
      '--color-brand': String(brand.themeStyle['--brand-primary'] ?? '#d81bbf'),
      '--color-bg': String(brand.themeStyle['--brand-background'] ?? '#0b0712'),
      '--color-card': String(brand.themeStyle['--brand-card'] ?? '#1d1729'),
      '--color-text': String(brand.themeStyle['--brand-text'] ?? '#ffffff'),
    },
    brandMark: explicitMark || model.siteName.trim().slice(0, 1).toUpperCase() || 'N',
    brandCode: brand.code,
  };
}

export function createAuthBrandRuntime(settings: PublicSiteSettings, mode: AuthMode): AuthBrandRuntime {
  const typedSettings = normalizeTypedSiteSettings(settings);
  const brand = createBrandRuntimeConfig(typedSettings);
  return createAuthBrandRuntimeFromBrand(brand, mode, typedSettings.branding.brand_mark);
}
