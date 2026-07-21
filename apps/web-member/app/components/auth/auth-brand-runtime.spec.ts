import assert from 'node:assert/strict';
import test from 'node:test';
import { defaultSettings } from '../../site-settings';
import { createAuthBrandRuntime } from './auth-brand-runtime';

test('login prefers the dedicated login logo and exposes compatibility tokens', () => {
  const runtime = createAuthBrandRuntime({
    ...defaultSettings,
    website: { ...defaultSettings.website, site_name: 'Reference Brand', brand_code: 'reference-brand' },
    branding: {
      ...defaultSettings.branding,
      logo_url: '/assets/reference-brand/brand/logo.svg',
      logo_login_url: '/assets/reference-brand/auth/login-logo.svg',
      primary_color: '#7c3aed',
    },
  }, 'login');

  assert.equal(runtime.model.siteName, 'Reference Brand');
  assert.equal(runtime.model.logoUrl, '/assets/reference-brand/auth/login-logo.svg');
  assert.equal(runtime.style['--color-brand' as keyof typeof runtime.style], '#7c3aed');
});

test('register falls back safely when an auth-specific logo is unavailable', () => {
  const runtime = createAuthBrandRuntime({
    ...defaultSettings,
    branding: {
      ...defaultSettings.branding,
      logo_url: '/assets/reference-brand/brand/logo.svg',
      logo_register_url: 'javascript:alert(1)',
    },
  }, 'register');

  assert.equal(runtime.model.logoUrl, '/assets/reference-brand/brand/logo.svg');
  assert.equal(runtime.model.mode, 'register');
});
