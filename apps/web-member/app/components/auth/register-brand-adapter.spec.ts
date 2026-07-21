import assert from 'node:assert/strict';
import test from 'node:test';
import type { BrandRuntimeConfig } from '../../brand/brand-config';
import { createRegisterBrandAdapter } from './register-brand-adapter';

function brand(overrides: Partial<BrandRuntimeConfig> = {}): BrandRuntimeConfig {
  return {
    code: 'reference-brand',
    name: 'Reference Brand',
    description: 'Member experience',
    assets: {
      logo: '/assets/reference-brand/brand/logo.svg',
      logoHorizontal: '',
      logoSquare: '',
      logoDark: '',
      logoLight: '',
      logoMobile: '',
      logoLogin: '',
      logoRegister: '/assets/reference-brand/auth/register-logo.svg',
      favicon: '',
      appleTouchIcon: '',
      pwaIcon: '',
      openGraphImage: '',
      defaultAvatar: '',
      gamePlaceholder: '',
      promotionPlaceholder: '',
    },
    themeStyle: {
      '--brand-primary': '#8b5cf6',
      '--brand-background': '#08040f',
      '--brand-card': '#171020',
      '--brand-text': '#ffffff',
    },
    ...overrides,
  };
}

test('maps register logo and legacy auth tokens without touching flow data', () => {
  const adapter = createRegisterBrandAdapter(brand());
  assert.equal(adapter.siteName, 'Reference Brand');
  assert.equal(adapter.logoUrl, '/assets/reference-brand/auth/register-logo.svg');
  assert.equal(adapter.brandMark, 'R');
  assert.equal(adapter.cssVars['--color-brand'], '#8b5cf6');
  assert.equal(adapter.dataAttributes['data-auth-mode'], 'register');
  assert.equal(adapter.dataAttributes['data-has-brand-logo'], 'true');
});

test('falls back to main logo and stable brand mark', () => {
  const base = brand();
  const adapter = createRegisterBrandAdapter({
    ...base,
    name: '',
    assets: { ...base.assets, logoRegister: '' },
  });
  assert.equal(adapter.logoUrl, '/assets/reference-brand/brand/logo.svg');
  assert.equal(adapter.brandMark, 'P');
});
