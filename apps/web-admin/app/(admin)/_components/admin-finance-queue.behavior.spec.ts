import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./admin-finance-queue.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('./admin-finance-queue.module.css', import.meta.url), 'utf8');

test('keeps finance queue controls visible while reviewing long queues', () => {
  assert.equal(source.includes('admin-finance-queue.module.css'), true);
  assert.equal(source.includes('className={styles.toolbar}'), true);
  assert.equal(source.includes('aria-live="polite"'), true);
  assert.match(styles, /\.toolbar\s*\{[^}]*position:\s*sticky;/s);
});

test('opens finance evidence in the shared accessible drawer', () => {
  assert.equal(source.includes("import { AdminDrawer } from './admin-drawer'"), true);
  assert.equal(source.includes('<AdminDrawer open={open}'), true);
  assert.equal(source.includes('className={styles.evidenceCanvas}'), true);
  assert.equal(source.includes('className={styles.evidenceImage}'), true);
  assert.match(styles, /\.evidenceTrigger\s*\{[^}]*cursor:\s*zoom-in;/s);
  assert.match(styles, /\.evidenceImage\s*\{[^}]*max-height:\s*75dvh;/s);
});
