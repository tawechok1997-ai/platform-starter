import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const events = readFileSync(new URL('../../lib/member-auth-events.ts', import.meta.url), 'utf8');
const chrome = readFileSync(new URL('../../member-chrome.tsx', import.meta.url), 'utf8');
const controller = readFileSync(new URL('../member-navigation-auth-controller.tsx', import.meta.url), 'utf8');
const overlay = readFileSync(new URL('./member-auth-overlay.tsx', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('./auth-field-runtime.tsx', import.meta.url), 'utf8');

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

test('preloaded auth frames are revealed only after each embedded dialog exists', () => {
  assert.match(overlay, /function embeddedAuthShellReady\(document: Document \| null\)/);
  assert.match(overlay, /\[data-embedded="true"\]/);
  assert.match(overlay, /\[role="dialog"\], \.source-login-modal, \.source-register-modal/);
  assert.match(overlay, /payload\.type === 'member-auth-ready'[\s\S]*revealFrameOnlyWhenRendered\(frame, sourceMode\)/);
  assert.match(overlay, /if \(revealFrameOnlyWhenRendered\(frame, frameMode\)\) return/);
  assert.match(overlay, /setReadyByMode\(\(current\)[\s\S]*\[frameMode\]: true/);
  assert.doesNotMatch(overlay, /setFrameReady\(false\)/);
});

test('iframe messages and listeners are bounded to a known preloaded frame and request', () => {
  assert.match(overlay, /modeForFrameWindow\(event\.source, frameRefs\.current\)/);
  assert.match(overlay, /if \(!sourceMode\) return/);
  assert.match(overlay, /if \(sourceMode !== activeModeRef\.current\) return/);
  assert.match(overlay, /new AbortController\(\)/);
  assert.match(overlay, /signal: navigationAbort\.signal/);
  assert.match(overlay, /cancelFrameWork\(\)/);
  assert.match(overlay, /data-auth-request-id=\{requestId\}/);
  assert.match(overlay, /frames\[mode\]\?\.contentWindow === source/);
  assert.doesNotMatch(overlay, /stopImmediatePropagation\(\)/);
});

test('embedded Escape forwards close to the parent overlay even while iframe owns focus', () => {
  assert.match(runtime, /document\.addEventListener\('keydown', forwardEmbeddedEscape, true\)/);
  assert.match(runtime, /event\.key !== 'Escape' \|\| window\.parent === window/);
  assert.match(runtime, /window\.parent\.postMessage\(\{ type: 'member-auth-close' \}, window\.location\.origin\)/);
  assert.match(runtime, /document\.removeEventListener\('keydown', forwardEmbeddedEscape, true\)/);
});
