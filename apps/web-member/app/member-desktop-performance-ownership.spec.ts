import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const memberHome = readFileSync(new URL('./member-home.tsx', import.meta.url), 'utf8');
const homeRuntime = readFileSync(new URL('./components/member-home-runtime-controller.tsx', import.meta.url), 'utf8');
const dragScroll = readFileSync(new URL('./components/member-drag-scroll-controller.tsx', import.meta.url), 'utf8');
const sidebar = readFileSync(new URL('./components/member-home/home-sidebar-scroll-controller.tsx', import.meta.url), 'utf8');
const sidebarLayout = readFileSync(new URL('./member-home-sticky-sidebar-final.css', import.meta.url), 'utf8');
const responsiveLayout = readFileSync(new URL('./member-desktop-responsive-polish.css', import.meta.url), 'utf8');

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

test('fixed sidebar geometry cannot observe and mutate the same placeholder', () => {
  assert.match(sidebar, /resizeObserver\.observe\(body\)/);
  assert.doesNotMatch(sidebar, /resizeObserver\.observe\(placeholder\)/);
  assert.doesNotMatch(sidebar, /placeholder\.style\.width/);
});

test('desktop home reserves the left sidebar column and keeps the main feed on the right', () => {
  assert.match(sidebarLayout, /grid-template-columns:\s*360px\s+minmax\(0,\s*1080px\)/);
  assert.match(sidebarLayout, /reference-main-column[\s\S]*?grid-column:\s*2\s*!important/);
  assert.match(sidebarLayout, /data-desktop-sidebar-placeholder='true'[\s\S]*?grid-column:\s*1\s*!important/);
  assert.match(sidebarLayout, /reference-sidebar[\s\S]*?grid-column:\s*1\s*!important/);
  assert.match(responsiveLayout, /grid-template-columns:\s*310px\s+minmax\(0,\s*1fr\)/);
  assert.match(responsiveLayout, /grid-template-columns:\s*330px\s+minmax\(0,\s*1fr\)/);
});