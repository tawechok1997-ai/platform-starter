import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const memberHome = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const mobileRoot = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');
const mobileRootCss = readFileSync(new URL('./mobile-home-root.module.css', import.meta.url), 'utf8');
const mobileLayoutOwner = readFileSync(new URL('../../member-mobile-home-bottom-owner.css', import.meta.url), 'utf8');
const memberFooter = readFileSync(new URL('../../member-footer.tsx', import.meta.url), 'utf8');
const floatingContact = readFileSync(new URL('../member-floating-contact.tsx', import.meta.url), 'utf8');

test('mobile home has exactly one render owner', () => {
  assert.equal((memberHome.match(/<MobileHomeRoot\s*\/>/g) ?? []).length, 1);
  assert.match(memberHome, /viewportMode === 'mobile'/);
  assert.equal((mobileRoot.match(/data-ui-owner="mobile-home"/g) ?? []).length, 1);
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

test('hamburger button controls one drawer that slides from the left', () => {
  assert.equal((mobileRoot.match(/aria-controls="mobile-home-drawer"/g) ?? []).length, 1);
  assert.equal((mobileRoot.match(/id="mobile-home-drawer"/g) ?? []).length, 1);
  assert.match(mobileLayoutOwner, /#mobile-home-drawer\s*\{[\s\S]*width:\s*min\(340px/);
  assert.match(mobileLayoutOwner, /#mobile-home-drawer\s*\{[\s\S]*translate3d\(-105%,\s*0,\s*0\)/);
  assert.match(mobileLayoutOwner, /\[aria-hidden='false'\]\s*>\s*#mobile-home-drawer\s*\{[\s\S]*translate3d\(0,\s*0,\s*0\)/);
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

test('mobile hero is one carousel owner with unique source slides', () => {
  assert.equal((mobileRoot.match(/className=\{styles\.hero\}/g) ?? []).length, 1);
  assert.match(mobileRoot, /const HERO_SLIDES = \[/);
  assert.match(mobileRoot, /HERO_SLIDES\.map\(\(image, index\) =>/);
  assert.match(mobileRoot, /translateX\(-\$\{activeSlide \* 100\}%\)/);
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
