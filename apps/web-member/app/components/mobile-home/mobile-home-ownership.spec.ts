import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const memberHome = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const mobileRoot = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');
const mobileMotionRuntime = readFileSync(new URL('./mobile-home-motion-runtime.tsx', import.meta.url), 'utf8');
const mobileRootCss = readFileSync(new URL('./mobile-home-root.module.css', import.meta.url), 'utf8');
const mobileLayoutOwner = readFileSync(new URL('../../member-mobile-home-bottom-owner.css', import.meta.url), 'utf8');
const memberFooter = readFileSync(new URL('../../member-footer.tsx', import.meta.url), 'utf8');
const floatingContact = readFileSync(new URL('../member-floating-contact.tsx', import.meta.url), 'utf8');

test('mobile home has one render owner and one owner for every major section', () => {
  assert.equal((memberHome.match(/<MobileHomeRoot\b/g) ?? []).length, 1);
  assert.match(memberHome, /viewportMode === 'mobile'/);
  assert.equal((mobileRoot.match(/data-ui-owner="mobile-home"/g) ?? []).length, 1);
  for (const owner of ['header', 'hero', 'auth-actions', 'announcement', 'highlight-tabs', 'shortcut', 'footer']) {
    assert.equal((mobileRoot.match(new RegExp(`data-mobile-section-owner="${owner}"`, 'g')) ?? []).length, 1);
  }
  assert.equal((mobileRoot.match(/data-mobile-content-slot="after-highlight"/g) ?? []).length, 1);
  assert.equal((mobileRoot.match(/data-mobile-bottom-owner="true"/g) ?? []).length, 1);
});

test('mobile behavior runtimes do not render duplicate UI owners', () => {
  assert.equal((memberHome.match(/<MobileHomeMotionRuntime\s+contentVersion=/g) ?? []).length, 1);
  assert.match(mobileMotionRuntime, /return null;/);
  assert.doesNotMatch(mobileMotionRuntime, /data-ui-owner=|MutationObserver/);
  assert.doesNotMatch(mobileRoot, /DesktopHomeScaffold|MemberFooter|DesktopAllianceBand|PublicHomeHeader|PublicMobileSourceHeader/);
});

test('auth actions and accessible drawer keep a single mobile owner', () => {
  assert.equal((mobileRoot.match(/function MobileAuthActions\(/g) ?? []).length, 1);
  assert.equal((mobileRoot.match(/<MobileAuthActions layout="page"/g) ?? []).length, 1);
  assert.equal((mobileRoot.match(/<MobileAuthActions layout="drawer"/g) ?? []).length, 1);
  assert.equal((mobileRoot.match(/aria-controls="mobile-home-drawer"/g) ?? []).length, 1);
  assert.equal((mobileRoot.match(/id="mobile-home-drawer"/g) ?? []).length, 1);
  assert.match(mobileLayoutOwner, /#mobile-home-drawer\s*\{[\s\S]*translate3d\(-105%,\s*0,\s*0\)/);
  assert.match(mobileLayoutOwner, /\[aria-hidden='false'\]\s*>\s*#mobile-home-drawer\s*\{[\s\S]*translate3d\(0,\s*0,\s*0\)/);
});

test('mobile CMS media, carousel and announcements stay data driven', () => {
  assert.match(mobileRoot, /cmsResponsiveMediaUrls/);
  assert.match(mobileRoot, /content\.banners\.forEach/);
  assert.match(mobileRoot, /content\.announcements\.forEach/);
  assert.doesNotMatch(mobileRoot, /const HERO_SLIDES/);
  assert.match(mobileRoot, /window\.setInterval/);
  assert.match(mobileMotionRuntime, /addEventListener\('pointerdown'/);
  assert.match(mobileMotionRuntime, /ANNOUNCEMENT_SPEED_PX_PER_SECOND/);
  assert.match(mobileMotionRuntime, /window\.requestAnimationFrame\(tick\)/);
});

test('mobile assets are bundled and bottom content remains attached to the viewport flow', () => {
  assert.match(mobileRoot, /const SOURCE_ROOT = '\/assets\/asset-pc\/images'/);
  assert.doesNotMatch(mobileRoot, /https:\/\/cdn\.zabbet\.com/);
  assert.match(mobileRootCss, /\.root\s*\{[\s\S]*min-height:\s*100dvh/);
  assert.match(mobileRootCss, /\.bottomStructure\s*\{[\s\S]*margin-top:\s*auto/);
  assert.match(mobileLayoutOwner, /#member-desktop-scale-shell[\s\S]*display:\s*block\s*!important/);
});

test('legacy footer and floating tool UI do not duplicate the mobile home surface', () => {
  assert.match(memberFooter, /viewport === 'mobile'[\s\S]*window\.location\.pathname === '\/'[\s\S]*return null/);
  assert.match(floatingContact, /return null/);
  assert.doesNotMatch(floatingContact, /member-floating-contact__contact-stage|MINI_TOOLS|createPortal/);
});
