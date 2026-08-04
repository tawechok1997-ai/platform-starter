import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

const root = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./mobile-home-root.module.css', import.meta.url), 'utf8');
const contentOwner = readFileSync(new URL('./mobile-highlight-tab-content.tsx', import.meta.url), 'utf8');
const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../../layout.tsx', import.meta.url), 'utf8');
const layoutOwner = readFileSync(new URL('../../member-mobile-home-bottom-owner.css', import.meta.url), 'utf8');
const followOwner = readFileSync(new URL('../../member-mobile-category-follow.css', import.meta.url), 'utf8');
const foundationOwner = readFileSync(new URL('../../member-mobile-p1-p3-foundation.css', import.meta.url), 'utf8');
const duplicateRuntime = new URL('./mobile-category-tab-runtime.tsx', import.meta.url);

function cssRule(source: string, selector: RegExp): string {
  return source.match(new RegExp(`${selector.source}\\s*\\{([^}]*)\\}`))?.[1] ?? '';
}

test('mobile category rail has one rendered owner and reads central navigation', () => {
  assert.equal((root.match(/data-mobile-section-owner="category-menu"/g) ?? []).length, 1);
  assert.match(root, /useMemberRuntime\(\)/);
  assert.match(root, /navigation\.find\(\(candidate\) => candidate\.id === id && candidate\.mobile\)/);
  assert.doesNotMatch(root, /<canvas\b/);
});

test('mobile category rail keeps the supplied order and labels', () => {
  assert.match(root, /'home',[\s\S]*'casino',[\s\S]*'slot',[\s\S]*'fishing',[\s\S]*'sport',[\s\S]*'card',[\s\S]*'lottery'/);
  for (const label of ['หน้าแรก', 'คาสิโน', 'สล็อต', 'ยิงปลา', 'กีฬา', 'ไพ่', 'หวย']) {
    assert.match(root, new RegExp(label));
  }
});

