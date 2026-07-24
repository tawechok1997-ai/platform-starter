import assert from 'node:assert/strict';
import test from 'node:test';
import type { BrandRuntimeConfig } from '../../brand/brand-config';
import { defaultSettings } from '../../site-settings';
import { createRegisterBrandAdapter, createRegisterBrandAdapterFromSettings } from './register-brand-adapter';

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
  assert.equal(adapter.brandMark, 'N');
});

test('maps public settings while preserving configured brand mark', () => {
  const adapter = createRegisterBrandAdapterFromSettings({
    ...defaultSettings,
    website: { ...defaultSettings.website, site_name: 'Settings Brand', brand_code: 'settings-brand' },
    branding: {
      ...defaultSettings.branding,
      brand_mark: 'SB',
      logo_register_url: '/assets/reference-brand/auth/register-logo.svg',
      primary_color: '#6d28d9',
    },
  });

  assert.equal(adapter.siteName, 'Settings Brand');
  assert.equal(adapter.logoUrl, '/assets/reference-brand/auth/register-logo.svg');
  assert.equal(adapter.brandMark, 'SB');
  assert.equal(adapter.cssVars['--color-brand'], '#6d28d9');
  assert.equal(adapter.dataAttributes['data-brand-code'], 'settings-brand');
});
