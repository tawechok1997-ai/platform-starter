import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const memberHome = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const runtime = readFileSync(new URL('./mobile-authenticated-home-runtime.tsx', import.meta.url), 'utf8');

test('mobile logged-in state preserves the home and hides only guest auth actions', () => {
  assert.equal((memberHome.match(/<MobileAuthenticatedHomeRuntime\s*\/>/g) ?? []).length, 1);
  assert.match(runtime, /summary\.isLoggedIn/);
  assert.match(runtime, /data-mobile-section-owner=\\"auth-actions\\"/);
  assert.match(runtime, /data-mobile-auth-layout=\\"drawer\\"/);
  assert.match(runtime, /element\.hidden = summary\.isLoggedIn/);
  assert.doesNotMatch(runtime, /header|hero|announcement|highlight-tabs|category-menu|shortcut|footer/);
  assert.match(runtime, /return null;/);
});