test('mobile category rail keeps responsive sizes', () => {
  assert.match(css, /\.categoryRail\s*\{[\s\S]*z-index:\s*98/);
  assert.match(css, /\.categoryItem\s*\{[\s\S]*width:\s*45px[\s\S]*height:\s*45px/);
  assert.match(css, /@media \(min-width: 360px\)[\s\S]*width:\s*55px[\s\S]*height:\s*55px/);
  assert.match(css, /@media \(min-width: 430px\)[\s\S]*width:\s*60px[\s\S]*height:\s*60px/);
});

test('P2 gives Mobile Home one document vertical scroll owner', () => {
  const documentRule = cssRule(foundationOwner, /html\[data-member-viewport-mode='mobile'\]/);
  const bodyRule = cssRule(foundationOwner, /html\[data-member-viewport-mode='mobile'\] body/);
  const homeRule = cssRule(foundationOwner, /html\[data-member-viewport-mode='mobile'\] \[data-mobile-home-root='true'\]/);

  assert.match(documentRule, /overflow-y:\s*auto\s*!important/);
  assert.match(documentRule, /overflow-x:\s*clip\s*!important/);
  assert.match(bodyRule, /overflow-y:\s*visible\s*!important/);
  assert.doesNotMatch(bodyRule, /overflow-y:\s*auto\s*!important/);
  assert.match(homeRule, /min-width:\s*0\s*!important/);
  assert.doesNotMatch(homeRule, /height:\s*100dvh\s*!important/);
  assert.doesNotMatch(home, /MobileCategoryRailTransformFollower/);
});

test('P2 keeps the source header sticky and safe-area aware', () => {
  assert.match(foundationOwner, /--member-mobile-header-height:\s*60px/);
  assert.match(foundationOwner, /--member-mobile-header-offset:[\s\S]*env\(safe-area-inset-top, 0px\)/);
  assert.match(foundationOwner, /header\[data-mobile-section-owner='header'\][\s\S]*position:\s*sticky\s*!important/);
  assert.match(foundationOwner, /header\[data-mobile-section-owner='header'\][\s\S]*top:\s*0\s*!important/);
  assert.match(foundationOwner, /header\[data-mobile-section-owner='header'\][\s\S]*z-index:\s*160\s*!important/);
  assert.match(foundationOwner, /padding-top:\s*env\(safe-area-inset-top, 0px\)\s*!important/);
});

test('P3 category menu follows the viewport and stops at its content boundary', () => {
  assert.match(foundationOwner, /data-mobile-section-owner='category-menu'[\s\S]*top:\s*var\(--member-mobile-category-offset\)\s*!important/);
  assert.match(foundationOwner, /data-mobile-section-owner='category-menu'[\s\S]*100dvh - var\(--member-mobile-category-offset\) - 8px/);
  assert.match(foundationOwner, /data-mobile-category-follow='start'[\s\S]*position:\s*relative\s*!important/);
  assert.match(foundationOwner, /data-mobile-category-follow='fixed'[\s\S]*position:\s*fixed\s*!important/);
  assert.match(foundationOwner, /data-mobile-category-follow='end'[\s\S]*position:\s*absolute\s*!important/);
  assert.match(foundationOwner, /data-mobile-category-follow='end'[\s\S]*bottom:\s*0\s*!important/);
  assert.match(foundationOwner, /data-mobile-section-owner='category-menu'[\s\S]*overflow-y:\s*auto\s*!important/);
});

test('category and content retain one grid without artificial page padding', () => {
  assert.match(css, /\.categoryContent\s*\{[\s\S]*grid-template-columns:\s*var\(--mobile-category-rail-width\) minmax\(0, 1fr\)/);
  assert.match(foundationOwner, /\*:has\(> \[data-mobile-section-owner='category-menu'\]\)[\s\S]*overflow:\s*visible\s*!important/);
  assert.match(foundationOwner, /data-mobile-content-slot='after-highlight'[\s\S]*overflow-y:\s*visible\s*!important/);
  assert.doesNotMatch(foundationOwner, /padding-left:\s*var\(--mobile-app-rail-width\)/);
});

test('standalone Mobile member pages keep their header and scroll inside the page shell', () => {
  assert.match(followOwner, /main\[data-mobile-member-page\][\s\S]*height:\s*100dvh\s*!important/);
  assert.match(followOwner, /main\[data-mobile-member-page\][\s\S]*overflow-y:\s*auto\s*!important/);
  assert.match(followOwner, /main\[data-mobile-member-page\] > header:first-child[\s\S]*position:\s*sticky\s*!important/);
  assert.match(followOwner, /main\[data-mobile-member-page\] > :not\(header\)[\s\S]*overflow-y:\s*visible\s*!important/);
});

test('category content preserves top chrome and resets the document scroller', () => {
  assert.doesNotMatch(home, /MobileCategoryFooterGuard/);
  assert.match(contentOwner, /data-mobile-section-owner="header"/);
  assert.match(contentOwner, /data-mobile-section-owner="hero"/);
  assert.match(contentOwner, /data-mobile-section-owner="auth-actions"/);
  assert.match(contentOwner, /data-mobile-section-owner="announcement"/);
  assert.match(contentOwner, /restoreTopChrome\(root\)/);
  assert.match(contentOwner, /document\.scrollingElement/);
  assert.match(contentOwner, /scrollOwner\.scrollTo\(\{ top: 0/);
  assert.doesNotMatch(contentOwner, /root\.scrollTo\(/);
});

test('category content accepts every canonical category through one event path', () => {
  assert.match(root, /new CustomEvent\('member:mobile-category-select'/);
  assert.match(contentOwner, /window\.addEventListener\('member:mobile-category-select', selectFromEvent\)/);
  assert.doesNotMatch(contentOwner, /selectFromClick/);
  assert.match(contentOwner, /if \(root\) delete root\.dataset\.mobileActiveCategory/);
  assert.match(contentOwner, /'card'/);
  assert.doesNotMatch(home, /MobileCategoryTabRuntime/);
  assert.equal(existsSync(duplicateRuntime), false);
});

test('active and inactive category cards keep the supplied surfaces', () => {
  assert.match(css, /\.categoryItem\s*\{[\s\S]*background:\s*#373147/);
  assert.match(css, /\.categoryItemActive\s*\{[\s\S]*background:\s*#fff/);
  assert.match(css, /linear-gradient\(#710090 0%, #38324e 100%\)/);
});

test('P1-P3 foundation loads through the final category owner after legacy Mobile CSS', () => {
  const legacyIndex = layout.indexOf("import './member-mobile-home-bottom-owner.css'");
  const finalIndex = layout.indexOf("import './member-mobile-category-follow.css'");
  assert.ok(legacyIndex >= 0);
  assert.ok(finalIndex > legacyIndex);
  assert.match(followOwner, /@import '\.\/member-mobile-p1-p3-foundation\.css';/);
});

test('mobile category artwork uses the exact Desktop Navigation size', () => {
  assert.match(layoutOwner, /data-mobile-section-owner='category-menu'[\s\S]*width:\s*32px\s*!important/);
  assert.match(layoutOwner, /data-mobile-section-owner='category-menu'[\s\S]*height:\s*32px\s*!important/);
  assert.match(layoutOwner, /data-mobile-section-owner='category-menu'[\s\S]*transform:\s*none\s*!important/);
});

test('hamburger member menu uses Desktop Member Menu artwork and geometry', () => {
  assert.match(layoutOwner, /#mobile-home-drawer[\s\S]*width:\s*30px\s*!important/);
  assert.match(layoutOwner, /#mobile-home-drawer[\s\S]*width:\s*26px/);
  for (const asset of [
    'ระดับสมาชิก.png',
    'รายได่คอมมิชชั่น.png',
    'เเนะนำเพื่อน.png',
    'คูปอง.png',
    'โบนัสพิเศษ.png',
    'ถ่ายถอดสด.png',
    'โปรโมชั้น.png',
    'ข่าวสาร.png',
    'กิจกรรม.png',
    'ประวัติ.png',
    'เเจ้งเตือน.png',
    'วิดีโอเเนะนำ.png',
    'เเนะนำการใช้งาน.png',
    'เปลียนภาษา.svg',
  ]) {
    assert.match(layoutOwner, new RegExp(asset.replace('.', '\\.')));
  }
});
