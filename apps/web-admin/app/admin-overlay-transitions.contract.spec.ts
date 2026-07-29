import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const layoutSource = readFileSync(new URL('./layout.tsx', import.meta.url), 'utf8');
const transitionSource = readFileSync(new URL('./admin-overlay-transitions.css', import.meta.url), 'utf8');

test('admin root loads the shared overlay transition contract', () => {
  assert.match(layoutSource, /import '\.\/admin-overlay-transitions\.css';/);
});

test('confirm dialogs and drawers use responsive entry transitions', () => {
  assert.match(transitionSource, /\.admin-confirm-layer/);
  assert.match(transitionSource, /\.admin-confirm-dialog/);
  assert.match(transitionSource, /\.admin-drawer-layer/);
  assert.match(transitionSource, /\.admin-drawer/);
  assert.match(transitionSource, /admin-dialog-enter/);
  assert.match(transitionSource, /admin-drawer-enter-right/);
  assert.match(transitionSource, /admin-drawer-enter-bottom/);
});

test('overlay transitions respect reduced-motion preferences', () => {
  assert.match(transitionSource, /prefers-reduced-motion: reduce/);
  assert.match(transitionSource, /animation: none !important/);
});
