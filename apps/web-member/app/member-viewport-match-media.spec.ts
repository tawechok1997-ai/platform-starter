import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const bootstrap = readFileSync(
  new URL('./components/public-desktop-viewport-bootstrap.tsx', import.meta.url),
  'utf8',
);
const owner = readFileSync(
  new URL('./components/public-desktop-viewport-bootstrap-owner.tsx', import.meta.url),
  'utf8',
);

test('desktop media virtualization never owns a mobile-width viewport', () => {
  assert.match(bootstrap, /const MOBILE_LAYOUT_MAX_WIDTH = 900/);
  assert.match(bootstrap, /document\.documentElement\.clientWidth \|\| window\.innerWidth/);
  assert.match(bootstrap, /viewportWidth <= MOBILE_LAYOUT_MAX_WIDTH/);
  assert.match(bootstrap, /pathname\.startsWith\('\/mobile\/'\)/);
});

test('desktop media virtualization is restored when the desktop owner unmounts', () => {
  assert.match(bootstrap, /function uninstallVirtualMatchMedia\(\)/);
  assert.match(bootstrap, /window\.matchMedia = nativeMatchMedia/);
  assert.match(bootstrap, /restoreCanvas\(\);\s*uninstallVirtualMatchMedia\(\);/);
  assert.match(owner, /return viewportMode === 'desktop' \? <PublicDesktopViewportBootstrap \/> : null/);
});
