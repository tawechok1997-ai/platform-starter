import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./admin-finance-queue.tsx', import.meta.url), 'utf8');

test('keeps finance queue controls visible while reviewing long queues', () => {
  assert.equal(source.includes('position: \'sticky\''), true);
  assert.equal(source.includes('admin-finance-queue-toolbar'), true);
  assert.equal(source.includes('aria-live="polite"'), true);
});

test('opens finance evidence in the shared accessible drawer', () => {
  assert.equal(source.includes("import { AdminDrawer } from './admin-drawer'"), true);
  assert.equal(source.includes('cursor: \'zoom-in\''), true);
  assert.equal(source.includes('<AdminDrawer open={open}'), true);
  assert.equal(source.includes("maxHeight: '75dvh'"), true);
});
