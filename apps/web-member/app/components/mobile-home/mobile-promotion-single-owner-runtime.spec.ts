import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('./mobile-promotion-single-owner-runtime.tsx', import.meta.url), 'utf8');
const route = readFileSync(new URL('../../mobile/member/promotions/page.tsx', import.meta.url), 'utf8');

test('the legacy Mobile promotions route uses the Home promotion owner', () => {
  assert.match(route, /redirect\('\/\?tab=promotions'\)/);
  assert.doesNotMatch(route, /MobileMemberPromotionsLivePage/);
});

test('Mobile Home mounts the single promotion owner runtime', () => {
  assert.match(home, /import MobilePromotionSingleOwnerRuntime/);
  assert.match(home, /<MobilePromotionSingleOwnerRuntime \/>/);
});

test('promotion owner activates the canonical tab and hides repeated cards', () => {
  assert.match(runtime, /mobile-highlight-tab-1/);
  assert.match(runtime, /data-mobile-highlight-panel="promotions"/);
  assert.match(runtime, /normalizeAsset/);
  assert.match(runtime, /data\.duplicatePromotion/);
  assert.match(runtime, /card\.hidden = duplicate/);
  assert.match(runtime, /MutationObserver/);
});
