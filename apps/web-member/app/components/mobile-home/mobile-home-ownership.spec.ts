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

test('mobile home has exactly one render owner', () => {
  assert.equal((memberHome.match(/<MobileHomeRoot\b/g) ?? []).length, 1);
  assert.match(memberHome, /viewportMode === 'mobile'/);
  assert.match(memberHome, /content=\{props\.cmsContent\}/);
  assert.match(memberHome, /showPromotion=\{props\.showPromotion\}/);
  assert.equal((mobileRoot.match(/data-ui-owner="mobile-home"/g) ?? []).length, 1);
});

test('mobile motion runtime adds behavior without rendering another UI owner', () => {
  assert.equal((memberHome.match(/<MobileHomeMotionRuntime\s*\/>/g) ?? []).length, 1);
  assert.match(mobileMotionRuntime, /return null;/);
  assert.doesNotMatch(mobileMotionRuntime, /data-ui-owner=/);
  assert.doesNotMatch(mobileMotionRuntime, /MutationObserver/);
});

test('mobile upper structure has one owner per section', () => {
  for (const owner of ['header', 'hero', 'announcement', 'highlight-tabs']) {
    assert.equal(
      (mobileRoot.match(new RegExp(`data-mobile-section-owner="${owner}"`, 'g')) ?? []).length,
      1,
      `${owner} must have one Mobile owner`,
    );
  }

  assert.equal((mobileRoot.match(/id="mobile-home-drawer"/g) ?? []).length, 1);
  assert.equal((mobileRoot.match(/data-mobile-content-slot="after-highlight"/g) ?? []).length, 1);
});

