import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./mobile-home-root.module.css', import.meta.url), 'utf8');
const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const layoutOwner = readFileSync(new URL('../../member-mobile-home-bottom-owner.css', import.meta.url), 'utf8');
const followOwner = readFileSync(new URL('../../member-mobile-category-follow.css', import.meta.url), 'utf8');
const tabRuntime = readFileSync(new URL('./mobile-category-tab-runtime.tsx', import.meta.url), 'utf8');

test('mobile category rail has one owner and reads central navigation', () => {
  assert.equal((root.match(/data-mobile-section-owner="category-menu"/g) ?? []).length, 1);
  assert.match(root, /useMemberRuntime\(\)/);
  assert.match(root, /navigation\.find\(\(candidate\) => candidate\.id === id && candidate\.mobile\)/);
  assert.doesNotMatch(root, /<canvas\b/);
});

test('mobile category rail keeps the supplied order and labels', () => {
  assert.match(root, /'home',[\s\S]*'casino',[\s\S]*'slot',[\s\S]*'fishing',[\s\S]*'sport',[\s\S]*'card',[\s\S]*'lottery'/);
  for (const label of ['หน้าแรก', 'คาสิโน', 'สล็อต', 'ตกปลา', 'กีฬา', 'ไพ่', 'หวย']) {
    assert.match(root, new RegExp(label));
  }
});

test('mobile category rail keeps responsive sizes', () => {
  assert.match(css, /\.categoryRail\s*\{[\s\S]*z-index:\s*98/);
  assert.match(css, /\.categoryItem\s*\{[\s\S]*width:\s*45px[\s\S]*height:\s*45px/);
  assert.match(css, /@media \(min-width: 360px\)[\s\S]*width:\s*55px[\s\S]*height:\s*55px/);
  assert.match(css, /@media \(min-width: 430px\)[\s\S]*width:\s*60px[\s\S]*height:\s*60px/);
});

test('game categories keep one normal document scroll owner', () => {
  assert.doesNotMatch(followOwner, /body:has\([\s\S]*overflow:\s*hidden\s*!important/);
  assert.match(followOwner, /data-mobile-content-slot='after-highlight'[\s\S]*overflow-y:\s*visible\s*!important/);
  assert.match(followOwner, /data-provider-games-stage[\s\S]*overflow-y:\s*visible\s*!important/);
  assert.doesNotMatch(followOwner, /data-mobile-section-owner='category-menu'[\s\S]*overflow-y:\s*auto/);
});

test('category menu uses one native sticky owner without JavaScript following', () => {
  assert.doesNotMatch(home, /MobileCategoryRailTransformFollower/);
  assert.match(followOwner, /data-mobile-section-owner='category-menu'[\s\S]*position:\s*-webkit-sticky\s*!important/);
  assert.match(followOwner, /data-mobile-section-owner='category-menu'[\s\S]*position:\s*sticky\s*!important/);
  assert.match(followOwner, /data-mobile-section-owner='category-menu'[\s\S]*top:\s*64px\s*!important/);
  assert.match(followOwner, /data-mobile-section-owner='category-menu'[\s\S]*max-height:\s*none\s*!important/);
  assert.match(followOwner, /data-mobile-section-owner='category-menu'[\s\S]*overflow:\s*visible\s*!important/);
  assert.match(followOwner, /data-mobile-section-owner='category-menu'[\s\S]*transform:\s*none\s*!important/);
});

test('sticky rail ancestors do not clip vertical movement', () => {
  assert.match(followOwner, /data-mobile-home-root='true'[\s\S]*overflow-y:\s*visible\s*!important/);
  assert.match(followOwner, /\*:has\(> \[data-mobile-section-owner='category-menu'\]\)[\s\S]*overflow-y:\s*visible\s*!important/);
  assert.match(followOwner, /\*:has\(> \[data-mobile-section-owner='category-menu'\]\)[\s\S]*contain:\s*none\s*!important/);
});

test('category switches preserve and restore the complete top chrome', () => {
  assert.doesNotMatch(home, /MobileCategoryFooterGuard/);
  assert.doesNotMatch(tabRuntime, /bottomStructure\.hidden/);
  assert.match(tabRuntime, /data-mobile-section-owner=\\"header\\"/);
  assert.match(tabRuntime, /data-mobile-section-owner=\\"hero\\"/);
  assert.match(tabRuntime, /data-mobile-section-owner=\\"auth-actions\\"/);
  assert.match(tabRuntime, /data-mobile-section-owner=\\"announcement\\"/);
  assert.match(tabRuntime, /restoreTopChrome\(root\)/);
  assert.match(tabRuntime, /window\.scrollTo\(\{ top: 0/);
});

test('category click broadcasts the canonical event including card pages', () => {
  assert.match(tabRuntime, /new CustomEvent\(MOBILE_CATEGORY_SELECT_EVENT/);
  assert.match(tabRuntime, /value === 'card'/);
  assert.match(tabRuntime, /releaseStalePageLock\(root\)/);
});

test('active and inactive category cards keep the supplied surfaces', () => {
  assert.match(css, /\.categoryItem\s*\{[\s\S]*background:\s*#373147/);
  assert.match(css, /\.categoryItemActive\s*\{[\s\S]*background:\s*#fff/);
  assert.match(css, /linear-gradient\(#710090 0%, #38324e 100%\)/);
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
