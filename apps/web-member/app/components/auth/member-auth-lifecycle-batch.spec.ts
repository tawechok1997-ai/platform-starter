import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const events = readFileSync(new URL('../../lib/member-auth-events.ts', import.meta.url), 'utf8');
const chrome = readFileSync(new URL('../../member-chrome.tsx', import.meta.url), 'utf8');
const controller = readFileSync(new URL('../member-navigation-auth-controller.tsx', import.meta.url), 'utf8');
const overlay = readFileSync(new URL('./member-auth-overlay.tsx', import.meta.url), 'utf8');

test('auth open requests use one canonical event and a fresh request id', () => {
  assert.match(events, /MEMBER_OPEN_AUTH_EVENT = 'member:auth-open'/);
  assert.match(events, /createMemberAuthRequestId\(\)/);
  assert.match(events, /requestId: createMemberAuthRequestId\(\)/);
  assert.match(events, /dispatchEvent\(new CustomEvent<MemberOpenAuthDetail>\(MEMBER_OPEN_AUTH_EVENT/);
  assert.match(events, /safeNextTarget/);
});

test('MemberChrome is the single auth request owner', () => {
  assert.match(chrome, /useState<MemberOpenAuthDetail \| null>/);
  assert.match(chrome, /window\.addEventListener\(MEMBER_OPEN_AUTH_EVENT, handleAuthOpen\)/);
  assert.match(chrome, /key=\{authRequest\.requestId\}/);
  assert.match(chrome, /requestId=\{authRequest\.requestId\}/);
  assert.match(chrome, /authRequestRef\.current\?\.requestId !== requestId/);
  assert.match(chrome, /authRequestRef\.current\?\.requestId !== request\.requestId/);
  assert.match(chrome, /window\.history\.replaceState\(window\.history\.state/);
  assert.doesNotMatch(controller, /const MEMBER_AUTH_OPEN_EVENT/);
  assert.doesNotMatch(controller, /router\.replace\(`\/\?auth=/);
  assert.match(controller, /openMemberAuth\('login'/);
});

test('closing auth removes every click owner in the same event turn', () => {
  const inputRelease = overlay.indexOf('dropInputOwnershipNow()');
  const dismissStart = overlay.indexOf('setDismissed(true)');
  const callback = overlay.indexOf('void afterClose()');
  assert.ok(inputRelease >= 0 && dismissStart > inputRelease && callback > dismissStart);
  assert.doesNotMatch(overlay, /EXIT_DURATION_MS|setTimeout\(/);
  assert.match(overlay, /overlay\.style\.setProperty\('pointer-events', 'none', 'important'\)/);
  assert.match(overlay, /frame\.style\.setProperty\('pointer-events', 'none', 'important'\)/);
  assert.match(overlay, /releaseDocumentLockNow\(\)/);
  assert.match(overlay, /removeOverlayOwnership\(\)/);
  assert.match(overlay, /restorePreviousFocus\(\)/);
  assert.match(overlay, /if \(dismissed\) return null/);
});

test('iframe is revealed only after the embedded auth dialog exists', () => {
  assert.match(overlay, /function embeddedAuthShellReady\(document: Document \| null\)/);
  assert.match(overlay, /\[data-embedded="true"\]/);
  assert.match(overlay, /\[role="dialog"\], \.source-login-modal, \.source-register-modal/);
  assert.match(overlay, /payload\.type === 'member-auth-ready'[\s\S]*revealFrameOnlyWhenRendered\(frame\)/);
  assert.match(overlay, /if \(revealFrameOnlyWhenRendered\(frame\)\) return/);
  assert.doesNotMatch(overlay, /payload\.type === 'member-auth-ready'\) setFrameReady\(true\)/);
});

test('iframe messages and listeners are bounded to the current request', () => {
  assert.match(overlay, /event\.source !== frameWindow/);
  assert.match(overlay, /new AbortController\(\)/);
  assert.match(overlay, /signal: navigationAbort\.signal/);
  assert.match(overlay, /cancelFrameWork\(\)/);
  assert.match(overlay, /requestedPathRef\.current/);
  assert.match(overlay, /data-auth-request-id=\{requestId\}/);
  assert.doesNotMatch(overlay, /stopImmediatePropagation\(\)/);
});
