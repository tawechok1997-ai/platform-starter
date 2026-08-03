import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./member-image-fallback-controller.tsx', import.meta.url), 'utf8');

test('global image fallback skips card-owned game artwork', () => {
  assert.match(source, /GAME_ART_OWNER_SELECTOR/);
  assert.match(source, /\.source-highlight-game/);
  assert.match(source, /\.source-popular-card/);
  assert.match(source, /\.source-online-card/);
  assert.match(source, /\.reference-game-tile/);
  assert.match(source, /if \(image\.closest\(GAME_ART_OWNER_SELECTOR\)\) return/);
});

test('global fallback remains available for non-game member imagery', () => {
  assert.match(source, /image\.src = MEMBER_IMAGE_FALLBACK/);
  assert.match(source, /document\.addEventListener\('error', recoverImage, true\)/);
});
