import type { CSSProperties } from 'react';
import type { BrandRuntimeConfig } from '../../brand/brand-config';
import { createAuthBrandViewModel } from './auth-brand-model';

export type RegisterBrandAdapter = {
  siteName: string;
  logoUrl: string;
  brandMark: string;
  cssVars: CSSProperties;
  dataAttributes: {
    'data-auth-mode': 'register';
    'data-brand-code': string;
    'data-has-brand-logo': 'true' | 'false';
  };
};

/**
 * Maps the normalized brand runtime into the existing RegisterView contract.
 * It is intentionally presentation-only and does not touch registration API,
 * validation, captcha, referral, bank, session, or redirect behavior.
 */
export function createRegisterBrandAdapter(brand: BrandRuntimeConfig): RegisterBrandAdapter {
  const model = createAuthBrandViewModel(brand, 'register');
  const brandMark = model.siteName.trim().slice(0, 1).toUpperCase() || 'P';

  return {
    siteName: model.siteName,
    logoUrl: model.logoUrl,
    brandMark,
    cssVars: {
      ...brand.themeStyle,
      '--color-brand': String(brand.themeStyle['--brand-primary'] ?? '#f5c542'),
      '--color-bg': String(brand.themeStyle['--brand-background'] ?? '#080808'),
      '--color-card': String(brand.themeStyle['--brand-card'] ?? '#181818'),
      '--color-text': String(brand.themeStyle['--brand-text'] ?? '#ffffff'),
    } as CSSProperties,
    dataAttributes: {
      'data-auth-mode': 'register',
      'data-brand-code': brand.code,
      'data-has-brand-logo': model.logoUrl ? 'true' : 'false',
    },
  };
}
