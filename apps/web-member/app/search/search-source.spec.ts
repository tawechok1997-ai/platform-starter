import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const page = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('./search-page.module.css', import.meta.url), 'utf8');

test('authenticated search route owns one source-shaped page', () => {
  assert.equal((page.match(/data-mobile-search-owner="true"/g) ?? []).length, 1);
  assert.match(page, /useRouter\(\)/);
  assert.match(page, /router\.back\(\)/);
  assert.match(page, /type SearchTab = 'search' \| 'recent' \| 'favorite' \| 'hot' \| 'new'/);
  assert.match(page, /ประวัติการค้นหา/);
  assert.match(page, /เกมใหม่/);
});

test('search reads the central catalog and resolves CDN media through local assets first', () => {
  assert.match(page, /memberApiFetch\(`\/games\/catalog\?\$\{params\.toString\(\)\}`/);
  assert.match(page, /platform:\s*'mobile'/);
  assert.match(page, /resolveLocalAssetByBasename\(source, 'mobile'\)/);
  assert.match(page, /resolveLocalAssetByBasename\(source, 'pc'\)/);
  assert.doesNotMatch(page, /REFERENCE_GAMES|BROWSE_GAMES|FALLBACK_GAMES/);
});

test('search keeps source mobile geometry and expands without desktop duplication', () => {
  assert.match(styles, /\.header\s*\{[\s\S]*height:\s*50px/);
  assert.match(styles, /\.tabs\s*\{[\s\S]*overflow-x:\s*auto/);
  assert.match(styles, /\.searchBlock input\s*\{[\s\S]*height:\s*32px/);
  assert.match(styles, /grid-template-columns:\s*repeat\(4/);
  assert.match(styles, /aspect-ratio:\s*5 \/ 7/);
  assert.match(styles, /@media \(min-width:\s*560px\)/);
  assert.match(styles, /@media \(min-width:\s*760px\)/);
});
