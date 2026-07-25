import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const appRoot = path.resolve(process.cwd(), 'app');
const controller = readFileSync(path.join(appRoot, 'admin-mobile-drawer-controller.tsx'), 'utf8');
const css = readFileSync(path.join(appRoot, 'admin-mobile-drawer-fix.css'), 'utf8');

test('uses one tablet and mobile breakpoint across behavior and presentation', () => {
  assert.equal(controller.includes("const MOBILE_DRAWER_MEDIA = '(max-width: 1099px)'"), true);
  assert.equal(controller.includes('window.matchMedia(MOBILE_DRAWER_MEDIA).matches'), true);
  assert.equal(css.includes('@media (max-width: 1099px)'), true);
  assert.equal(css.includes('@media (min-width: 1100px)'), true);
  assert.equal(css.includes('max-width: 820px'), false);
  assert.equal(css.includes('min-width: 821px'), false);
});

test('keeps the mobile controller aligned with the drawer width', () => {
  assert.equal(css.includes("width: min(340px, calc(100vw - 48px))"), true);
  assert.equal(css.includes('.admin-mobile-drawer-controller__header'), true);
  assert.equal(css.includes('.admin-mobile-drawer-controller__footer'), true);
  assert.equal(css.includes('env(safe-area-inset-top)'), true);
  assert.equal(css.includes('env(safe-area-inset-bottom)'), true);
});

test('preserves touch scrolling and reduced motion behavior', () => {
  assert.equal(css.includes('overscroll-behavior: contain'), true);
  assert.equal(css.includes('-webkit-overflow-scrolling: touch'), true);
  assert.equal(css.includes('@media (prefers-reduced-motion: reduce)'), true);
});

test('validates the loaded mobile admin payload before display', () => {
  assert.equal(controller.includes('if (!cancelled && isMobileAdmin(data)) setAdmin(data)'), true);
  assert.equal(controller.includes('function isMobileAdmin'), true);
});
