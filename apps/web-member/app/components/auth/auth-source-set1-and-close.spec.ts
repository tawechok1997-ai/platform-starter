import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const layout = readFileSync(new URL('../../(auth)/layout.tsx', import.meta.url), 'utf8');
const sourceSetOne = readFileSync(new URL('./auth-popup-source-set1-final.css', import.meta.url), 'utf8');
const overlay = readFileSync(new URL('./member-auth-overlay.tsx', import.meta.url), 'utf8');

test('Mobile auth Source Set 1 is the final visual stylesheet owner', () => {
  const polishIndex = layout.indexOf("auth-popup-polish.css");
  const sourceSetOneIndex = layout.indexOf("auth-popup-source-set1-final.css");
  assert.ok(polishIndex >= 0);
  assert.ok(sourceSetOneIndex > polishIndex);
  assert.match(sourceSetOne, /grid-template-columns:\s*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(sourceSetOne, /clip-path:\s*none\s*!important/);
  assert.match(sourceSetOne, /a\[aria-current='page'\][\s\S]*background:\s*#3e3a49\s*!important/);
  assert.match(sourceSetOne, /source-login-close[\s\S]*background:\s*#fff\s*!important/);
  assert.doesNotMatch(sourceSetOne, /align-items:\s*flex-end\s*!important/);
});

test('closing auth removes the portal hit layer and releases the document lock before routing', () => {
  assert.match(overlay, /setDismissed\(true\)/);
  assert.match(overlay, /releaseDocumentLockNow\(\)/);
  assert.match(overlay, /removeAttribute\('data-member-overlay-open'\)/);
  assert.match(overlay, /if \(dismissed\) return null/);
  assert.ok(overlay.indexOf('setDismissed(true)') < overlay.indexOf('void afterClose()'));
});
