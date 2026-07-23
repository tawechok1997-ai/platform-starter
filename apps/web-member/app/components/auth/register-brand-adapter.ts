import type { CSSProperties } from 'react';
import type { BrandRuntimeConfig } from '../../brand/brand-config';
import type { PublicSiteSettings } from '../../site-settings';
import {
  createAuthBrandRuntime,
  createAuthBrandRuntimeFromBrand,
} from './auth-brand-runtime';

type CssCustomProperties = CSSProperties & {
  [key: `--${string}`]: string | number | undefined;
};

export type RegisterBrandAdapter = {
  siteName: string;
  logoUrl: string;
  brandMark: string;
  cssVars: CssCustomProperties;
  dataAttributes: {
    'data-auth-mode': 'register';
    'data-brand-code': string;
    'data-has-brand-logo': 'true' | 'false';
  };
};

/**
 * Keeps the existing RegisterView contract while delegating all brand mapping
 * to the shared Auth runtime used by Login.
 */
export function createRegisterBrandAdapter(brand: BrandRuntimeConfig): RegisterBrandAdapter {
  return toRegisterBrandAdapter(createAuthBrandRuntimeFromBrand(brand, 'register'));
}

export function createRegisterBrandAdapterFromSettings(settings: PublicSiteSettings): RegisterBrandAdapter {
  return toRegisterBrandAdapter(createAuthBrandRuntime(settings, 'register'));
}

function toRegisterBrandAdapter(runtime: ReturnType<typeof createAuthBrandRuntime>): RegisterBrandAdapter {
  return {
    siteName: runtime.model.siteName,
    logoUrl: runtime.model.logoUrl,
    brandMark: runtime.brandMark,
    cssVars: runtime.style,
    dataAttributes: {
      'data-auth-mode': 'register',
      'data-brand-code': runtime.brandCode,
      'data-has-brand-logo': runtime.model.logoUrl ? 'true' : 'false',
    },
  };
}
