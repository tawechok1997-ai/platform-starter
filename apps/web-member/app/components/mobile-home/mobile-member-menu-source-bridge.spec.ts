import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const memberHome = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const bridge = readFileSync(new URL('./mobile-member-menu-source-bridge.tsx', import.meta.url), 'utf8');
const popupRuntime = readFileSync(new URL('./mobile-member-popup-runtime.tsx', import.meta.url), 'utf8');

test('mobile home mounts one unified member menu bridge', () => {
  assert.match(memberHome, /import MobileMemberMenuSourceBridge/);
  assert.equal((memberHome.match(/<MobileMemberMenuSourceBridge\s*\/>/g) ?? []).length, 1);
  assert.match(popupRuntime, /popup === 'menu'/);
  assert.match(popupRuntime, /<MenuContent/);
});

test('member menu popup follows the source geometry and seven-item contract', () => {
  assert.match(bridge, /data-mobile-popup-owner="menu"/);
  assert.match(bridge, /min\(480px, calc\(100vw - 32px\)\)/);
  assert.match(bridge, /padding: 56px 16px 16px/);
  assert.match(bridge, /grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(bridge, /width: 50px/);
  assert.match(bridge, /width: 70px/);
  assert.match(bridge, /content: 'LIVE'/);

  for (const label of [
    'แนะนำเพื่อน',
    'รายได้คอมมิชชั่น',
    'ประวัติ',
    'โปรโมชั่น',
    'กิจกรรม',
    'คูปอง',
    'ถ่ายทอดสด',
  ]) {
    assert.match(bridge, new RegExp(label));
  }
});

test('bottom navigation is limited to the mobile home surface', () => {
  assert.match(bridge, /data-mobile-member-bottom-navigation="true"/);
  assert.match(bridge, /data-mobile-category-id\]\[aria-selected="true"\]/);
  assert.match(bridge, /activeCategory === 'home'/);
  assert.match(bridge, /isHomePath\(window\.location\.pathname\)/);
  assert.match(bridge, /navigation\.hidden = true/);
  assert.match(bridge, /padding-bottom: 0 !important/);
});

test('header and popup menu actions reuse the member drawer action source', () => {
  assert.match(bridge, /button\[aria-label="เปิดเมนูสมาชิก"\]/);
  assert.match(bridge, /detail: \{ kind: 'menu' \}/);
  assert.match(bridge, /findMemberDrawerAction/);
  assert.match(bridge, /#mobile-home-drawer nav a, #mobile-home-drawer nav button/);
  assert.match(bridge, /queueMicrotask\(\(\) => drawerAction\.click\(\)\)/);
});
