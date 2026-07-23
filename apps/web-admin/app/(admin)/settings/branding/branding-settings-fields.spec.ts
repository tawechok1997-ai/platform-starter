import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const brandingSource = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
const workflowPanelSource = readFileSync(new URL('./branding-publish-panel.tsx', import.meta.url), 'utf8');
const previewPageSource = readFileSync(new URL('./preview/page.tsx', import.meta.url), 'utf8');
const historyPageSource = readFileSync(new URL('./history/page.tsx', import.meta.url), 'utf8');
const previewComponentSource = readFileSync(new URL('../branding-member-preview.tsx', import.meta.url), 'utf8');
const settingsSectionSource = readFileSync(new URL('../settings-section-page.tsx', import.meta.url), 'utf8');
const websiteSource = readFileSync(new URL('../website/page.tsx', import.meta.url), 'utf8');
const lifecycleSource = readFileSync(new URL('../use-admin-settings-form.ts', import.meta.url), 'utf8');
const unsavedChangesSource = readFileSync(new URL('../../_components/admin-unsaved-changes.tsx', import.meta.url), 'utf8');

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
  assert.match(brandingSource, /BrandingPublishPanel/);

  for (const key of requiredBrandingKeys) {
    assert.match(brandingSource, new RegExp(`key:\\s*["']${key}["']`), `${key} must remain editable in Admin branding settings`);
  }
});

test('branding workflow preserves draft publish preview history and rollback ownership', () => {
  assert.match(workflowPanelSource, /\/admin\/settings\/branding\/publish/);
  assert.match(workflowPanelSource, /\/settings\/branding\/preview/);
  assert.match(workflowPanelSource, /\/settings\/branding\/history/);
  assert.match(previewPageSource, /\/admin\/settings\/branding\/draft/);
  assert.match(historyPageSource, /\/admin\/settings\/branding\/history/);
  assert.match(historyPageSource, /rollback/);
});

test('branding workflow uses the existing Admin design-system primitives', () => {
  assert.match(workflowPanelSource, /AdminActionStrip/);
  assert.match(workflowPanelSource, /AdminLinkButton/);
  assert.match(workflowPanelSource, /AdminNotice/);
  assert.match(workflowPanelSource, /AdminButton/);
  assert.doesNotMatch(workflowPanelSource, /linkStyle/);
});

test('branding asset lifecycle keeps the shared upload transport and safe restore controls', () => {
  assert.match(settingsSectionSource, /\/admin\/settings\/cms-assets/);
  assert.match(settingsSectionSource, /Upload/);
  assert.match(settingsSectionSource, /Replace/);
  assert.match(settingsSectionSource, /Disable/);
  assert.match(settingsSectionSource, /Restore/);
  assert.match(settingsSectionSource, /disabled_url/);
  assert.match(settingsSectionSource, /Save Changes/);
});

test('full-page branding preview supports desktop tablet and mobile contracts', () => {
  assert.match(previewPageSource, /BrandingMemberPreview/);
  assert.match(previewPageSource, /\/admin\/settings\/branding/);
  assert.match(previewComponentSource, /desktop:\s*1180/);
  assert.match(previewComponentSource, /tablet:\s*768/);
  assert.match(previewComponentSource, /mobile:\s*390/);
  assert.match(previewComponentSource, /data-preview-viewport/);
  assert.match(previewComponentSource, /aria-label=["']Preview viewport["']/);
});

test('preview ownership remains limited to inline form previews and one full-page Member preview', () => {
  assert.match(previewPageSource, /data-preview-scope=["']full-page["']/);
  assert.match(previewPageSource, /AdminLinkButton/);
  assert.doesNotMatch(settingsSectionSource, /BrandingMemberPreview/);
  assert.doesNotMatch(websiteSource, /BrandingMemberPreview/);
  assert.equal((workflowPanelSource.match(/\/settings\/branding\/preview/g) ?? []).length, 1);
  assert.equal((previewPageSource.match(/data-preview-scope=["']full-page["']/g) ?? []).length, 1);
});

test('website settings retain Member-facing content keys and the existing API contract', () => {
  assert.match(websiteSource, /useAdminSettingsForm<WebsiteSettings>/);
  assert.match(websiteSource, new RegExp(`endpoint:\\s*["']${settingsEndpoint}["']`));
  assert.match(lifecycleSource, /adminApiFetch\(endpoint\)/);
  assert.match(lifecycleSource, /method:\s*["']PUT["']/);

  for (const key of requiredWebsiteKeys) {
    assert.match(websiteSource, new RegExp(`\\b${key}\\b`), `${key} must remain editable in Admin website settings`);
  }
});

test('website and branding settings keep distinct field ownership', () => {
  for (const key of ['site_name', 'site_url', 'maintenance_mode', 'login_title', 'home_heading']) {
    assert.doesNotMatch(brandingSource, new RegExp(`key:\\s*["']${key}["']`), `${key} belongs to Website settings, not Branding`);
  }
  for (const key of ['logo_url', 'primary_color', 'font_thai', 'card_radius']) {
    assert.doesNotMatch(websiteSource, new RegExp(`\\b${key}\\b`), `${key} belongs to Branding settings, not Website`);
  }
});

test('settings pages preserve shared reset and unsaved-change safeguards', () => {
  assert.match(brandingSource, /SettingsSectionPage/);
  assert.match(websiteSource, /useAdminSettingsForm/);
  assert.match(settingsSectionSource, /useAdminSettingsForm<SettingsRecord>/);
  assert.match(websiteSource, /reset/);
  assert.match(settingsSectionSource, /onClick={reset}/);
  assert.match(lifecycleSource, /useAdminUnsavedChanges/);
  assert.match(unsavedChangesSource, /beforeunload/);
  assert.match(unsavedChangesSource, /window\.confirm\(warningMessage\)/);
  assert.match(lifecycleSource, /setForm\(initialForm\)/);
});

test('settings lifecycle transport is centralized instead of copied into each page', () => {
  assert.doesNotMatch(websiteSource, /adminApiFetch/);
  assert.doesNotMatch(websiteSource, /beforeunload/);
  assert.doesNotMatch(settingsSectionSource, /method:\s*["']PUT["']/);
  assert.doesNotMatch(settingsSectionSource, /beforeunload/);
  assert.match(lifecycleSource, /adminApiFetch\(endpoint/);
  assert.match(lifecycleSource, /JSON\.stringify\(form\)/);
});
