import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const configuredNavigation = readFileSync(new URL('./member-navigation-runtime.ts', import.meta.url), 'utf8');
const fallbackNavigation = readFileSync(new URL('./member-runtime-contract.ts', import.meta.url), 'utf8');
const chrome = readFileSync(new URL('./member-chrome.tsx', import.meta.url), 'utf8');

const canonicalRoutes = {
  casino: '/browse/games?category=casino',
  slot: '/browse/games?category=slot',
  fishing: '/browse/games?category=fishing',
  sport: '/browse/games?category=sport',
  card: '/browse/games?category=card',
  lottery: '/browse/games?category=lottery',
} as const;

test('desktop game categories keep canonical public browse routes', () => {
  for (const [id, href] of Object.entries(canonicalRoutes)) {
    assert.match(configuredNavigation, new RegExp(`${id}: '${href.replace(/[?]/g, '\\?')}'`));
    assert.match(fallbackNavigation, new RegExp(`id: '${id}'[^\n]+href: '${href.replace(/[?]/g, '\\?')}'`));
  }

  assert.match(configuredNavigation, /live: '\/\?category=live#live'/);
  assert.match(configuredNavigation, /canonicalMemberNavigationHref\(id, safeHref\(raw\.href\) \|\| fallback\?\.href \|\| '\/'\)/);
});

test('CMS navigation cannot make public game categories protected or point them back home', () => {
  assert.match(configuredNavigation, /const PUBLIC_GAME_NAVIGATION_IDS = new Set/);
  assert.match(configuredNavigation, /requiresAuth: isPublicGameNavigationId\(id\)\s*\? false/);
  assert.match(configuredNavigation, /sports: 'sport'/);
  assert.match(configuredNavigation, /lotto: 'lottery'/);
  assert.doesNotMatch(configuredNavigation, /const href = safeHref\(raw\.href\) \|\| fallback\?\.href \|\| '\/';/);
});

test('desktop header consumes the normalized runtime navigation', () => {
  assert.match(chrome, /navigation=\{runtime\.navigation\}/);
  assert.match(chrome, /navigation\.filter\(\(item\) => item\.desktop\)/);
  assert.match(chrome, /href=\{item\.href\}/);
  assert.match(chrome, /className="member-desktop-nav member-desktop-nav--guest"/);
});
