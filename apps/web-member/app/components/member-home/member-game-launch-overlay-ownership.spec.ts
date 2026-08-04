import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const launch = readFileSync(new URL('./public-home-game-navigation-controller.tsx', import.meta.url), 'utf8');
const modal = readFileSync(new URL('../member-modal-system.tsx', import.meta.url), 'utf8');
const lock = readFileSync(new URL('../../lib/member-document-overlay-lock.ts', import.meta.url), 'utf8');

test('game launch overlay uses the shared document overlay lock', () => {
  assert.match(launch, /acquireMemberDocumentOverlayLock/);
  assert.match(launch, /const launchOverlayOpen = launchState !== null/);
  assert.match(launch, /if \(!launchOverlayOpen\) return;[\s\S]*return acquireMemberDocumentOverlayLock\(\)/);
});

test('modal and game launch overlays share the reference-counted owner', () => {
  assert.match(modal, /acquireMemberDocumentOverlayLock\(\)/);
  assert.match(lock, /let activeLockCount = 0/);
  assert.match(lock, /activeLockCount \+= 1/);
  assert.match(lock, /activeLockCount = Math\.max\(0, activeLockCount - 1\)/);
});
