import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const lock = readFileSync(new URL('./member-document-overlay-lock.ts', import.meta.url), 'utf8');
const detector = readFileSync(new URL('../components/member-render-stability-controller.tsx', import.meta.url), 'utf8');

test('reference-counted scroll lock owns a dedicated attribute', () => {
  assert.match(lock, /html\.dataset\.memberOverlayLock = 'true'/);
  assert.match(lock, /delete html\.dataset\.memberOverlayLock/);
  assert.match(lock, /memberOverlayCount/);
  assert.doesNotMatch(lock, /html\.dataset\.memberOverlayOpen/);
  assert.doesNotMatch(lock, /delete html\.dataset\.memberOverlayOpen/);
});

test('visual overlay detector remains the sole owner of overlay-open state', () => {
  assert.match(detector, /root\.dataset\.memberOverlayOpen = 'true'/);
  assert.match(detector, /delete root\.dataset\.memberOverlayOpen/);
  assert.doesNotMatch(detector, /memberOverlayLock/);
});
