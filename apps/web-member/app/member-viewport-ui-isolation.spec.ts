import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const memberHome = readFileSync(new URL('./member-home.tsx', import.meta.url), 'utf8');
const layout = readFileSync(new URL('./layout.tsx', import.meta.url), 'utf8');
const mobileHome = readFileSync(new URL('./components/mobile-home/mobile-home-root.tsx', import.meta.url), 'utf8');
const desktopHome = readFileSync(new URL('./components/member-home/desktop-home-scaffold.tsx', import.meta.url), 'utf8');
const mobilePopupRuntime = readFileSync(
  new URL('./components/mobile-home/mobile-member-popup-runtime.tsx', import.meta.url),
  'utf8',
);
const isolationCss = readFileSync(new URL('./member-viewport-ui-isolation.css', import.meta.url), 'utf8');

test('home mounts one viewport UI tree instead of hiding two rendered trees', () => {
  assert.match(memberHome, /if \(viewportMode === 'mobile'\) \{/);
  assert.match(memberHome, /<MobileHomeRoot\s/);
  assert.match(memberHome, /return <DesktopMemberHome \{\.\.\.props\} \/>/);
  assert.equal((memberHome.match(/<DesktopMemberHome/g) ?? []).length, 1);
  assert.equal((memberHome.match(/<MobileHomeRoot/g) ?? []).length, 1);
});

test('mobile and desktop roots retain their current visual owners', () => {
  assert.match(mobileHome, /data-mobile-home-root="true"/);
  assert.match(mobileHome, /data-ui-owner="mobile-home"/);
  assert.match(desktopHome, /className="desktop-home desktop-reference-home"/);
});

test('mobile portal owners are explicitly tagged and remain mobile-only', () => {
  assert.match(mobilePopupRuntime, /data-ui-owner="mobile-popup"/);
  assert.match(mobilePopupRuntime, /data-ui-owner="mobile-video-popup"/);
  assert.match(mobilePopupRuntime, /data-ui-owner="mobile-navigation"/);
  assert.match(mobilePopupRuntime, /data-mobile-member-bottom-navigation="true"/);
  assert.match(mobilePopupRuntime, /<canvas/);
  assert.match(mobilePopupRuntime, /width=\{BOTTOM_NAV_CANVAS_SIZE\}/);
  assert.match(mobilePopupRuntime, /height=\{BOTTOM_NAV_CANVAS_SIZE\}/);
  assert.match(mobilePopupRuntime, /data-bottom-navigation-canvas=\{kind\}/);
  assert.match(mobilePopupRuntime, /<BottomNavigationCanvasIcon src=\{item\.icon\} kind=\{item\.kind\} \/>/);
  assert.match(mobilePopupRuntime, /MENU_ICON_BASE_PATH/);
  assert.match(mobilePopupRuntime, /CONTACT_ICON_BASE_PATHS/);
  assert.match(mobilePopupRuntime, /context\.fill\(new Path2D\(path\)\)/);
  assert.match(mobilePopupRuntime, /\{ label: 'เมนู', kind: 'menu' \}/);
  assert.match(mobilePopupRuntime, /icon: '\/assets\/reference-brand\/menu\/deposit\.png'/);
  assert.match(mobilePopupRuntime, /icon: '\/assets\/reference-brand\/menu\/withdraw\.png'/);
  assert.match(mobilePopupRuntime, /\{ label: 'ติดต่อ', kind: 'contact' \}/);
  assert.doesNotMatch(mobilePopupRuntime, /icon: '\/assets\/reference-brand\/menu\/(?:home|support)\.png'/);
  assert.doesNotMatch(mobilePopupRuntime, /icon: '\/assets\/asset-pc\/images\/(?:เมนู|ฝาก|ถอน|line)\.png'/);
  assert.doesNotMatch(mobilePopupRuntime, /icon: '\/images\/(?:ฝาก|ถอน|line)\.png'/);
  assert.match(mobilePopupRuntime, /if \(!isMobile \|\| !summary\.isLoggedIn/);
});

test('the last layout stylesheet keeps viewport isolation geometry-free', () => {
  const isolationImport = "import './member-viewport-ui-isolation.css';";
  assert.match(layout, /import '\.\/member-viewport-ui-isolation\.css';/);
  assert.equal(layout.lastIndexOf(isolationImport) > layout.lastIndexOf("import './member-mobile-home-bottom-owner.css';"), true);
  assert.match(isolationCss, /html\[data-member-viewport-mode='mobile'\]/);
  assert.match(isolationCss, /html\[data-member-viewport-mode='desktop'\]/);
  assert.match(isolationCss, /\[data-ui-owner='mobile-popup'\]/);
  const popupCenteringMarker = '/* Keep every current Mobile popup';
  const markerIndex = isolationCss.indexOf(popupCenteringMarker);
  assert.ok(markerIndex >= 0);
  const viewportRules = isolationCss.slice(0, markerIndex).replace(/\/\*[\s\S]*?\*\//g, '');
  assert.doesNotMatch(viewportRules, /(?:width|height|margin|padding|font-size|background)\s*:/);
});
