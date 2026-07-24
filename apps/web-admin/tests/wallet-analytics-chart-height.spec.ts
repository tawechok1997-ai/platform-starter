import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const css = readFileSync(path.join(process.cwd(), 'app/admin-wallet-insights.css'), 'utf8');

test('keeps wallet analytics chart compact on desktop and mobile', () => {
  assert.equal(css.includes('.admin-wallet-analytics__chart {\n  min-height: 190px;'), true);
  assert.equal(css.includes('.admin-wallet-analytics__bar-item {\n  flex: 1 0 34px;\n  height: 145px;'), true);
  assert.equal(css.includes('.admin-wallet-analytics__chart { min-height: 170px; padding-top: 10px; }'), true);
  assert.equal(css.includes('.admin-wallet-analytics__bar-item { height: 125px; }'), true);
  assert.equal(css.includes('min-height: 240px'), false);
  assert.equal(css.includes('height: 190px;\n  display: grid;'), false);
});
