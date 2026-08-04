import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const memberHome = readFileSync(new URL('./member-home.tsx', import.meta.url), 'utf8');
const homeRuntime = readFileSync(new URL('./components/member-home-runtime-controller.tsx', import.meta.url), 'utf8');
const dragScroll = readFileSync(new URL('./components/member-drag-scroll-controller.tsx', import.meta.url), 'utf8');
const sidebar = readFileSync(new URL('./components/member-home/home-sidebar-scroll-controller.tsx', import.meta.url), 'utf8');

test('desktop hydration never mounts the complete mobile home first', () => {
  assert.match(memberHome, /useState<ViewportMode \| null>\(null\)/);
  assert.match(memberHome, /data-member-home-viewport-pending="true"/);
  assert.doesNotMatch(memberHome, /useState<ViewportMode>\('mobile'\)/);
});

test('desktop runtime observes only structural changes inside desktop home', () => {
  assert.match(homeRuntime, /const DESKTOP_HOME_SELECTOR = '\.desktop-reference-home'/);
  assert.match(homeRuntime, /observer\.observe\(host, \{ childList: true, subtree: true \}\)/);
  assert.doesNotMatch(homeRuntime, /observer\.observe\(document\.body/);
  assert.doesNotMatch(homeRuntime, /characterData:\s*true/);
});

test('drag scroll resolves one interacted rail without scanning the desktop canvas', () => {
  assert.match(dragScroll, /function findHorizontalRail/);
  assert.doesNotMatch(dragScroll, /querySelectorAll<HTMLElement>\('\*'\)/);
  assert.doesNotMatch(dragScroll, /new MutationObserver/);
});

test('jackpot follower stays scoped to its home grid and throttles scroll work', () => {
  assert.match(sidebar, /setProperty\('position', 'absolute'/);
  assert.match(sidebar, /setProperty\('right', '0px'/);
  assert.match(sidebar, /setProperty\('z-index', '20'/);
  assert.match(sidebar, /window\.requestAnimationFrame\(syncGeometry\)/);
  assert.match(sidebar, /resizeObserver\.observe\(body\)/);
  assert.match(sidebar, /window\.addEventListener\('scroll', scheduleGeometry/);
  assert.doesNotMatch(sidebar, /resizeObserver\.observe\(sidebar\)/);
  assert.doesNotMatch(sidebar, /placeholder/);
  assert.doesNotMatch(sidebar, /setProperty\('position', 'fixed'/);
});
