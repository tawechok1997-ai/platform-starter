import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./resolve-exact-asset.ts', import.meta.url), 'utf8');

test('exact asset resolution delegates to the shared local asset boundary', () => {
  assert.match(source, /import \{ resolveLocalAssetOrSource \}/);
  assert.match(source, /resolveLocalAssetOrSource\(source, 'pc'\)/);
});

test('exact asset resolution never scans the runtime filesystem', () => {
  assert.doesNotMatch(source, /from ['"]node:fs['"]/);
  assert.doesNotMatch(source, /from ['"]node:path['"]/);
  assert.doesNotMatch(source, /readdirSync|statSync/);
});
