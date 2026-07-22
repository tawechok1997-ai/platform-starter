import assert from 'node:assert/strict';
import test from 'node:test';
import type { PublicSiteSettings } from '../site-settings';
import {
  buildVisibleGameCategoryNavigation,
  createGameCategoryNavigationConfig,
  normalizeCategory,
} from './game-category-navigation';

function settings(overrides: PublicSiteSettings = {}): PublicSiteSettings {
  return { website: {}, icons: {}, ...overrides };
}

test('uses safe built-in fallbacks for main game category menu', () => {
  const config = createGameCategoryNavigationConfig(settings());
  assert.equal(config.home.label, 'หน้าหลัก');
  assert.equal(config.casino.label, 'คาสิโน');
  assert.equal(config.slot.label, 'สล็อต');
  assert.equal(config.home.iconValue, '⌂');
  assert.equal(config.live.iconValue, '●');
  assert.equal(config.fishing.label, 'เกมตกปลา');
});

test('accepts labels and icons from settings', () => {
  const config = createGameCategoryNavigationConfig(settings({
    website: {
      game_category_casino_label: 'คาสิโนพรีเมียม',
      game_category_fishing_label: 'เกมตกปลา',
    },
    icons: {
      game_category_casino_icon: '/uploads/icons/casino.svg',
      game_category_fishing_icon: '🐟',
    },
  }));

  assert.equal(config.casino.label, 'คาสิโนพรีเมียม');
  assert.equal(config.casino.iconValue, '/uploads/icons/casino.svg');
  assert.equal(config.fishing.label, 'เกมตกปลา');
  assert.equal(config.fishing.iconValue, '🐟');
});

test('rejects unsafe configured icon values without introducing a missing asset request', () => {
  const config = createGameCategoryNavigationConfig(settings({
    icons: { game_category_slot_icon: 'javascript:alert(1)' },
  }));
  assert.equal(config.slot.iconValue, '▦');
  assert.equal(config.slot.iconValue.startsWith('/'), false);
});

test('maps API categories, removes duplicates, and keeps unknown categories', () => {
  const config = createGameCategoryNavigationConfig(settings());
  const items = buildVisibleGameCategoryNavigation(
    ['SLOT', 'slots', 'live_casino', 'SPORTS', 'custom-category'],
    config,
  );

  assert.deepEqual(items.map((item) => item.key), ['home', 'slot', 'live', 'sport', 'other']);
  assert.equal(items[1]?.category, 'SLOT');
  assert.equal(items[4]?.label, 'custom-category');
});

test('normalizes API category aliases safely', () => {
  assert.equal(normalizeCategory(' Live_Casino '), 'live-casino');
  assert.equal(normalizeCategory('สล็อต'), 'สล็อต');
  assert.equal(normalizeCategory(null), '');
});
