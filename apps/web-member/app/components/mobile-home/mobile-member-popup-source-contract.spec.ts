import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const runtime = readFileSync(new URL('./mobile-member-popup-runtime.tsx', import.meta.url), 'utf8');
const styles = readFileSync(new URL('./mobile-member-popup-runtime.module.css', import.meta.url), 'utf8');
const mobileLayout = readFileSync(new URL('../../mobile/layout.tsx', import.meta.url), 'utf8');
const searchLayout = readFileSync(new URL('../../search/layout.tsx', import.meta.url), 'utf8');
const avatarLayout = readFileSync(new URL('../../profile/avatar/layout.tsx', import.meta.url), 'utf8');

test('mobile member popup kinds match the source contract', () => {
  for (const kind of ['menu', 'contact', 'password', 'deposit', 'withdraw', 'network-income', 'commission-income', 'coupon', 'language', 'video']) {
    assert.match(runtime, new RegExp(`\\| '${kind}'`));
  }
  assert.doesNotMatch(runtime, /\| 'bonus'/);
  assert.match(runtime, /\['โบนัสพิเศษ', 'bonus'\]/);
});

test('each independent mobile surface mounts exactly one popup runtime', () => {
  for (const layout of [mobileLayout, searchLayout, avatarLayout]) {
    assert.match(layout, /MobileMemberPopupRuntime/);
    assert.equal((layout.match(/<MobileMemberPopupRuntime\s*\/>/g) ?? []).length, 1);
  }
  assert.equal((runtime.match(/function SourcePopupShell/g) ?? []).length, 1);
});

test('source popup shell keeps mobile geometry and chrome', () => {
  assert.match(styles, /width:\s*min\(480px, 100%\)/);
  assert.match(styles, /padding:\s*56px 16px 16px/);
  assert.match(styles, /border-radius:\s*10px/);
  assert.match(styles, /rgb\(0 0 0 \/ 80%\)/);
  assert.match(runtime, /viewBox="0 0 192 36"/);
  assert.match(runtime, /viewBox="0 0 194 38"/);
});

test('bottom navigation reuses deposit withdraw contact and menu popups', () => {
  assert.match(runtime, /label: 'เมนู', kind: 'menu'/);
  assert.match(runtime, /label: 'ฝาก', kind: 'deposit'/);
  assert.match(runtime, /label: 'ถอน', kind: 'withdraw'/);
  assert.match(runtime, /label: 'ติดต่อ', kind: 'contact'/);
  assert.match(styles, /width:\s*min\(428px, 100%\)/);
});

test('mobile popup runtime does not import desktop popup owners', () => {
  assert.doesNotMatch(runtime, /MemberHeaderFinanceRuntime|MemberMenuIncomeSafeRuntime|MemberSharedPopupRuntime/);
});
