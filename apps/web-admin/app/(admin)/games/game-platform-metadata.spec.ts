import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import test from 'node:test';

const source = readFileSync(resolve(process.cwd(), 'app/(admin)/games/page.tsx'), 'utf8');

test('Admin game catalog owns PC/Mobile/Both metadata and tags', () => {
  assert.match(source, /type GamePlatform = 'both' \| 'pc' \| 'mobile'/);
  assert.match(source, /platform: form\.platform/);
  assert.match(source, /tags: parseTags\(form\.tags\)/);
  assert.match(source, /แพลตฟอร์ม<select/);
  assert.match(source, /แท็ก<input/);
  assert.match(source, /ทุกแพลตฟอร์ม/);
});

test('editing a game preserves existing metadata before platform/tag writes', () => {
  assert.match(source, /\.\.\.record\(existing\?\.metadata\)/);
  assert.match(source, /platform: gamePlatform\(item\)/);
  assert.match(source, /tags: gameTags\(item\)\.join\(', '\)/);
});

test('platform filter treats both as visible on PC and Mobile', () => {
  assert.match(source, /itemPlatform === platformFilter \|\| itemPlatform === 'both'/);
});
