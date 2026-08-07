import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const guard = readFileSync(new URL('./register-interaction-guard.tsx', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../../(auth)/layout.tsx', import.meta.url), 'utf8');

test('registration step interactions release local and embedded parent locks', () => {
  assert.match(guard, /source-register-submit/);
  assert.match(guard, /removeProperty\('pointer-events'\)/);
  assert.match(guard, /removeProperty\('overflow'\)/);
  assert.match(guard, /window\.parent\.document/);
  assert.match(guard, /MutationObserver/);
  assert.match(layout, /<RegisterInteractionGuard \/>/);
});
