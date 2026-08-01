import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const promotionPage = readFileSync(new URL('./mobile-member-promotions-page.tsx', import.meta.url), 'utf8');
const promotionCss = readFileSync(new URL('./mobile-member-promotions-page.module.css', import.meta.url), 'utf8');
const routePage = readFileSync(new URL('../../mobile/member/promotions/page.tsx', import.meta.url), 'utf8');
const browseRoute = readFileSync(new URL('../../browse/promotions/page.tsx', import.meta.url), 'utf8');

test('mobile promotions use public settings without member data', () => {
  assert.match(routePage, /\/public\/site-settings/);
  assert.doesNotMatch(routePage, /memberApiFetch|\/member\/auth\/profile|useMemberSession/);
});

test('source promotion CDN basenames resolve against asset-pc first', () => {
  assert.match(promotionPage, /1778966311210-22044269-ee98-4a09-850a-7a73a8a860aa\.jpg/);
  assert.match(promotionPage, /1784628973087-c16b022a-8361-4272-8673-819c587c10fd\.jpg/);
  assert.match(promotionPage, /1782441824805-ed970564-a17a-4a6f-a163-5658651f406c\.jpg/);
  assert.match(promotionPage, /resolveLocalAssetOrSource\(remoteSource, 'pc'\)/);
});

test('promotion cards open one source detail popup with shared document lock', () => {
  assert.match(promotionPage, /acquireMemberDocumentOverlayLock/);
  assert.match(promotionPage, /role="dialog"/);
  assert.match(promotionPage, /setSelected\(promotion\)/);
  assert.match(promotionPage, /รายละเอียด/);
});

test('mobile source geometry remains 428px with 50px header and 41.6 percent artwork', () => {
  assert.match(promotionCss, /width:\s*min\(100%, 428px\)/);
  assert.match(promotionCss, /height:\s*50px/);
  assert.match(promotionCss, /aspect-ratio:\s*2\.4038 \/ 1/);
  assert.match(promotionCss, /z-index:\s*201/);
});

test('public browse route sends mobile devices to the dedicated promotions route', () => {
  assert.match(browseRoute, /sec-ch-ua-mobile/);
  assert.match(browseRoute, /redirect\('\/mobile\/member\/promotions'\)/);
});
