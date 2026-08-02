import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./resolve-exact-asset.ts', import.meta.url), 'utf8');

test('exact asset resolution uses the generated index instead of runtime filesystem access', () => {
  assert.match(source, /LOCAL_ASSET_PATHS_BY_BASENAME/);
  assert.match(source, /\.\.\/\.\.\/generated\/local-asset-basename-map/);
  assert.doesNotMatch(source, /from ['"]node:fs['"]/);
  assert.doesNotMatch(source, /from ['"]node:path['"]/);
  assert.doesNotMatch(source, /readdirSync|statSync/);
});

test('exact asset resolution preserves deterministic suffix matching', () => {
  assert.match(source, /suffixScore\(right\.segments, sourceSegments\)/);
  assert.match(source, /left\.publicPath\.localeCompare\(right\.publicPath\)/);
  assert.match(source, /return normalized/);
});
