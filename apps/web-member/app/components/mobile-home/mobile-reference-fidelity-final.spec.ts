import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./mobile-reference-fidelity-final.css', import.meta.url), 'utf8');

test('Mobile Home loads the screenshot-fidelity owner after the existing hero, drawer, and leaderboard owners', () => {
  assert.match(
    home,
    /mobile-hero-carousel\.css';\s*import '\.\/components\/mobile-home\/mobile-drawer-reference-parity\.css';\s*import '\.\/components\/mobile-home\/mobile-leaderboard-fit\.css';\s*import '\.\/components\/mobile-home\/mobile-reference-fidelity-final\.css';/,
  );
});

test('Mobile Home top chrome follows the approved compact source geometry and purple surface', () => {
  assert.match(css, /max-width:\s*428px\s*!important/);
  assert.match(css, /height:\s*54px\s*!important/);
  assert.match(css, /background:\s*#1a1522\s*!important/);
  assert.match(css, /padding:\s*0 6px\s*!important/);
});

test('hero indicators overlay the lower edge of the banner instead of occupying a row below it', () => {
  assert.match(css, /\[data-mobile-section-owner='hero'\] > div\[aria-label\][\s\S]*position:\s*absolute\s*!important/);
  assert.match(css, /bottom:\s*7px\s*!important/);
  assert.match(css, /pointer-events:\s*none\s*!important/);
  assert.match(css, /> button[\s\S]*pointer-events:\s*auto\s*!important/);
  assert.match(css, /button\[aria-current='true'\]::before[\s\S]*background:\s*#bb5bea\s*!important/);
});

test('page auth, announcement, and highlight controls use the approved reference proportions', () => {
  assert.match(css, /\[data-mobile-auth-layout='page'\] > a[\s\S]*height:\s*42px\s*!important/);
  assert.match(css, /\[data-mobile-section-owner='announcement'\][\s\S]*height:\s*30px\s*!important/);
  assert.match(css, /\[data-mobile-section-owner='highlight-tabs'\] > button[\s\S]*height:\s*38px\s*!important/);
  assert.match(css, /border-bottom:\s*1px solid rgb\(187 91 234 \/ 42%\)\s*!important/);
});

test('drawer keeps the source width while restoring readable icon, text, close, and action sizing', () => {
  assert.match(css, /#mobile-home-drawer[\s\S]*width:\s*min\(340px, 100vw\)\s*!important/);
  assert.match(css, /nav:first-of-type > a > span:first-child[\s\S]*width:\s*34px\s*!important/);
  assert.match(css, /nav:first-of-type > a > span:first-child[\s\S]*transform:\s*none\s*!important/);
  assert.match(css, /nav:first-of-type strong[\s\S]*font-size:\s*13px\s*!important/);
  assert.match(css, /div:nth-child\(2\) > button[\s\S]*font-size:\s*22px\s*!important/);
  assert.match(css, /div:last-child > a[\s\S]*min-height:\s*42px\s*!important/);
});
