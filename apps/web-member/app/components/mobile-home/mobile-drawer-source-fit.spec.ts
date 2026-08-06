import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./mobile-drawer-source-fit.css', import.meta.url), 'utf8');

test('Mobile Home loads the drawer source-fit stylesheet last', () => {
  assert.match(home, /import '\.\/components\/mobile-home\/mobile-hero-carousel\.css';\s*import '\.\/components\/mobile-home\/mobile-drawer-source-fit\.css';/);
});

test('the member drawer is a fixed single-screen surface without nested scrolling', () => {
  assert.match(css, /#mobile-home-drawer\s*\{/);
  assert.match(css, /height:\s*100dvh\s*!important/);
  assert.match(css, /max-height:\s*100dvh\s*!important/);
  assert.match(css, /overflow:\s*hidden\s*!important/);
  assert.match(css, /overscroll-behavior:\s*none\s*!important/);
  assert.doesNotMatch(css, /#mobile-home-drawer[\s\S]{0,360}overflow-y:\s*auto/);
});

test('drawer groups compress for short viewports and header flag matches source size', () => {
  assert.match(css, /max-height:\s*520px/);
  assert.match(css, /nav:first-of-type/);
  assert.match(css, /nav:nth-of-type\(2\)/);
  assert.match(css, /img\[src\*='\/images\/flags\/'\]/);
  assert.match(css, /width:\s*22px\s*!important/);
  assert.match(css, /height:\s*22px\s*!important/);
});
