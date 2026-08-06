import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const route = readFileSync(new URL('../../mobile/member/promotions/page.tsx', import.meta.url), 'utf8');
const navigation = readFileSync(new URL('./mobile-promotion-standalone-navigation.tsx', import.meta.url), 'utf8');
const highlight = readFileSync(new URL('./mobile-highlight-tab-content.tsx', import.meta.url), 'utf8');
const source = readFileSync(new URL('./use-mobile-member-content-sources.ts', import.meta.url), 'utf8');

test('Home summary and the full promotions page stay as separate presentations', () => {
  assert.match(highlight, /activeTab === 'promotions'/);
  assert.match(route, /MobileMemberPromotionsLivePage/);
  assert.doesNotMatch(route, /redirect\('\/\?tab=promotions'\)/);
});

test('Home and standalone promotions consume the same source hook', () => {
  assert.match(highlight, /useMobilePromotionsSource\(\)/);
  assert.match(route, /useMobilePromotionsSource\(\)/);
  assert.equal((source.match(/export function useMobilePromotionsSource/g) ?? []).length, 1);
});

test('the member promotion menu opens the standalone source route', () => {
  assert.match(home, /import MobilePromotionStandaloneNavigation/);
  assert.match(home, /<MobilePromotionStandaloneNavigation \/>/);
  assert.match(navigation, /data-source-member-menu-item="promotions"/);
  assert.match(navigation, /window\.location\.assign\(PROMOTION_ROUTE\)/);
  assert.match(navigation, /useLayoutEffect/);
});

test('the shared hook loads and merges real promotion sources', () => {
  assert.match(source, /loadJson\('\/public\/promotions'/);
  assert.match(source, /loadJson\('\/public\/site-settings'/);
  assert.match(source, /mapPublicPromotion/);
  assert.match(source, /dedupeCampaigns/);
  assert.match(source, /promotion_campaigns: campaigns/);
  assert.match(source, /credentials: 'omit'/);
  assert.match(source, /cache: 'no-store'/);
});
