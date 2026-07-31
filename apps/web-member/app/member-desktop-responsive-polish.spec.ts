import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const responsiveCss = readFileSync(new URL('./member-desktop-responsive-polish.css', import.meta.url), 'utf8');
const viewportHeightCss = readFileSync(new URL('./member-desktop-viewport-height.css', import.meta.url), 'utf8');
const ownerCss = readFileSync(new URL('./member-desktop-runtime-owner.css', import.meta.url), 'utf8');

test('desktop responsive polish uses the physical shell width instead of another viewport media patch', () => {
  assert.match(responsiveCss, /container-name:\s*member-desktop-viewport/);
  assert.match(responsiveCss, /container-type:\s*inline-size/);
  assert.match(responsiveCss, /@container member-desktop-viewport \(max-width: 1179px\)/);
  assert.match(responsiveCss, /@container member-desktop-viewport \(min-width: 1180px\) and \(max-width: 1439px\)/);
});

test('desktop responsive polish keeps narrow navigation and sidebar overflow discoverable', () => {
  assert.match(responsiveCss, /member-desktop-nav--guest[\s\S]*overflow-x:\s*auto !important/);
  assert.match(responsiveCss, /reference-sidebar[\s\S]*scrollbar-width:\s*thin !important/);
  assert.match(responsiveCss, /scrollbar-gutter:\s*stable !important/);
});

test('desktop sidebar height uses the unscaled visual viewport contract', () => {
  assert.match(viewportHeightCss, /--member-desktop-viewport-height/);
  assert.doesNotMatch(viewportHeightCss, /max-height:\s*calc\(100dvh/);
});

test('desktop responsive polish remains under the canonical late-loading owner', () => {
  const stickyImport = ownerCss.indexOf("@import './member-home-sticky-sidebar-final.css';");
  const responsiveImport = ownerCss.indexOf("@import './member-desktop-responsive-polish.css';");
  const viewportImport = ownerCss.indexOf("@import './member-desktop-viewport-height.css';");

  assert.ok(responsiveImport > stickyImport);
  assert.ok(viewportImport > responsiveImport);
});
