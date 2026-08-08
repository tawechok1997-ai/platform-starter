import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./mobile-leaderboard-fit.css', import.meta.url), 'utf8');
const source = readFileSync(new URL('./mobile-source-content.tsx', import.meta.url), 'utf8');

test('Mobile Home loads the leaderboard fit owner after drawer reference parity', () => {
  assert.match(home, /mobile-drawer-reference-parity\.css';\s*import '\.\/components\/mobile-home\/mobile-leaderboard-fit\.css';/);
});

test('the leaderboard source remains identified for the scoped layout fix', () => {
  assert.match(source, /data-mobile-source-leaderboard="true"/);
  assert.match(source, /style=\{\{ minWidth: 400 \}\}/);
  assert.match(source, /overflowX: 'auto'/);
});

test('the final Mobile layout overrides the 400px table and horizontal scroller', () => {
  assert.match(css, /data-mobile-source-leaderboard='true'/);
  assert.match(css, /overflow-x:\s*hidden\s*!important/);
  assert.match(css, /max-width:\s*100%\s*!important/);
  assert.match(css, /min-width:\s*0\s*!important/);
  assert.match(css, /touch-action:\s*pan-y\s*!important/);
  assert.match(css, /grid-template-columns:[\s\S]*minmax\(0, 1\.55fr\)/);
  assert.match(css, /text-overflow:\s*ellipsis\s*!important/);
});
