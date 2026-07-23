import type { CSSProperties } from 'react';
import { createBrandRuntimeConfig } from '../../brand/brand-config';
import { normalizeTypedSiteSettings } from '../../typed-site-settings';
import type { PublicSiteSettings } from '../../site-settings';
import { createAuthBrandViewModel, type AuthBrandViewModel } from './auth-brand-model';

export type AuthBrandRuntime = {
  model: AuthBrandViewModel;
  style: CSSProperties;
  brandMark: string;
};

export function createAuthBrandRuntime(settings: PublicSiteSettings, mode: 'login' | 'register'): AuthBrandRuntime {
  const typedSettings = normalizeTypedSiteSettings(settings);
  const brand = createBrandRuntimeConfig(typedSettings);
  const model = createAuthBrandViewModel(brand, mode, {
    eyebrow: mode === 'login' ? 'MEMBER ACCESS' : 'CREATE ACCOUNT',
  });

  return {
    model,
    style: {
      ...brand.themeStyle,
      '--color-brand': brand.themeStyle['--brand-primary'],
      '--color-bg': brand.themeStyle['--brand-background'],
      '--color-card': brand.themeStyle['--brand-card'],
      '--color-text': brand.themeStyle['--brand-text'],
    } as CSSProperties,
    brandMark: String(typedSettings.branding.brand_mark || brand.name.slice(0, 1).toUpperCase() || 'P'),
  };
}
