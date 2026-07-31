import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const shellSource = readFileSync(new URL('./mobile-source-home-shell.tsx', import.meta.url), 'utf8');
const shellCss = readFileSync(new URL('./mobile-source-home-shell.module.css', import.meta.url), 'utf8');
const contentSource = readFileSync(new URL('./mobile-source-home-content.tsx', import.meta.url), 'utf8');
const contentCss = readFileSync(new URL('./mobile-source-home-content.module.css', import.meta.url), 'utf8');
const parityCss = readFileSync(new URL('./mobile-source-home-content-parity.module.css', import.meta.url), 'utf8');
const sourceAssetMap = readFileSync(new URL('./mobile-source-asset-map.ts', import.meta.url), 'utf8');
const promotionRuntime = readFileSync(new URL('../../member-promotion-runtime.ts', import.meta.url), 'utf8');
const headerSource = readFileSync(new URL('../public-mobile-source-header.tsx', import.meta.url), 'utf8');
const headerCss = readFileSync(new URL('../public-mobile-source-header-correction.module.css', import.meta.url), 'utf8');
const footerSource = readFileSync(new URL('../../member-footer.tsx', import.meta.url), 'utf8');
const homeSource = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');

test('mobile source home loads promotions from the canonical Member promotion runtime', () => {
  assert.match(shellSource, /loadMemberPromotionCampaigns/);
  assert.match(shellSource, /MEMBER_PROMOTION_FALLBACKS/);
  assert.doesNotMatch(shellSource, /memberApiFetch\('\/public\/promotions'/);
});

test('mobile source home preserves separate Desktop and Mobile promotion assets', () => {
  assert.match(promotionRuntime, /memberPromotionImageForViewport/);
  assert.match(promotionRuntime, /campaign\.mobileImageUrl/);
  assert.match(promotionRuntime, /campaign\.desktopImageUrl/);
  assert.doesNotMatch(promotionRuntime, /desktopImageUrl:\s*image,\s*mobileImageUrl:\s*image/);
  assert.match(shellSource, /memberPromotionImageForViewport\(promotion, 'mobile'\)/);
  assert.match(shellSource, /applyMobilePromotionFallback/);
  assert.match(shellSource, /isSameSourceAsset/);
});

test('mobile source asset map uses the CDN file names supplied for Mobile', () => {
  assert.match(sourceAssetMap, /9ee1acbf-c1e2-44e9-bffd-3254ff56b5f7\.png/);
  assert.match(sourceAssetMap, /647280b5-3a23-4118-80a0-1b7feb340d1a\.png/);
  assert.match(sourceAssetMap, /1784895027990-67f1beb1-8c13-4582-b6ff-dbb647773c9a\.jpg/);
  assert.match(sourceAssetMap, /1784895081838-4f8ccf22-9b17-4157-900f-0b78f883d69d\.jpg/);
  assert.match(sourceAssetMap, /1778979600098-3be41f05-c93f-4c12-b278-54cfe390de4c\.jpg/);
  assert.match(sourceAssetMap, /fc6b7ea8-3eaf-47ec-8640-33c7138d3c7c\.png/);
  assert.match(sourceAssetMap, /083e4b9b-63aa-4825-a0e3-57a88de57e2f\.ico/);
});

test('mobile source header uses the dedicated Mobile logo instead of the Desktop fallback', () => {
  assert.match(headerSource, /MOBILE_SOURCE_ASSETS\.headerLogo/);
  assert.match(headerSource, /logo_mobile_url/);
  assert.match(headerSource, /isSameSourceAsset\(configuredMobileLogo, configuredDesktopLogo\)/);
  assert.doesNotMatch(headerSource, /:\s*V47_ASSETS\.headerLogo/);
});

test('mobile source header suppresses the complete Desktop header and navigation below 901px', () => {
  assert.match(headerCss, /max-width:\s*900px/);
  assert.match(headerCss, /#member-desktop-scale-shell/);
  assert.match(headerCss, /public-home-topbar\.global-member-topbar\.public-home-topbar/);
  assert.match(headerCss, /member-desktop-nav\.member-desktop-nav--guest/);
});

test('mobile source home keeps the announcement bar visible while central API content is pending', () => {
  assert.match(shellSource, /home\.announcement\.summary/);
  assert.match(shellSource, /ประกาศจากระบบ/);
  assert.match(shellSource, /member-mobile-source-announcement/);
  assert.doesNotMatch(shellSource, /features\.announcement\s*&&\s*announcementText\s*\?/);
});

test('mobile source home uses shared Member runtime data for announcements and navigation', () => {
  assert.match(shellSource, /useMemberRuntime/);
  assert.match(shellSource, /home\.announcement/);
  assert.match(shellSource, /navigation\.filter/);
  assert.match(shellSource, /features\.registration/);
  assert.match(shellSource, /features\.login/);
});

test('mobile source auth actions remain visible independently of member session', () => {
  assert.match(shellSource, /const showGuestActions = features\.registration \|\| features\.login/);
  assert.doesNotMatch(shellSource, /!summary\.isLoggedIn/);
  assert.match(shellSource, /href="\/\?auth=register"/);
  assert.match(shellSource, /href="\/\?auth=login"/);
});

test('mobile source home provides a real shortcut flow without a dead download route', () => {
  assert.match(shellSource, /beforeinstallprompt/);
  assert.match(shellSource, /member-home-shortcut-request/);
  assert.match(shellSource, /\/images\/shortcut\/bg_card\.webp/);
  assert.doesNotMatch(shellSource, /href="\/download/);
});

test('mobile source footer keeps the shared Desktop component and only changes responsive geometry', () => {
  assert.match(footerSource, /member-footer-mobile-match\.module\.css/);
  assert.match(footerSource, /member-footer member-footer--shared/);
  assert.match(footerSource, /member-footer__main/);
  assert.match(footerSource, /member-footer__payments/);
});

test('mobile home mounts the source component directly instead of wrapping the old V47 scaffold', () => {
  assert.match(homeSource, /<MobileSourceHomeShell>/);
  assert.match(homeSource, /<MobileSourceHomeContent/);
  assert.doesNotMatch(homeSource, /<MobileV47Scaffold/);
  assert.match(homeSource, /<DesktopHomeScaffold/);
});

test('mobile source content follows the supplied section order and removes extra blocks', () => {
  const order = [
    'highlightTabs',
    'data-section-kind="tournament"',
    'className={styles.jackpot}',
    'data-section-kind="leaderboard"',
    'kind="popular"',
    'kind="online"',
    'data-section-kind="live"',
    'kind="classic"',
    'data-section-kind="guide"',
  ].map((token) => contentSource.indexOf(token));

  assert.ok(order.every((index) => index >= 0));
  assert.deepEqual([...order].sort((left, right) => left - right), order);
  assert.doesNotMatch(contentSource, /Mini Game/);
  assert.doesNotMatch(contentSource, /miniGames/);
  assert.doesNotMatch(contentSource, /onOpenNews/);
  assert.match(contentSource, /fillGames\(games\.popular, allGames, 3\)/);
  assert.match(contentSource, /fillGames\(allGames\.slice\(2\), allGames, 5\)/);
  assert.match(contentSource, /fillGames\(allGames\.slice\(8\), allGames, 2\)/);
});

test('mobile source geometry keeps the source canvas, promotion ratio and featured online layout', () => {
  assert.match(shellCss, /max-width:\s*428px/);
  assert.match(shellCss, /padding-bottom:\s*41\.6%/);
  assert.match(shellCss, /grid-template-columns:\s*64px minmax\(0, 1fr\)/);
  assert.match(shellCss, /width:\s*55px/);
  assert.match(contentCss, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(contentCss, /calc\(\(100% - 12px\) \/ 3\)/);
  assert.match(parityCss, /data-featured-first='true'/);
  assert.match(parityCss, /grid-column:\s*1 \/ -1/);
  assert.match(parityCss, /object-fit:\s*contain/);
});
