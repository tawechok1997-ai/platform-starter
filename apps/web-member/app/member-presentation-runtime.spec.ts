import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const defaults = readFileSync(new URL('./member-presentation-defaults.ts', import.meta.url), 'utf8');
const icons = readFileSync(new URL('./member-presentation-icons.ts', import.meta.url), 'utf8');
const typed = readFileSync(new URL('./typed-site-settings.ts', import.meta.url), 'utf8');
const homeData = readFileSync(new URL('./member-home-data-runtime.ts', import.meta.url), 'utf8');
const catalogModel = readFileSync(new URL('./lib/member-game-catalog-model.ts', import.meta.url), 'utf8');
const sourceCatalog = readFileSync(new URL('./browse/source-game-catalog.ts', import.meta.url), 'utf8');
const mobileRuntime = readFileSync(new URL('./components/mobile-home/mobile-source-runtime.ts', import.meta.url), 'utf8');

test('presentation defaults fill required content without finance mutations', () => {
  assert.match(defaults, /PRESENTATION_DEMO_FLAG = 'presentation_demo_enabled'/);
  assert.match(defaults, /NOAH Championship Weekend/);
  assert.match(defaults, /Slot Master Series/);
  assert.match(defaults, /PRESENTATION_LEADERBOARD/);
  assert.match(defaults, /PRESENTATION_PROMOTION_CAMPAIGNS/);
  assert.match(defaults, /PRESENTATION_CMS_ASSETS/);
  assert.match(defaults, /mergePresentationCmsContent/);
  assert.match(defaults, /mergePresentationPromotions/);
  assert.doesNotMatch(defaults, /walletMutation|manualAdjustment|adminApiFetch|memberApiFetch/);
});

test('shared icons are centralized and remain overrideable by Admin settings', () => {
  for (const key of ['home', 'casino', 'slot', 'fishing', 'sport', 'card', 'lottery', 'tournament', 'leaderboard', 'popular_games']) {
    assert.match(icons, new RegExp(`\\b${key}:`));
  }
  assert.match(typed, /\.\.\.PRESENTATION_ICON_DEFAULTS/);
  assert.match(typed, /\.\.\.\(settings\.icons \?\? \{\}\)/);
});

test('real settings win while presentation records fill only missing content', () => {
  assert.match(typed, /presentationDemoEnabled\(features\)/);
  assert.match(typed, /mergePresentationCmsContent\(cmsContent\)/);
  assert.match(typed, /mergePresentationPromotions\(promotionCampaigns\)/);
  assert.match(defaults, /fallback\.forEach[\s\S]*current\.forEach/);
});

test('tournament leaderboard and mini games show configured data before presentation fallbacks', () => {
  assert.match(homeData, /tournaments\.length > 0[\s\S]*PRESENTATION_TOURNAMENTS/);
  assert.match(homeData, /leaderboard\.length > 0[\s\S]*PRESENTATION_LEADERBOARD/);
  assert.match(homeData, /miniGames\.length > 0[\s\S]*PRESENTATION_MINI_GAMES/);
  assert.match(homeData, /presentationDemoEnabled\(features\)/);
});

test('catalog clients consume platform-selected media before legacy fallbacks', () => {
  assert.match(catalogModel, /item\.imageUrl,[\s\S]*selectedMedia\?\.cachedUrl/);
  assert.match(catalogModel, /providerObject\?\.badgeUrl,[\s\S]*providerObject\?\.logoUrl/);
  assert.match(catalogModel, /mediaPlatform\(item\.metadata\) === platform/);
  assert.match(sourceCatalog, /selectMedia\(item\.media, requestedPlatform\)/);
  assert.match(sourceCatalog, /resolveDistinctGameArtwork\(/);
  assert.match(sourceCatalog, /resolveProviderArtwork\(/);
  assert.match(sourceCatalog, /providerAssetSource\('card', code\)/);
});

test('mobile home fills the live section while keeping configured records first', () => {
  assert.match(mobileRuntime, /const configured = normalizeLiveMatches\(featureSettings\.live_match_items\)/);
  assert.match(mobileRuntime, /if \(configured\.length > 0\) return configured/);
  assert.match(mobileRuntime, /PRESENTATION_LIVE_MATCHES/);
  assert.match(mobileRuntime, /presentationDemoEnabled\(featureSettings\)/);
});
