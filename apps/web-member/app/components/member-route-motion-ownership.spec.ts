import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const navigation = readFileSync(new URL('./member-client-navigation-controller.tsx', import.meta.url), 'utf8');
const auth = readFileSync(new URL('./member-navigation-auth-controller.tsx', import.meta.url), 'utf8');

test('game actions never start route leave motion', () => {
  assert.match(navigation, /const GAME_ACTION_SELECTOR/);
  assert.match(navigation, /\.source-highlight-game/);
  assert.match(navigation, /\.source-popular-card/);
  assert.match(navigation, /\.source-online-card/);
  assert.match(navigation, /if \(link\.closest\(GAME_ACTION_SELECTOR\)\) return false/);
});

test('opening auth cancels any earlier protected-link leave motion', () => {
  assert.match(auth, /document\.documentElement\.dataset\.memberRouteMotion = 'idle'/);
  assert.match(auth, /router\.replace\(`/);
  assert.ok(
    auth.indexOf("document.documentElement.dataset.memberRouteMotion = 'idle'")
      < auth.indexOf('router.replace(`${url.pathname}${url.search}${url.hash}`'),
  );
});
