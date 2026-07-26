import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const source = fs.readFileSync(path.join(process.cwd(), 'app/(admin)/wallet-analytics/page.tsx'), 'utf8');

test('wallet analytics keeps required ranges and chart states', () => {
  assert.match(source, /\[7,14,30,90\]/);
  assert.match(source, /admin-wallet-analytics__chart/);
  assert.match(source, /ยังไม่มีข้อมูล Wallet Analytics/);
});

test('wallet analytics keeps an accessible legend and per-bar details', () => {
  assert.match(source, /admin-wallet-analytics__legend/);
  assert.match(source, /aria-label=\{tooltip\}/);
  assert.match(source, /tabIndex=\{0\}/);
});
