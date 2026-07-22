import assert from 'node:assert/strict';
import test from 'node:test';
import { createBrandRuntimeConfig } from './brand-config';
import type { TypedPublicSiteSettings } from '../site-settings-types';

function settings(overrides: Record<string, unknown> = {}): TypedPublicSiteSettings {
  return {
    website: {
      site_name: 'Test Brand',
      site_description: 'Test description',
      registration_enabled: true,
      login_enabled: true,
      maintenance_mode: false,
      brand_code: 'test-brand',
    },
    branding: {
      primary_color: '#7c3aed',
      background_color: '#08040f',
      card_color: '#171020',
      text_color: '#ffffff',
      success_color: '#22c55e',
      danger_color: '#ef4444',
      ...overrides,
    },
    theme: {
      show_balance_header: true,
      show_deposit_withdraw_buttons: true,
      show_promotion_banner: true,
      show_game_categories: true,
      show_popular_providers: true,
      show_recommended_games: true,
    },
    icons: {
      home: '⌂', deposit: '+', withdraw: '↗', games: '🎮', bonus: '★', affiliate: '↔', support: '✉', history: '≡', bank: '◈', profile: '👤', notification: '🔔', promotion: '🎁', vip: '♛', wallet: '฿',
    },
    seo: {}, contact: {}, legal: {},
    maintenance: { enabled: false, member_enabled: false, message: '' },
    features: {
      registration_enabled: true, login_enabled: true, deposit_enabled: true, withdraw_enabled: true,
      promotion_enabled: true, bonus_enabled: true, affiliate_enabled: true, support_enabled: true,
      kyc_enabled: true, game_lobby_enabled: true, profile_enabled: true, notification_enabled: true,
      cms_content: { assets: [], banners: [], popup: { title: '', message: '', ctaLabel: '', href: '', enabled: false }, announcements: [], faqs: [] },
      promotion_campaigns: [],
    },
  };
}

test('creates stable tokens and asset mappings', () => {
  const config = createBrandRuntimeConfig(settings({
    secondary_color: '#9333ea',
    logo_url: '/assets/logo.svg',
    logo_login_url: 'https://cdn.example.com/login.svg',
    content_width: '1320px',
  }));
  assert.equal(config.code, 'test-brand');
  assert.equal(config.assets.logo, '/assets/logo.svg');
  assert.equal(config.assets.logoLogin, 'https://cdn.example.com/login.svg');
  assert.equal(config.themeStyle['--brand-secondary'], '#9333ea');
  assert.equal(config.themeStyle['--brand-content-width'], '1320px');
});

test('rejects unsafe CSS and asset values', () => {
  const config = createBrandRuntimeConfig(settings({
    primary_color: 'red; background:url(javascript:alert(1))',
    logo_url: 'javascript:alert(1)',
    font_thai: 'Noto Sans Thai; color:red',
    card_radius: 'expression(alert(1))',
  }));
  assert.equal(config.themeStyle['--brand-primary'], '#f5c542');
  assert.equal(config.assets.logo, '');
  assert.equal(config.themeStyle['--brand-radius-card'], '16px');
  assert.equal(config.themeStyle['--brand-font-thai'], 'LINE Seed Sans TH, Noto Sans Thai, sans-serif');
});
