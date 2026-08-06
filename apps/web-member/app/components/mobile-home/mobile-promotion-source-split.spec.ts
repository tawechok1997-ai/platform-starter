import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const route = readFileSync(new URL('../../mobile/member/promotions/page.tsx', import.meta.url), 'utf8');
const navigation = readFileSync(new URL('./mobile-promotion-standalone-navigation.tsx', import.meta.url), 'utf8');
const highlight = readFileSync(new URL('./mobile-highlight-tab-content.tsx', import.meta.url), 'utf8');

test('Home summary and the full promotions page stay as separate owners', () => {
  assert.match(highlight, /activeTab === 'promotions'/);
  assert.match(route, /MobileMemberPromotionsLivePage/);
  assert.doesNotMatch(route, /redirect\('\/\?tab=promotions'\)/);
});

test('the member promotion menu opens the standalone source route', () => {
  assert.match(home, /import MobilePromotionStandaloneNavigation/);
  assert.match(home, /<MobilePromotionStandaloneNavigation \/>/);
  assert.match(navigation, /data-source-member-menu-item="promotions"/);
  assert.match(navigation, /window\.location\.assign\(PROMOTION_ROUTE\)/);
  assert.match(navigation, /useLayoutEffect/);
});

test('the standalone page loads and merges real promotion sources', () => {
  assert.match(route, /loadJson\('\/public\/promotions'/);
  assert.match(route, /loadJson\('\/public\/site-settings'/);
  assert.match(route, /mapPublicPromotion/);
  assert.match(route, /dedupeCampaigns/);
  assert.match(route, /promotion_campaigns: campaigns/);
  assert.match(route, /credentials: 'omit'/);
  assert.match(route, /cache: 'no-store'/);
});
