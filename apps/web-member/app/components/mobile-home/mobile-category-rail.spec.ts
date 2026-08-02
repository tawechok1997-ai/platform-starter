import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const root = readFileSync(new URL('./mobile-home-root.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./mobile-home-root.module.css', import.meta.url), 'utf8');
const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const layoutOwner = readFileSync(new URL('../../member-mobile-home-bottom-owner.css', import.meta.url), 'utf8');
const followOwner = readFileSync(new URL('../../member-mobile-category-follow.css', import.meta.url), 'utf8');

test('mobile category rail has one owner and reads central navigation', () => {
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

test('game categories keep the page fixed and scroll only the right content column', () => {
  assert.match(followOwner, /body:has\(\[data-mobile-home-root='true'\][\s\S]*overflow:\s*hidden\s*!important/);
  assert.match(followOwner, /data-mobile-content-slot='after-highlight'[\s\S]*height:\s*100%\s*!important/);
  assert.match(followOwner, /data-mobile-content-slot='after-highlight'[\s\S]*overflow-y:\s*auto\s*!important/);
  assert.match(followOwner, /data-mobile-content-slot='after-highlight'[\s\S]*-webkit-overflow-scrolling:\s*touch\s*!important/);
  assert.match(followOwner, /data-provider-games-stage[\s\S]*overflow:\s*visible\s*!important/);
});

test('category menu stays static and no scroll-follow runtime is mounted', () => {
  assert.doesNotMatch(home, /MobileCategoryRailFollowRuntime/);
  assert.match(followOwner, /data-mobile-section-owner='category-menu'[\s\S]*position:\s*relative\s*!important/);
  assert.match(followOwner, /data-mobile-section-owner='category-menu'[\s\S]*transform:\s*none\s*!important/);
  assert.match(followOwner, /data-mobile-section-owner='category-menu'[\s\S]*overflow-y:\s*auto\s*!important/);
  assert.doesNotMatch(followOwner, /--mobile-category-rail-offset/);
  assert.doesNotMatch(followOwner, /translate3d/);
});

test('provider rail remains horizontally scrollable inside the game content', () => {
  assert.match(followOwner, /data-provider-games-stage='games'[\s\S]*\[role='tablist'\][\s\S]*overflow-x:\s*auto\s*!important/);
  assert.match(followOwner, /data-provider-games-stage='games'[\s\S]*\[role='tablist'\][\s\S]*overflow-y:\s*hidden\s*!important/);
  assert.match(followOwner, /data-provider-games-stage='games'[\s\S]*\[role='tablist'\][\s\S]*touch-action:\s*pan-x pan-y\s*!important/);
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
