import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const runtime = readFileSync(new URL('./member-shared-popup-runtime.tsx', import.meta.url), 'utf8');
const popup = readFileSync(new URL('./member-source-content-popup.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../member-source-content-popup.css', import.meta.url), 'utf8');

test('shared content popup uses one source-specific visual owner', () => {
  assert.match(runtime, /MemberSourceContentPopup/);
  assert.doesNotMatch(runtime, /BrowsePromotionsCms/);
  assert.match(runtime, /is-content-\$\{contentKind\}/);
});

test('promotion popup keeps the five source categories and three-column desktop grid', () => {
  for (const label of ['ทั้งหมด', 'สมาชิกใหม่', 'ประจำวัน', 'สิทธิพิเศษ', 'คืนยอดเสีย']) {
    assert.match(popup, new RegExp(label));
  }
  assert.match(css, /member-source-promotion-grid[\s\S]*grid-template-columns:\s*repeat\(3/);
  assert.match(css, /padding-bottom:\s*41\.6%/);
});

test('activity popup owns a selectable list and a separate detail column', () => {
  assert.match(popup, /member-source-activity-list/);
  assert.match(popup, /member-source-activity-divider/);
  assert.match(popup, /ActivityDetail/);
  assert.match(css, /member-source-activity-popup[\s\S]*grid-template-columns:\s*minmax\(0, 1fr\) 1\.5px minmax\(0, 1fr\)/);
});

test('news popup uses the source empty state and never injects a fake news fallback', () => {
  assert.match(popup, /ไม่มีข้อความใหม่/);
  assert.match(popup, /member-source-empty-state/);
  assert.doesNotMatch(popup, /ข่าวสารล่าสุด/);
  assert.doesNotMatch(popup, /FALLBACK.*NEWS/i);
});
