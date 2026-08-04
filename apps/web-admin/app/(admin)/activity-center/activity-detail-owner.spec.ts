import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8');

test('activity details use the shared AdminDrawer owner', () => {
  assert.match(source, /AdminDrawer/);
  assert.match(source, /open=\{Boolean\(selected\)\}/);
  assert.match(source, /onClose=\{\(\) => setSelected\(null\)\}/);
  assert.equal(source.includes('admin-activity-drawer-layer'), false);
  assert.equal(source.includes('<aside className="admin-activity-drawer"'), false);
});

test('shared drawer keeps related navigation and localized metadata', () => {
  assert.match(source, /selected\.href \? <AdminLinkButton/);
  assert.match(source, /new Date\(selected\.createdAt\)\.toLocaleString\(dateLocale\)/);
  assert.match(source, /selected\.kind === 'ledger'/);
});
