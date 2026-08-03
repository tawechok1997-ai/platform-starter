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
const duplicateRuntime = new URL('./mobile-category-tab-runtime.tsx', import.meta.url);

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

test('mobile Home uses the document as its single vertical scroll owner', () => {
  assert.match(followOwner, /body:has\(\[data-mobile-home-root='true'\]\)[\s\S]*overflow-y:\s*auto\s*!important/);
  assert.match(followOwner, /\[data-mobile-home-root='true'\][\s\S]*height:\s*auto\s*!important/);
  assert.match(followOwner, /\[data-mobile-home-root='true'\][\s\S]*overflow:\s*visible\s*!important/);
  assert.doesNotMatch(followOwner, /\[data-mobile-home-root='true'\][\s\S]*height:\s*100dvh\s*!important/);
  assert.doesNotMatch(home, /MobileCategoryRailTransformFollower/);
});

test('category menu follows the viewport with bounded sticky positioning', () => {
  assert.match(followOwner, /data-mobile-section-owner='category-menu'[\s\S]*position:\s*sticky\s*!important/);
  assert.match(followOwner, /data-mobile-section-owner='category-menu'[\s\S]*top:\s*calc\(64px \+ env\(safe-area-inset-top, 0px\)\)\s*!important/);
  assert.match(followOwner, /data-mobile-section-owner='category-menu'[\s\S]*height:\s*fit-content\s*!important/);
  assert.match(followOwner, /data-mobile-section-owner='category-menu'[\s\S]*max-height:\s*calc\(100dvh - 72px - env\(safe-area-inset-top, 0px\)\)\s*!important/);
  assert.match(followOwner, /data-mobile-section-owner='category-menu'[\s\S]*overflow-y:\s*auto\s*!important/);
  assert.doesNotMatch(followOwner, /data-mobile-section-owner='category-menu'[\s\S]*position:\s*fixed\s*!important/);
});

test('category and content retain one grid without artificial page padding', () => {
  assert.match(css, /\.categoryContent\s*\{[\s\S]*grid-template-columns:\s*var\(--mobile-category-rail-width\) minmax\(0, 1fr\)/);
  assert.match(followOwner, /\*:has\(> \[data-mobile-section-owner='category-menu'\]\)[\s\S]*overflow:\s*visible\s*!important/);
  assert.match(followOwner, /data-mobile-content-slot='after-highlight'[\s\S]*overflow-y:\s*visible\s*!important/);
  assert.doesNotMatch(followOwner, /padding-left:\s*var\(--mobile-app-rail-width\)/);
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

test('category content accepts every canonical category without a second runtime', () => {
  assert.match(contentOwner, /window\.addEventListener\('click', selectFromClick, true\)/);
  assert.match(contentOwner, /window\.addEventListener\('member:mobile-category-select', selectFromEvent\)/);
  assert.match(contentOwner, /'card'/);
  assert.doesNotMatch(home, /MobileCategoryTabRuntime/);
  assert.equal(existsSync(duplicateRuntime), false);
});

test('active and inactive category cards keep the supplied surfaces', () => {
  assert.match(css, /\.categoryItem\s*\{[\s\S]*background:\s*#373147/);
  assert.match(css, /\.categoryItemActive\s*\{[\s\S]*background:\s*#fff/);
  assert.match(css, /linear-gradient\(#710090 0%, #38324e 100%\)/);
});

test('final category owner loads after the legacy Mobile layout stylesheet', () => {
  const legacyIndex = layout.indexOf("import './member-mobile-home-bottom-owner.css'");
  const finalIndex = layout.indexOf("import './member-mobile-category-follow.css'");
  assert.ok(legacyIndex >= 0);
  assert.ok(finalIndex > legacyIndex);
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
