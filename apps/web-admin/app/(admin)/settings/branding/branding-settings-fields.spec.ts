import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const brandingSource = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
const websiteSource = readFileSync(new URL('../website/page.tsx', import.meta.url), 'utf8');

const requiredBrandingKeys = [
  'logo_url',
  'logo_horizontal_url',
  'logo_square_url',
  'logo_mobile_url',
  'logo_login_url',
  'logo_register_url',
  'logo_dark_url',
  'logo_light_url',
  'favicon_url',
  'apple_touch_icon_url',
  'pwa_icon_url',
  'open_graph_image_url',
  'default_avatar_url',
  'game_placeholder_url',
  'promotion_placeholder_url',
] as const;

const requiredWebsiteKeys = [
  'site_name',
  'site_description',
  'home_heading',
  'home_subtitle',
  'announcement_label',
  'promotions_heading',
  'games_heading',
  'providers_heading',
  'featured_games_heading',
  'popular_games_heading',
  'recent_games_heading',
  'favorite_games_heading',
  'empty_games_message',
  'empty_promotions_message',
  'login_title',
  'login_subtitle',
  'register_title',
  'register_subtitle',
  'deposit_label',
  'withdraw_label',
  'support_label',
] as const;

const settingsEndpoint = '/admin/settings/website';

test('branding settings retain every Member logo and system-image key', () => {
  assert.match(brandingSource, /group=["']branding["']/);
  assert.match(brandingSource, /preview=["']branding["']/);

  for (const key of requiredBrandingKeys) {
    assert.match(brandingSource, new RegExp(`key:\\s*["']${key}["']`), `${key} must remain editable in Admin branding settings`);
  }
});

test('website settings retain Member-facing content keys and the existing API contract', () => {
  assert.ok(websiteSource.includes(`adminApiFetch('${settingsEndpoint}')`) || websiteSource.includes(`adminApiFetch("${settingsEndpoint}")`));
  assert.ok(websiteSource.includes(`adminApiFetch('${settingsEndpoint}', {`) || websiteSource.includes(`adminApiFetch("${settingsEndpoint}", {`));

  for (const key of requiredWebsiteKeys) {
    assert.match(websiteSource, new RegExp(`\\b${key}\\b`), `${key} must remain editable in Admin website settings`);
  }
});

test('settings pages preserve reset and unsaved-change safeguards', () => {
  assert.match(brandingSource, /SettingsSectionPage/);
  assert.match(websiteSource, /beforeunload/);
  assert.match(websiteSource, /Reset/);
});
