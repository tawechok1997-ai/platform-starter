import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const overlayLock = readFileSync(new URL('./lib/member-document-overlay-lock.ts', import.meta.url), 'utf8');
const authOverlay = readFileSync(
  new URL('./components/auth/member-auth-overlay.tsx', import.meta.url),
  'utf8',
);
const modalSystem = readFileSync(new URL('./components/member-modal-system.tsx', import.meta.url), 'utf8');
const desktopViewport = readFileSync(
  new URL('./components/public-desktop-viewport-bootstrap.tsx', import.meta.url),
  'utf8',
);
const authStylesheet = readFileSync(new URL('./member-auth-overlay.css', import.meta.url), 'utf8');
const authMotionCss = readFileSync(new URL('./member-auth-overlay-motion.css', import.meta.url), 'utf8');

test('document overlay lock is reference-counted and restores only after the final release', () => {
  assert.match(overlayLock, /let activeLockCount = 0/);
  assert.match(overlayLock, /activeLockCount \+= 1/);
  assert.match(overlayLock, /activeLockCount = Math\.max\(0, activeLockCount - 1\)/);
  assert.match(overlayLock, /if \(activeLockCount > 0\)/);
  assert.match(overlayLock, /restoreDocumentStyles\(\)/);
  assert.match(overlayLock, /if \(released\) return/);
});

test('overlay lock freezes physical desktop width and requests a post-close resync', () => {
  assert.match(overlayLock, /frozenViewportWidth = measuredViewportWidth/);
  assert.match(overlayLock, /activeLockCount > 0 && frozenViewportWidth !== null/);
  assert.match(overlayLock, /MEMBER_DESKTOP_VIEWPORT_RESYNC_EVENT/);
  assert.match(
    overlayLock,
    /window\.requestAnimationFrame\(\(\) => \{[\s\S]*window\.requestAnimationFrame/,
  );
});

test('auth and shared desktop overlay owners no longer mutate document overflow independently', () => {
  assert.match(authOverlay, /acquireMemberDocumentOverlayLock\(\)/);
  assert.match(modalSystem, /acquireMemberDocumentOverlayLock\(\)/);
  assert.doesNotMatch(authOverlay, /document\.(?:body|documentElement)\.style\.(?:overflow|overscrollBehavior)/);
  assert.doesNotMatch(modalSystem, /document\.(?:body|documentElement)\.style\.(?:overflow|overscrollBehavior)/);
});

test('auth motion css is static and remains the final visual owner without runtime style injection', () => {
  assert.match(authStylesheet, /@import '\.\/member-auth-overlay-motion\.css'/);
  assert.doesNotMatch(authOverlay, /member-auth-overlay-motion\.css/);
  assert.doesNotMatch(authOverlay, /<style>/);
  assert.doesNotMatch(authOverlay, /AUTH_OVERLAY_MOTION_CSS/);
  assert.match(authMotionCss, /memberAuthBackdropEnter/);
  assert.match(authMotionCss, /html body div\.member-auth-overlay/);
  assert.match(authMotionCss, /member-auth-overlay__backdrop/);
});

test('desktop viewport scaling reads frozen overlay width and resyncs after close', () => {
  assert.match(desktopViewport, /getMemberDesktopViewportWidth\(\)/);
  assert.match(desktopViewport, /MEMBER_DESKTOP_VIEWPORT_RESYNC_EVENT/);
  assert.match(
    desktopViewport,
    /window\.addEventListener\(MEMBER_DESKTOP_VIEWPORT_RESYNC_EVENT, syncViewport\)/,
  );
  assert.match(
    desktopViewport,
    /window\.removeEventListener\(MEMBER_DESKTOP_VIEWPORT_RESYNC_EVENT, syncViewport\)/,
  );
});
