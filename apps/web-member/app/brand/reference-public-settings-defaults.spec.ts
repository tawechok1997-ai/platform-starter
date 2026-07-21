import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeTypedSiteSettings } from '../typed-site-settings';

test('applies imported reference assets and content as initial public settings', () => {
  const settings = normalizeTypedSiteSettings({});

  assert.equal(settings.website.site_name, 'NOAH345');
  assert.equal(settings.website.game_category_casino_label, 'คาสิโน');
  assert.equal(settings.branding.logo_url, '/assets/reference-brand/header/noah345-logo.webp');
  assert.equal(settings.branding.language_icon_url, '/assets/reference-brand/header/th.svg');
  assert.equal(settings.icons.game_category_casino_icon, '/assets/reference-brand/menu/casino.png');
  assert.equal(settings.icons.game_category_slot_icon, '/assets/reference-brand/menu/slot.png');
});

test('keeps admin/runtime public settings authoritative over reference defaults', () => {
  const settings = normalizeTypedSiteSettings({
    website: {
      site_name: 'Configured Brand',
      game_category_casino_label: 'โต๊ะเกม',
    },
    branding: {
      logo_url: '/uploads/configured-logo.png',
    },
    icons: {
      game_category_casino_icon: '/uploads/configured-casino.svg',
    },
  });

  assert.equal(settings.website.site_name, 'Configured Brand');
  assert.equal(settings.website.game_category_casino_label, 'โต๊ะเกม');
  assert.equal(settings.branding.logo_url, '/uploads/configured-logo.png');
  assert.equal(settings.icons.game_category_casino_icon, '/uploads/configured-casino.svg');
});
