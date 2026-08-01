import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const guidePage = readFileSync(new URL('./mobile-member-guide-page.tsx', import.meta.url), 'utf8');
const guideData = readFileSync(new URL('./mobile-member-guide-source-data.ts', import.meta.url), 'utf8');
const guideCss = readFileSync(new URL('./mobile-member-guide-page.module.css', import.meta.url), 'utf8');
const mobileRoute = readFileSync(new URL('../../mobile/member/guide/page.tsx', import.meta.url), 'utf8');
const publicGuideRoute = readFileSync(new URL('../../guide/page.tsx', import.meta.url), 'utf8');

test('mobile guide is a dedicated public route with every disclosure collapsed initially', () => {
  assert.match(mobileRoute, /MobileMemberGuidePage/);
  assert.match(guidePage, /useState<string \| null>\(null\)/);
  assert.doesNotMatch(guidePage, /\bopen=\{?true\}?/);
  assert.doesNotMatch(mobileRoute, /memberApiFetch|useMemberSession|\/member\/auth\/profile/);
});

test('guide source keeps all source sections and categories', () => {
  for (const title of [
    'การฝากเงิน',
    'การถอนเงิน',
    'โปรโมชั่น',
    'รวบรวมทุกกิจกรรม',
    'ข่าวสาร',
    'การเข้าเล่นคาสิโน',
    'ระบบสร้างรายได้เครือข่าย',
    'สิทธิประโยชน์ลูกค้าเเต่ระดับ',
    'ปัญหาอินเตอร์เน็ต',
  ]) {
    assert.match(guideData, new RegExp(title));
  }
});

test('guide images resolve CDN basenames against asset-pc before remote fallback', () => {
  assert.match(guidePage, /resolveLocalAssetOrSource\(remoteSource, 'pc'\)/);
  assert.match(guidePage, /data-source-cdn/);
  assert.match(guideData, /\/FEZX\/user-guides\//);
});

test('guide layout retains source mobile geometry and horizontal category tabs', () => {
  assert.match(guideCss, /width:\s*min\(100%, 428px\)/);
  assert.match(guideCss, /height:\s*50px/);
  assert.match(guideCss, /overflow-x:\s*auto/);
  assert.match(guideCss, /background:\s*#b573d4/);
});

test('legacy guide route redirects only mobile visitors to the dedicated source page', () => {
  assert.match(publicGuideRoute, /sec-ch-ua-mobile/);
  assert.match(publicGuideRoute, /redirect\('\/mobile\/member\/guide'\)/);
  assert.match(publicGuideRoute, /GuidePageClient/);
});
