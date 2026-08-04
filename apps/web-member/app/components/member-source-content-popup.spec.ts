import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const runtime = readFileSync(new URL('./member-shared-popup-runtime.tsx', import.meta.url), 'utf8');
const popup = readFileSync(new URL('./member-source-content-popup.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../member-source-content-popup.css', import.meta.url), 'utf8');
const hardeningCss = readFileSync(new URL('../member-source-content-popup-hardening.css', import.meta.url), 'utf8');
const headerCss = readFileSync(new URL('../member-source-content-popup-header.css', import.meta.url), 'utf8');

test('shared content popup uses one source-specific visual owner', () => {
  assert.match(runtime, /MemberSourceContentPopup/);
  assert.doesNotMatch(runtime, /BrowsePromotionsCms/);
  assert.match(runtime, /is-content-\$\{contentKind\}/);
});

test('shared runtime remounts content when changing view or returning from detail', () => {
  assert.match(runtime, /key=\{`\$\{popup\}:\$\{detailBackSignal\}`\}/);
  assert.match(runtime, /setPromotionDetailOpen\(false\)[\s\S]*setDetailBackSignal/);
  assert.doesNotMatch(popup, /detailBackSignal/);
});

test('promotion popup keeps the five source categories and three-column desktop grid', () => {
  for (const label of ['ทั้งหมด', 'สมาชิกใหม่', 'ประจำวัน', 'สิทธิพิเศษ', 'คืนยอดเสีย']) {
    assert.match(popup, new RegExp(label));
  }
  assert.match(css, /member-source-promotion-grid[\s\S]*grid-template-columns:\s*repeat\(3/);
  assert.match(css, /padding-bottom:\s*41\.6%/);
});

test('promotion cards open their popup detail directly without route navigation or an extra action button', () => {
  assert.match(popup, /className="member-source-promotion-card"/);
  assert.match(popup, /setSelectedCampaign\(campaign\)/);
  assert.match(popup, /onDetailOpenChange\?\.\(true\)/);
  assert.doesNotMatch(popup, /member-source-promotion-card[\s\S]{0,240}href=/);
  assert.doesNotMatch(popup, /member-source-claim-button|memberApiFetch|member:auth-open/);
});

test('activity popup owns a selectable list and a separate detail column', () => {
  assert.match(popup, /member-source-activity-list/);
  assert.match(popup, /member-source-activity-divider/);
  assert.match(popup, /ActivityDetail/);
  assert.match(css, /member-source-activity-popup[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\) 1\.5px minmax\(0, 1fr\)/);
});

test('activity CMS data supports separate source thumbnail and banner artwork', () => {
  assert.match(popup, /thumbnailImageUrl/);
  assert.match(popup, /bannerImageUrl/);
  assert.match(popup, /resolveLocalAssetOrSource/);
  assert.match(popup, /statusLabel/);
});

test('content popup resets its own scroll owners instead of scrolling the document', () => {
  assert.match(popup, /resetPopupScroll/);
  assert.match(popup, /member-shared-popup-content/);
  assert.doesNotMatch(popup, /window\.scrollTo|document\.scrollingElement/);
  assert.match(hardeningCss, /member-shared-popup-content[\s\S]*overflow:\s*hidden/);
});

test('content popup avoids synchronous state-reset effects', () => {
  assert.doesNotMatch(popup, /useEffect\(\(\) => \{\s*setCategory/);
  assert.doesNotMatch(popup, /useEffect\(\(\) => \{[\s\S]{0,180}setSelectedActivityId/);
  assert.doesNotMatch(popup, /useEffect\(\(\) => \{[\s\S]{0,180}setSelectedCampaign/);
});

test('broken media keeps layout through a local placeholder', () => {
  assert.match(popup, /member-source-image-placeholder/);
  assert.match(popup, /ResponsiveSourceImage/);
  assert.match(hardeningCss, /member-source-image-placeholder/);
  assert.match(headerCss, /member-source-content-popup-hardening\.css/);
});

test('news popup uses the source empty state and never injects a fake news fallback', () => {
  assert.match(popup, /ไม่มีข้อความใหม่/);
  assert.match(popup, /member-source-empty-state/);
  assert.match(popup, /M87\.4313 36\.6079/);
  assert.doesNotMatch(popup, /ข่าวสารล่าสุด/);
  assert.doesNotMatch(popup, /FALLBACK.*NEWS/i);
});
