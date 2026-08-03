import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const feedSource = readFileSync(new URL('./member-source-feed-sections.tsx', import.meta.url), 'utf8');
const homeSource = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');

test('desktop popular and online feeds use shared React home data', () => {
  assert.ok(feedSource.includes('export function DesktopGameFeedProvider'));
  assert.ok(feedSource.includes('useContext(DesktopGameFeedContext)'));
  assert.ok(homeSource.includes('<DesktopGameFeedProvider popular={data.popular} online={data.onlineGames}>'));
});

test('desktop feed components do not fetch or randomize a second catalog', () => {
  assert.equal(feedSource.includes('getMemberGameCatalog'), false);
  assert.equal(feedSource.includes('randomizeGameCatalog'), false);
  assert.equal(feedSource.includes('MutationObserver'), false);
});

test('game cards own their image fallback and matching launch link', () => {
  assert.ok(feedSource.includes('href={gameHref(item)}'));
  assert.ok(feedSource.includes('data-no-fallback="true"'));
  assert.ok(feedSource.includes('data-game-card="popular"'));
  assert.ok(feedSource.includes('data-game-card="online"'));
});
