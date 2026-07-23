import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const brandingSource = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
const workflowSource = readFileSync(new URL('./branding-publish-panel.tsx', import.meta.url), 'utf8');
const websiteSource = readFileSync(new URL('../website/page.tsx', import.meta.url), 'utf8');
const settingsSectionSource = readFileSync(new URL('../settings-section-page.tsx', import.meta.url), 'utf8');

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

test('website and branding keep distinct settings ownership', () => {
  for (const key of websiteOnlyKeys) {
    assert.match(websiteSource, new RegExp(`\\b${key}\\b`));
    assert.doesNotMatch(brandingSource, new RegExp(`key:\\s*["']${key}["']`));
  }

  for (const key of brandingOnlyKeys) {
    assert.match(brandingSource, new RegExp(`key:\\s*["']${key}["']`));
    assert.doesNotMatch(websiteSource, new RegExp(`\\b${key}\\b`));
  }
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

test('promotion and game ownership do not leak into branding settings', () => {
  assert.doesNotMatch(brandingSource, /promotion_list|announcement_content|provider_catalog|game_catalog/);
  assert.match(brandingSource, /promotion_placeholder_url/);
  assert.match(brandingSource, /game_placeholder_url/);
});
