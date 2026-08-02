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
  assert.match(bridge, /data-mobile-popup-owner="coupon"/);
  assert.match(bridge, /input\.maxLength = 5/);
  assert.match(bridge, /input\.name = 'รหัสคูปอง'/);
  assert.match(bridge, /input\.autocomplete = 'off'/);
  assert.match(bridge, /input\.inputMode = 'text'/);
  assert.match(bridge, /height: 48px/);
  assert.match(bridge, /height: 56px/);
  assert.match(bridge, /background: rgb\(56 55 62\)/);
  assert.match(bridge, /text-transform: uppercase/);
});

test('coupon dialog cannot collapse back to compact intrinsic width', () => {
  assert.match(bridge, /const COUPON_WIDTH = 'min\(396px, calc\(100vw - 32px\)\)'/);
  assert.match(bridge, /dialog\.style\.setProperty\('width', COUPON_WIDTH, 'important'\)/);
  assert.match(bridge, /min-width: min\(288px, calc\(100vw - 32px\)\) !important/);
  assert.match(bridge, /width: 100% !important/);
  assert.match(bridge, /height: auto !important/);
  assert.match(bridge, /transform: none !important/);
  assert.match(bridge, /zoom: 1 !important/);
  assert.doesNotMatch(bridge, /width:\s*fit-content/);
});

test('coupon popup remains scoped and does not restyle other member dialogs', () => {
  assert.match(bridge, /const COUPON_OWNER = '\[data-mobile-popup-owner="coupon"\]'/);
  assert.doesNotMatch(bridge, /data-mobile-popup-owner="deposit"|data-mobile-popup-owner="withdraw"/);
  assert.match(bridge, /MutationObserver/);
  assert.match(bridge, /observer\.disconnect\(\)/);
  assert.match(bridge, /window\.removeEventListener\('resize', syncCouponPopup\)/);
});
