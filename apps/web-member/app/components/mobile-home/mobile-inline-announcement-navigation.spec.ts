import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const bridge = readFileSync(new URL('./mobile-member-menu-source-bridge.tsx', import.meta.url), 'utf8');
const content = readFileSync(new URL('./mobile-highlight-tab-content.tsx', import.meta.url), 'utf8');

test('mobile announcement tabs own content changes without route navigation', () => {
  assert.match(bridge, /route: '\/mobile\/member\/promotions'/);
  assert.match(bridge, /route: '\/mobile\/member\/activity'/);
  assert.match(bridge, /route: '\/mobile\/member\/news'/);
  assert.match(bridge, /tabId: 'mobile-highlight-tab-1'/);
  assert.match(bridge, /tabId: 'mobile-highlight-tab-2'/);
  assert.match(bridge, /tabId: 'mobile-highlight-tab-3'/);
  assert.match(bridge, /window\.addEventListener\('click', handleInlineNavigation, true\)/);
  assert.match(bridge, /event\.stopImmediatePropagation\(\)/);
  assert.match(bridge, /selectInlineTab\(key\)/);
  assert.match(bridge, /button\.click\(\)/);
  assert.doesNotMatch(bridge, /window\.location\.(?:assign|replace)/);
});

test('inline tabs cannot be reinterpreted as member page labels', () => {
  assert.match(bridge, /button\.dataset\.mobileInlineContentTab = key/);
  assert.match(bridge, /replace\('โปรโมชั่น', 'โปร\\u2060โมชั่น'\)/);
  assert.match(bridge, /replace\('กิจกรรม', 'กิจ\\u2060กรรม'\)/);
  assert.match(bridge, /replace\('ข่าวสาร', 'ข่าว\\u2060สาร'\)/);
});

test('existing mobile content stays in the home content slot', () => {
  assert.match(content, /MOBILE_INLINE_MEMBER_TABS/);
  assert.match(content, /tabButton\.click\(\)/);
  assert.match(content, /data-mobile-highlight-panel="promotions"/);
  assert.match(content, /kind="activities"/);
  assert.match(content, /kind="news"/);
});
