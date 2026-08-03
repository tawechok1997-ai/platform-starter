import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const popup = readFileSync(new URL('./member-source-content-popup.tsx', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('./member-source-content-runtime.ts', import.meta.url), 'utf8');

test('promotion popup loads only the public promotions API', () => {
  assert.match(runtime, /memberApiFetch\('\/public\/promotions'/);
  assert.match(runtime, /Array\.isArray\(payload\?\.items\) \? payload\.items : \[\]/);
  assert.doesNotMatch(runtime, /PROMOTION_ASSET_CAMPAIGNS/);
  assert.doesNotMatch(popup, /loadPublicPromotionCampaigns/);
  assert.match(popup, /loadLivePromotionCampaigns/);
  assert.match(popup, /data-content-source="api"/);
});

test('CMS popup reads raw public site settings rather than presentation-merged data', () => {
  assert.match(popup, /const \{ settings, reload \} = useSiteSettings\(\)/);
  assert.match(popup, /cmsContentSetting\(settings\)/);
  assert.match(popup, /void reload\(\)/);
  assert.match(popup, /data-content-source="cms"/);
  assert.doesNotMatch(popup, /typedSettings\.features\.cms_content/);
});

test('popup content never uses local promotion or activity demo rows', () => {
  assert.doesNotMatch(popup, /PROMOTION_ASSET_CAMPAIGNS/);
  assert.doesNotMatch(popup, /SOURCE_ACTIVITY_FALLBACK/);
  assert.doesNotMatch(popup, /presentation_demo_enabled/);
  assert.doesNotMatch(popup, /data-content-source="demo"/);
  assert.match(popup, /setCampaigns\(\[\]\)/);
});

test('empty and failed live data remain visible instead of being silently replaced', () => {
  assert.match(popup, /โหลดข้อมูลโปรโมชั่นไม่สำเร็จ/);
  assert.match(popup, /ยังไม่มีโปรโมชั่น/);
  assert.match(popup, /ยังไม่มีกิจกรรม/);
  assert.match(popup, /ไม่มีข้อความใหม่/);
});
