import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const pageSource = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
const navSource = readFileSync(new URL('../../admin-nav.ts', import.meta.url), 'utf8');

const sections = ['featured', 'popular', 'online', 'classic'];

test('home game settings manage every game strip and both platforms', () => {
  assert.match(pageSource, /home_game_sections_json/);
  for (const section of sections) assert.match(pageSource, new RegExp(`\\b${section}\\b`));
  assert.match(pageSource, /type PlatformScope = HomePlatform \| 'both'/);
  assert.match(pageSource, /mode: 'hybrid'/);
  assert.match(pageSource, /limitPc/);
  assert.match(pageSource, /limitMobile/);
});

test('home game settings load the catalog and persist through feature settings', () => {
  assert.match(pageSource, /adminApiFetch\('\/admin\/games'\)/);
  assert.match(pageSource, /adminApiFetch\('\/admin\/settings\/features'\)/);
  assert.match(pageSource, /method: 'PUT'/);
  assert.match(pageSource, /JSON\.stringify\(settings, null, 2\)/);
});

test('admin navigation exposes the home game settings workspace', () => {
  assert.match(navSource, /href: '\/game-control\/home-games'/);
  assert.match(navSource, /ตั้งค่าเกมหน้าแรก/);
  assert.match(navSource, /Home game settings/);
  assert.match(navSource, /settings\.features\.view/);
});
