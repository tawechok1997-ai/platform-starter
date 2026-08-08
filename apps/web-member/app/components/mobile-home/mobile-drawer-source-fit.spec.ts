import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./mobile-drawer-source-fit.css', import.meta.url), 'utf8');

test('Mobile Home loads the drawer reference-parity stylesheet after the hero owner', () => {
  assert.match(home, /import '\.\/components\/mobile-home\/mobile-hero-carousel\.css';\s*import '\.\/components\/mobile-home\/mobile-drawer-reference-parity\.css';/);
});

test('the member drawer is a full-height bounded surface without nested scrolling', () => {
  assert.match(css, /#mobile-home-drawer\s*\{/);
  assert.match(css, /width:\s*min\(80vw,\s*280px\)\s*!important/);
  assert.match(css, /height:\s*100dvh\s*!important/);
  assert.match(css, /max-height:\s*100dvh\s*!important/);
  assert.match(css, /overflow:\s*hidden\s*!important/);
  assert.match(css, /overscroll-behavior:\s*none\s*!important/);
  assert.doesNotMatch(css, /#mobile-home-drawer[\s\S]{0,520}overflow-y:\s*auto/);
  assert.doesNotMatch(css, /height:\s*min\(100dvh,\s*620px\)/);
});

test('the source drawer restores its logo header and compact menu proportions', () => {
  assert.match(css, /#mobile-home-drawer > div:nth-child\(2\)\s*\{[\s\S]*display:\s*flex\s*!important/);
  assert.match(css, /#mobile-home-drawer > div:nth-child\(2\) > img/);
  assert.match(css, /#mobile-home-drawer > div:nth-child\(2\) > button/);
  assert.match(css, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(css, /@media \(max-width: 900px\) and \(max-height: 540px\)/);
});

test('header and drawer language flags stay at source sizes', () => {
  assert.match(css, /img\[src\*='\/images\/flags\/'\]/);
  assert.match(css, /width:\s*22px\s*!important/);
  assert.match(css, /height:\s*22px\s*!important/);
  assert.match(css, /nav:nth-of-type\(2\) > button > img/);
  assert.match(css, /width:\s*21px\s*!important/);
  assert.match(css, /height:\s*21px\s*!important/);
});
