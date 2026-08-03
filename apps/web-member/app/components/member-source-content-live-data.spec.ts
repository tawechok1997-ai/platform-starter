import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const popup = readFileSync(new URL('./member-source-content-popup.tsx', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('./member-source-content-runtime.ts', import.meta.url), 'utf8');

test('promotion popup loads only the public promotions API in production', () => {
  assert.match(runtime, /memberApiFetch\('\/public\/promotions'/);
  assert.match(runtime, /Array\.isArray\(payload\?\.items\) \? payload\.items : \[\]/);
  assert.doesNotMatch(runtime, /PROMOTION_ASSET_CAMPAIGNS/);
  assert.doesNotMatch(popup, /loadPublicPromotionCampaigns/);
  assert.match(popup, /loadLivePromotionCampaigns/);
});

test('CMS popup reads raw public site settings rather than presentation-merged data', () => {
  assert.match(popup, /const \{ settings, reload \} = useSiteSettings\(\)/);
  assert.match(popup, /cmsContentSetting\(settings\)/);
  assert.match(popup, /void reload\(\)/);
  assert.doesNotMatch(popup, /typedSettings\.features\.cms_content/);
});

test('local promotion and activity data are available only when demo mode is explicitly enabled', () => {
  assert.match(popup, /presentation_demo_enabled === true/);
  assert.match(popup, /demoEnabled\s*\? PROMOTION_ASSET_CAMPAIGNS\s*:\s*\[\]/);
  assert.match(popup, /allowDemoFallback \? SOURCE_ACTIVITY_FALLBACK : \[\]/);
  assert.match(popup, /data-content-source=\{demoEnabled \? 'demo' : 'api'\}/);
});

test('empty and failed live data remain visible instead of being silently replaced', () => {
  assert.match(popup, /โหลดข้อมูลโปรโมชั่นไม่สำเร็จ/);
  assert.match(popup, /ยังไม่มีโปรโมชั่น/);
  assert.match(popup, /ยังไม่มีกิจกรรม/);
  assert.match(popup, /ไม่มีข้อความใหม่/);
});
