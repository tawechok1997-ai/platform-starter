import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const brandingSource = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
const workflowSource = readFileSync(new URL('./branding-publish-panel.tsx', import.meta.url), 'utf8');
const websiteSource = readFileSync(new URL('../website/page.tsx', import.meta.url), 'utf8');
const iconConfigSource = readFileSync(new URL('../icons/icon-settings-config.ts', import.meta.url), 'utf8');
const settingsSectionSource = readFileSync(new URL('../settings-section-page.tsx', import.meta.url), 'utf8');
const promotionRouteSource = readFileSync(new URL('../../promotion-center/page.tsx', import.meta.url), 'utf8');
const promotionFeatureSource = readFileSync(new URL('../../../../src/features/cms/promotion-center-page.tsx', import.meta.url), 'utf8');
const gameApiSource = readFileSync(new URL('../../game-api-settings/page.tsx', import.meta.url), 'utf8');

const websiteOnlyKeys = [
  'site_name',
  'site_url',
  'timezone',
  'currency',
  'maintenance_mode',
  'registration_enabled',
  'login_enabled',
] as const;

const brandingOnlyKeys = [
  'logo_url',
  'primary_color',
  'card_radius',
  'font_thai',
  'font_latin',
  'font_numeric',
] as const;

const iconOnlyKeys = [
  'home',
  'deposit',
  'withdraw',
  'promotion',
  'support',
  'game_category_slot_icon',
  'game_category_live_icon',
] as const;

test('website and branding keep distinct settings ownership', () => {
  for (const key of websiteOnlyKeys) {
    assert.match(websiteSource, new RegExp(`\\b${key}\\b`));
    assert.doesNotMatch(brandingSource, new RegExp(`key:\\s*["']${key}["']`));
  }

  for (const key of brandingOnlyKeys) {
    assert.match(brandingSource, new RegExp(`key:\\s*["']${key}["']`));
    assert.doesNotMatch(websiteSource, new RegExp(`\\b${key}\\b`));
    assert.doesNotMatch(iconConfigSource, new RegExp(`key:\\s*["']${key}["']`));
  }
});

test('icon settings own navigation visuals without absorbing branding or content', () => {
  for (const key of iconOnlyKeys) {
    assert.match(iconConfigSource, new RegExp(`key:\\s*["']${key}["']`));
  }
  assert.doesNotMatch(iconConfigSource, /logo_url|primary_color|font_thai|site_name|promotion_campaigns/);
  assert.doesNotMatch(brandingSource, /game_category_slot_icon|game_category_live_icon/);
  assert.doesNotMatch(websiteSource, /game_category_slot_icon|game_category_live_icon/);
});

test('branding workflow reuses the existing Admin UI system', () => {
  assert.match(workflowSource, /AdminActionStrip/);
  assert.match(workflowSource, /AdminLinkButton/);
  assert.doesNotMatch(workflowSource, /const linkStyle/);
  assert.doesNotMatch(brandingSource, /height:\s*12/);
});

test('branding asset lifecycle keeps one shared upload transport', () => {
  const matches = settingsSectionSource.match(/\/admin\/settings\/cms-assets/g) ?? [];
  assert.equal(matches.length, 1);
  assert.doesNotMatch(brandingSource, /\/admin\/settings\/cms-assets/);
  assert.doesNotMatch(workflowSource, /\/admin\/settings\/cms-assets/);
});

test('promotion center owns campaign records and remains a thin route boundary', () => {
  assert.match(promotionRouteSource, /features\/cms\/promotion-center-page/);
  assert.doesNotMatch(promotionRouteSource, /adminApiFetch|useState/);
  assert.match(promotionFeatureSource, /promotion_campaigns/);
  assert.match(promotionFeatureSource, /imageUrl/);
  assert.match(promotionFeatureSource, /iconUrl/);
  assert.doesNotMatch(brandingSource, /promotion_campaigns|bonusValue|turnoverMultiplier|claimMode/);
  assert.match(brandingSource, /promotion_placeholder_url/);
});

test('game API settings own providers endpoints credentials and readiness', () => {
  assert.match(gameApiSource, /\/admin\/game-providers/);
  assert.match(gameApiSource, /ProviderDetail/);
  assert.match(gameApiSource, /Endpoint\[\]/);
  assert.match(gameApiSource, /Credential\[\]/);
  assert.match(gameApiSource, /Readiness/);
  assert.doesNotMatch(brandingSource, /providerId|walletMode|maskedValue|TRANSFER_IN|WEBHOOK_SECRET/);
  assert.doesNotMatch(websiteSource, /providerId|walletMode|maskedValue|TRANSFER_IN|WEBHOOK_SECRET/);
  assert.match(brandingSource, /game_placeholder_url/);
});

test('branding placeholders do not become promotion or game data stores', () => {
  assert.doesNotMatch(brandingSource, /promotion_list|announcement_content|provider_catalog|game_catalog/);
  assert.match(brandingSource, /promotion_placeholder_url/);
  assert.match(brandingSource, /game_placeholder_url/);
});
