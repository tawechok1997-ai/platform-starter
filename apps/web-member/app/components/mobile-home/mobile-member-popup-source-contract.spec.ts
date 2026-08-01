import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const runtime = readFileSync(new URL('./mobile-member-popup-runtime.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('./mobile-member-popup-runtime.module.css', import.meta.url), 'utf8');
const mobileLayout = readFileSync(new URL('../../mobile/layout.tsx', import.meta.url), 'utf8');
const searchLayout = readFileSync(new URL('../../search/layout.tsx', import.meta.url), 'utf8');
const avatarLayout = readFileSync(new URL('../../profile/avatar/layout.tsx', import.meta.url), 'utf8');

const routeLayouts = [mobileLayout, searchLayout, avatarLayout];

test('mobile member popup kinds match the source page versus popup contract', () => {
  assert.match(runtime, /\| 'menu'/);
  assert.match(runtime, /\| 'contact'/);
  assert.match(runtime, /\| 'password'/);
  assert.match(runtime, /\| 'deposit'/);
  assert.match(runtime, /\| 'withdraw'/);
  assert.match(runtime, /\| 'network-income'/);
  assert.match(runtime, /\| 'commission-income'/);
  assert.match(runtime, /\| 'coupon'/);
  assert.match(runtime, /\| 'language'/);
  assert.match(runtime, /\| 'video'/);
  assert.doesNotMatch(runtime, /\| 'bonus'/);
  assert.match(runtime, /\['โบนัสพิเศษ', 'bonus'\]/);
  assert.match(runtime, /\['รายได้คอมมิชชั่น', 'commission'\]/);
});

test('all mobile surfaces reuse the same popup runtime component', () => {
  routeLayouts.forEach((source) => {
    assert.match(source, /MobileMemberPopupRuntime/);
    assert.equal((source.match(/<MobileMemberPopupRuntime\s*\/>/g) ?? []).length, 1);
  });
  assert.equal((runtime.match(/function SourcePopupShell/g) ?? []).length, 1);
});

test('source popup shell keeps the exact mobile geometry and chrome', () => {
  assert.match(styles, /width:\s*min\(480px, 100%\)/);
  assert.match(styles, /padding:\s*56px 16px 16px/);
  assert.match(styles, /border-radius:\s*10px/);
  assert.match(styles, /rgb\(0 0 0 \/ 80%\)/);
  assert.match(styles, /linear-gradient\(0deg, rgb\(27 24 36\) -5\.86%, rgb\(63 59 75\) 104\.05%\)/);
  assert.match(runtime, /viewBox="0 0 192 36"/);
  assert.match(runtime, /viewBox="0 0 194 38"/);
});

test('bottom member navigation reuses deposit withdraw contact and menu popups', () => {
  assert.match(runtime, /label: 'เมนู', kind: 'menu'/);
  assert.match(runtime, /label: 'ฝาก', kind: 'deposit'/);
  assert.match(runtime, /label: 'ถอน', kind: 'withdraw'/);
  assert.match(runtime, /label: 'ติดต่อ', kind: 'contact'/);
  assert.match(runtime, /M0 6\.68S197\.5\.383 320 \.013C442\.5-\.356 640 6\.68/);
  assert.match(styles, /width:\s*min\(428px, 100%\)/);
});

test('mobile popup runtime does not import desktop popup owners', () => {
  assert.doesNotMatch(runtime, /MemberHeaderFinanceRuntime|MemberMenuIncomeSafeRuntime|MemberSharedPopupRuntime/);
});
