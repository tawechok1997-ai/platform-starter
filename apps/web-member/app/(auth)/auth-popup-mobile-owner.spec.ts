import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const layout = readFileSync(new URL('./layout.tsx', import.meta.url), 'utf8');
const mobile = readFileSync(
  new URL('../components/auth/auth-popup-mobile-source-final.css', import.meta.url),
  'utf8',
);

test('mobile auth geometry loads after the shared exact geometry owner', () => {
  const exactIndex = layout.indexOf("auth-source-popup-exact.css");
  const mobileIndex = layout.indexOf("auth-popup-mobile-source-final.css");

  assert.notEqual(exactIndex, -1);
  assert.notEqual(mobileIndex, -1);
  assert.equal(exactIndex < mobileIndex, true);
});

test('login and register stay centered on mobile instead of becoming a bottom sheet', () => {
  assert.match(mobile, /align-items:\s*center\s*!important/);
  assert.match(mobile, /border-radius:\s*8px\s*!important/);
  assert.doesNotMatch(mobile, /align-items:\s*flex-end\s*!important/);
});
