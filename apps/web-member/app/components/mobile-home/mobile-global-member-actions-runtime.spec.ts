import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const source = readFileSync(
  new URL('./mobile-global-member-actions-runtime.tsx', import.meta.url),
  'utf8',
);

test('global action capture ignores controls inside its own overlay', () => {
  assert.match(
    source,
    /if \(action\.closest\('\[data-mobile-global-overlay\]'\)\) return;/,
  );
});

test('logout confirmation owns the real session logout action', () => {
  assert.match(source, /data-mobile-global-confirm-logout="true"/);
  assert.match(source, /onClick=\{confirmLogout\}/);
  assert.match(source, /window\.setTimeout\(\(\) => logout\(\), 320\)/);
});
