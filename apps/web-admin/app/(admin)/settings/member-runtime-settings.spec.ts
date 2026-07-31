import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const featuresSource = readFileSync(new URL('./features/page.tsx', import.meta.url), 'utf8');
const themeSource = readFileSync(new URL('./theme/page.tsx', import.meta.url), 'utf8');
const iconSource = readFileSync(new URL('./icons/icon-settings-config.ts', import.meta.url), 'utf8');

test('features settings own shared desktop and mobile visibility', () => {
  for (const key of [
    'hero_enabled',
    'announcement_enabled',
    'tournament_enabled',
    'jackpot_enabled',
    'leaderboard_enabled',
    'mini_games_enabled',
    'popular_games_enabled',
    'online_games_enabled',
    'live_games_enabled',
    'classic_games_enabled',
    'usage_guide_enabled',
  ]) assert.match(featuresSource, new RegExp(key));
});

test('features settings expose structured runtime data from one location', () => {
  assert.match(featuresSource, /navigation_items_json/);
  assert.match(featuresSource, /tournament_items_json/);
  assert.match(featuresSource, /leaderboard_items_json/);
  assert.match(featuresSource, /mini_games_json/);
  assert.match(featuresSource, /defaults=\{FEATURES_DEFAULTS\}/);
});

test('tournament settings keep demo data explicit outside production', () => {
  assert.match(featuresSource, /DESKTOP_TOURNAMENT_MOCK_DEFAULTS/);
  assert.match(featuresSource, /TOURNAMENT_ITEMS_DEFAULT/);
  assert.match(featuresSource, /NEXT_PUBLIC_ENABLE_DEMO_TOURNAMENT_DATA/);
  assert.match(featuresSource, /process\.env\.NODE_ENV === 'production'/);
  assert.match(featuresSource, /กำลังแข่งขัน · ข้อมูลตัวอย่าง/);
  assert.match(featuresSource, /football-royale-2/);
  assert.match(featuresSource, /tournament_items_json: TOURNAMENT_ITEMS_DEFAULT/);
  assert.match(featuresSource, /Mobile ใช้ชุดเดียวกัน/);
});

test('theme settings expose common responsive design tokens', () => {
  for (const key of [
    'card_radius',
    'control_radius',
    'modal_radius',
    'section_gap_desktop',
    'section_gap_mobile',
    'card_gap_desktop',
    'card_gap_mobile',
  ]) assert.match(themeSource, new RegExp(key));
  assert.match(themeSource, /defaults=\{THEME_DEFAULTS\}/);
});

test('icon settings expose shared home and navigation icons', () => {
  for (const key of [
    'casino', 'slot', 'fishing', 'sport', 'card', 'lottery', 'live',
    'announcement', 'activity', 'news', 'tournament', 'jackpot',
    'leaderboard', 'mini_game', 'popular_games', 'online_games',
    'classic_games', 'contact', 'close',
  ]) assert.match(iconSource, new RegExp(`key: '${key}'`));
});
