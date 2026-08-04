import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const guide = readFileSync(new URL('./usage-guide-controller.tsx', import.meta.url), 'utf8');
const memberPopup = readFileSync(new URL('../mobile-home/mobile-member-popup-runtime.tsx', import.meta.url), 'utf8');

test('guest video guide is owned by UsageGuideController only', () => {
  assert.match(guide, /const \{ isLoggedIn \} = useMemberSession\(\)/);
  assert.match(guide, /if \([\s\S]*isLoggedIn[\s\S]*\) return/);
  assert.match(guide, /showGuestVideo\(\)/);
  assert.match(guide, /MobileVideoGuidePopup open=\{videoOpen\}/);
});

test('logged-in video requests continue to the Mobile member popup owner', () => {
  assert.match(guide, /logged-in clicks continue to the member/);
  assert.match(guide, /\}, \[isLoggedIn\]\)/);
  assert.match(memberPopup, /\| 'video'/);
  assert.match(memberPopup, /popup === 'video'/);
  assert.match(memberPopup, /window\.addEventListener\(MOBILE_MEMBER_POPUP_EVENT, handleOpen\)/);
});
