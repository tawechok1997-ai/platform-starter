import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const memberHome = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const bridge = readFileSync(new URL('./mobile-coupon-popup-bridge.tsx', import.meta.url), 'utf8');
const popupRuntime = readFileSync(new URL('./mobile-member-popup-runtime.tsx', import.meta.url), 'utf8');

test('mobile home mounts one coupon bridge beside the existing popup owner', () => {
  assert.match(memberHome, /import MobileCouponPopupBridge/);
  assert.equal((memberHome.match(/<MobileCouponPopupBridge\s*\/>/g) ?? []).length, 1);
  assert.match(popupRuntime, /popup === 'coupon'/);
  assert.match(popupRuntime, /<CouponContent/);
  assert.doesNotMatch(bridge, /createPortal|role="dialog"/);
});

test('coupon bridge keeps the source field and button contract', () => {
  assert.match(bridge, /data-mobile-popup-owner=\"coupon\"/);
  assert.match(bridge, /input\.maxLength = 5/);
  assert.match(bridge, /input\.name = 'รหัสคูปอง'/);
  assert.match(bridge, /input\.autocomplete = 'off'/);
  assert.match(bridge, /height: 40px/);
  assert.match(bridge, /height: 56px/);
  assert.match(bridge, /height: 44px/);
  assert.match(bridge, /background: rgb\(56 55 62\)/);
  assert.match(bridge, /color: rgb\(85 85 85\)/);
});

test('coupon popup remains scoped and does not restyle other member dialogs', () => {
  assert.match(bridge, /const COUPON_OWNER = '\[data-mobile-popup-owner="coupon"\]'/);
  assert.doesNotMatch(bridge, /data-mobile-popup-owner="deposit"|data-mobile-popup-owner="withdraw"/);
  assert.match(bridge, /MutationObserver/);
  assert.match(bridge, /observer\.disconnect\(\)/);
});