test('hamburger button controls one accessible drawer that slides from the left', () => {
  assert.equal((mobileRoot.match(/aria-controls="mobile-home-drawer"/g) ?? []).length, 1);
  assert.equal((mobileRoot.match(/id="mobile-home-drawer"/g) ?? []).length, 1);
  assert.equal((mobileRoot.match(/data-mobile-drawer-dismiss="true"/g) ?? []).length, 1);
  assert.match(mobileRoot, /<button[\s\S]*data-mobile-drawer-dismiss="true"/);
  assert.match(mobileLayoutOwner, /#mobile-home-drawer\s*\{[\s\S]*width:\s*min\(340px/);
  assert.match(mobileLayoutOwner, /#mobile-home-drawer\s*\{[\s\S]*translate3d\(-105%,\s*0,\s*0\)/);
  assert.match(mobileLayoutOwner, /\[aria-hidden='false'\]\s*>\s*#mobile-home-drawer\s*\{[\s\S]*translate3d\(0,\s*0,\s*0\)/);
});

test('mobile UI images use bundled assets instead of hardcoded CDN URLs', () => {
  assert.match(mobileRoot, /const SOURCE_ROOT = '\/assets\/asset-pc\/images'/);
  assert.match(mobileRoot, /const LOBBY_ASSET_ROOT = `\$\{SOURCE_ROOT\}\/FEZX\/lobby_settings`/);
  assert.match(mobileRoot, /ANNOUNCEMENT_ICON_URL = `\$\{SOURCE_ROOT\}\/home\/coin\.webp`/);
  assert.doesNotMatch(mobileRoot, /https:\/\/cdn\.zabbet\.com/);
});

test('mobile promotions come from central CMS content and stay unique', () => {
  assert.match(mobileRoot, /cmsResponsiveMediaUrls/);
  assert.match(mobileRoot, /content\.banners\.forEach/);
  assert.match(mobileRoot, /media\.mobile \|\| media\.desktop \|\| media\.legacy/);
  assert.match(mobileRoot, /seenImages\.has\(image\)/);
  assert.match(mobileRoot, /heroSlides\.map\(\(slide, index\) =>/);
  assert.doesNotMatch(mobileRoot, /const HERO_SLIDES/);
});

test('mobile promotion carousel auto advances and supports real swipe gestures', () => {
  assert.match(mobileRoot, /window\.setInterval/);
  assert.match(mobileRoot, /\(current \+ 1\) % heroSlides\.length/);
  assert.match(mobileMotionRuntime, /addEventListener\('pointerdown'/);
  assert.match(mobileMotionRuntime, /addEventListener\('pointermove'/);
  assert.match(mobileMotionRuntime, /addEventListener\('pointerup'/);
  assert.match(mobileMotionRuntime, /dots\[nextIndex\]\?\.click\(\)/);
  assert.match(mobileMotionRuntime, /translate3d\(calc\(-\$\{currentIndex \* 100\}%/);
});

test('mobile announcements come from central CMS and scroll continuously at runtime', () => {
  assert.match(mobileRoot, /content\.announcements\.forEach/);
  assert.match(mobileRoot, /seenMessages\.has\(message\)/);
  assert.equal((mobileRoot.match(/data-mobile-announcement-track="true"/g) ?? []).length, 1);
  assert.match(mobileMotionRuntime, /ANNOUNCEMENT_SPEED_PX_PER_SECOND/);
  assert.match(mobileMotionRuntime, /viewport\.scrollLeft \+=/);
  assert.match(mobileMotionRuntime, /window\.requestAnimationFrame\(tick\)/);
  assert.match(mobileMotionRuntime, /viewport\.scrollLeft -= loopWidth/);
  assert.match(mobileMotionRuntime, /new ResizeObserver\(syncSetWidths\)/);
});

test('mobile bottom structure has one shortcut and one footer owner', () => {
  assert.equal((mobileRoot.match(/data-mobile-bottom-owner="true"/g) ?? []).length, 1);

  for (const owner of ['shortcut', 'footer']) {
    assert.equal(
      (mobileRoot.match(new RegExp(`data-mobile-section-owner="${owner}"`, 'g')) ?? []).length,
      1,
      `${owner} must have one Mobile owner`,
    );
  }

  assert.equal((mobileRoot.match(/<footer\s/g) ?? []).length, 1);
  assert.match(mobileRoot, /const BANKS = \[/);
  assert.match(mobileRoot, /Copyright © NOAH345, All Rights Reserved\./);
});

test('mobile home owner does not import desktop or legacy UI', () => {
  assert.doesNotMatch(mobileRoot, /DesktopHomeScaffold/);
  assert.doesNotMatch(mobileRoot, /MemberFooter/);
  assert.doesNotMatch(mobileRoot, /DesktopAllianceBand/);
  assert.doesNotMatch(mobileRoot, /PublicHomeHeader/);
  assert.doesNotMatch(mobileRoot, /PublicMobileSourceHeader/);
  assert.doesNotMatch(mobileRoot, /MutationObserver/);
});

test('mobile geometry preserves the supplied upper structure', () => {
  assert.match(mobileRootCss, /height:\s*60px/);
  assert.match(mobileRootCss, /max-width:\s*640px/);
  assert.match(mobileRootCss, /padding-bottom:\s*41\.6%/);
  assert.match(mobileRootCss, /grid-template-columns:\s*repeat\(4/);
});

test('mobile bottom structure stays attached to the page bottom', () => {
  assert.match(mobileRootCss, /\.root\s*\{[\s\S]*display:\s*flex/);
  assert.match(mobileRootCss, /\.root\s*\{[\s\S]*min-height:\s*100dvh/);
  assert.match(mobileRootCss, /\.bottomStructure\s*\{[\s\S]*margin-top:\s*auto/);
  assert.match(mobileRootCss, /\.mobileFooter\s*\{[\s\S]*margin:\s*0/);
  assert.match(mobileRootCss, /\.shortcutCard\s*\{[\s\S]*height:\s*134px/);
});

test('final layout owner exposes the Mobile root instead of hiding the shell', () => {
  assert.match(mobileLayoutOwner, /#member-desktop-scale-shell/);
  assert.match(mobileLayoutOwner, /display:\s*block\s*!important/);
  assert.doesNotMatch(
    mobileLayoutOwner,
    /#member-desktop-scale-shell[\s\S]{0,160}display:\s*none\s*!important/,
  );
});

test('legacy shared UI stays out of the mobile home route', () => {
  assert.match(memberFooter, /viewport === 'mobile'[\s\S]*window\.location\.pathname === '\/'[\s\S]*return null/);
  assert.match(floatingContact, /pathname === '\/' && isMobile !== false[\s\S]*return null/);
});
