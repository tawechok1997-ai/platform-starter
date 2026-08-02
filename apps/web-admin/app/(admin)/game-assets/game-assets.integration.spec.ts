import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');

test('game asset workspace separates shared and platform-specific sources', () => {
  assert.match(page, /type PlatformScope = 'shared' \| 'pc' \| 'mobile'/);
  assert.match(page, /Mobile Override/);
  assert.match(page, /PC Override/);
  assert.match(page, /ใช้ร่วมกัน/);
});

test('game and provider assets are persisted through presentation metadata', () => {
  assert.match(page, /metadata\.presentation|currentMetadata\.presentation/);
  assert.match(page, /\/admin\/game-providers\/\$\{selection\.item\.id\}/);
  assert.match(page, /\/admin\/games\/\$\{selection\.item\.id\}/);
});

test('provider and game editors remain separate owners', () => {
  assert.match(page, /ProviderEditor/);
  assert.match(page, /GameEditor/);
  assert.match(page, /รูปเกมและรูปค่ายกลาง/);
});
