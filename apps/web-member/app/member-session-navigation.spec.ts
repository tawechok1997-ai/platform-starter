import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(new URL('./member-session-provider.tsx', import.meta.url), 'utf8');

test('logout clears the member session and returns to a clean home route', () => {
  assert.match(source, /clearMemberSession\(\)/);
  assert.match(source, /window\.location\.replace\('\/'\)/);
  assert.doesNotMatch(source, /window\.location\.replace\('\/\?auth=login'\)/);
});

test('only a browser reload resets scroll to the top before restoring normal history behavior', () => {
  assert.match(source, /navigationEntry\?\.type === 'reload'/);
  assert.match(source, /window\.history\.scrollRestoration = 'manual'/);
  assert.match(source, /window\.scrollTo\(\{ top: 0, left: 0, behavior: 'auto' \}\)/);
  assert.match(source, /window\.history\.scrollRestoration = previousScrollRestoration/);
});
