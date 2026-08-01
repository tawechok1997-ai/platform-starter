import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const globalActions = readFileSync(new URL('./mobile-global-member-actions-runtime.tsx', import.meta.url), 'utf8');
const avatarRuntime = readFileSync(new URL('./mobile-authenticated-avatar-runtime.tsx', import.meta.url), 'utf8');
const guideRoute = readFileSync(new URL('../../mobile/member/[section]/page.tsx', import.meta.url), 'utf8');
const guidePage = readFileSync(new URL('./mobile-member-guide-page.tsx', import.meta.url), 'utf8');

test('language selector is shared by guests and authenticated members', () => {
  assert.match(avatarRuntime, /<MobileGlobalMemberActionsRuntime \/>/);
  assert.match(globalActions, /aria-label="เปลี่ยนภาษา"/);
  assert.match(globalActions, /data\.mobileMemberPopup/);
  assert.match(globalActions, /setLocale\(code as MemberLocale\)/);
  assert.match(globalActions, /English/);
  assert.match(globalActions, /ภาษาไทย/);
  assert.match(globalActions, /Bahasa Indonesia/);
});

test('logout requires confirmation and shows loading before session clear', () => {
  assert.match(globalActions, /logout-confirm/);
  assert.match(globalActions, /คุณยืนยันจะออกจากระบบหรือไม่/);
  assert.match(globalActions, /setOverlay\('logout-loading'\)/);
  assert.match(globalActions, />Loading</);
  assert.match(globalActions, /setTimeout\(\(\) => logout\(\), 320\)/);
});

test('usage guide reuses the source owner for guests and members', () => {
  assert.match(guideRoute, /section === 'guide'/);
  assert.match(guideRoute, /<MobileMemberGuideRoute \/>/);
  assert.match(guidePage, /data-mobile-member-page="guide"/);
  assert.match(guidePage, /แนะนำการใช้งาน/);
  assert.match(guidePage, /การฝาก - ถอน/);
  assert.match(guidePage, /สร้างรายได้เครือข่าย/);
});
