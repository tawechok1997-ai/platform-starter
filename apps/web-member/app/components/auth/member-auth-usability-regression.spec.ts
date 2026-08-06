import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const layout = readFileSync(new URL('../../(auth)/layout.tsx', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('./auth-field-runtime.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./auth-field-ux-final.css', import.meta.url), 'utf8');
const lock = readFileSync(new URL('../../lib/member-document-overlay-lock.ts', import.meta.url), 'utf8');
const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');

test('auth layout loads the final usability owner after source-parity styles', () => {
  const sourceParityIndex = layout.indexOf("auth-popup-original-mobile-final.css");
  const usabilityIndex = layout.indexOf("auth-field-ux-final.css");
  assert.ok(sourceParityIndex >= 0);
  assert.ok(usabilityIndex > sourceParityIndex);
  assert.match(layout, /<AuthFieldRuntime \/>/);
});

test('login and registration fields keep visible labels and usable password controls', () => {
  assert.match(css, /public-auth-field-label/);
  assert.match(css, /position:\s*static\s*!important/);
  assert.match(css, /opacity:\s*1\s*!important/);
  assert.match(css, /auth-runtime-password-eye/);
  assert.match(runtime, /control\.placeholder = label/);
  assert.match(runtime, /control\.type = reveal \? 'text' : 'password'/);
  assert.match(runtime, /MutationObserver/);
});

test('closing the final overlay repairs an abandoned document scroll lock', () => {
  assert.match(lock, /repairAbandonedLockBeforeAcquire/);
  assert.match(lock, /schedulePostCloseRepair/);
  assert.match(lock, /clearOwnedDocumentStyles/);
  assert.match(lock, /body\.style\.removeProperty\('overflow'\)/);
  assert.match(lock, /html\.style\.removeProperty\('overflow'\)/);
});

test('Mobile Home no longer mounts the stray guest bottom navigation', () => {
  assert.doesNotMatch(home, /MobileP6GuestBottomNavigation/);
});
