import assert from 'node:assert/strict';
import test from 'node:test';
import { createAuthBrandViewModel } from './auth-brand-model';
import type { BrandRuntimeConfig } from '../../brand/brand-config';

function brand(overrides: Partial<BrandRuntimeConfig['assets']> = {}): BrandRuntimeConfig {
  return {
    code: 'test',
    name: 'Test Brand',
    description: 'Test description',
    assets: {
      logo: '/assets/logo.svg',
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
      ...overrides,
    },
    themeStyle: {},
  };
}

test('login prefers its dedicated logo', () => {
  const model = createAuthBrandViewModel(brand({ logoLogin: '/assets/login.svg' }), 'login');
  assert.equal(model.logoUrl, '/assets/login.svg');
  assert.equal(model.mode, 'login');
});

test('register falls back to the primary logo', () => {
  const model = createAuthBrandViewModel(brand(), 'register');
  assert.equal(model.logoUrl, '/assets/logo.svg');
  assert.equal(model.mode, 'register');
});
