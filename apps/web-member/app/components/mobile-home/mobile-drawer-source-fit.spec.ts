import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const home = readFileSync(new URL('../../member-home.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('./mobile-drawer-reference-parity.css', import.meta.url), 'utf8');

test('Mobile Home loads the drawer reference-parity stylesheet after the hero owner', () => {
  assert.match(home, /import '\.\/components\/mobile-home\/mobile-hero-carousel\.css';\s*import '\.\/components\/mobile-home\/mobile-drawer-reference-parity\.css';/);
});

test('the drawer uses the exact 340px source width and 23px by 20px padding', () => {
  assert.match(css, /width:\s*min\(340px,\s*100vw\)\s*!important/);
  assert.match(css, /max-width:\s*340px\s*!important/);
  assert.match(css, /height:\s*100dvh\s*!important/);
  assert.match(css, /padding:\s*20px 23px\s*!important/);
  assert.match(css, /overflow-x:\s*hidden\s*!important/);
  assert.match(css, /overflow-y:\s*auto\s*!important/);
  assert.match(css, /rgb\(17 14 22\)/);
  assert.doesNotMatch(css, /width:\s*min\(80vw/);
  assert.doesNotMatch(css, /@media \(max-width: 900px\) and \(max-height:/);
});

test('the source header keeps the 140px logo and small close glyph', () => {
  assert.match(css, /width:\s*140px\s*!important/);
  assert.match(css, /max-width:\s*32vw\s*!important/);
  assert.match(css, /max-height:\s*30px\s*!important/);
  assert.match(css, /width:\s*44px\s*!important/);
  assert.match(css, /> button :is\(svg, img\)[\s\S]*width:\s*12px\s*!important/);
});

test('primary menu follows source p-2 gap-3 icon and arrow geometry', () => {
  assert.match(css, /nav:first-of-type[\s\S]*padding:\s*8px\s*!important/);
  assert.match(css, /nav:first-of-type[\s\S]*gap:\s*12px\s*!important/);
  assert.match(css, /grid-template-columns:\s*32px minmax\(0, 1fr\) 20px\s*!important/);
  assert.match(css, /transform:\s*scale\(\.85\)\s*!important/);
  assert.match(css, /font-size:\s*12px\s*!important/);
  assert.match(css, /line-height:\s*24px\s*!important/);
});

test('shortcut grid and guest actions use the source spacing and dimensions', () => {
  assert.match(css, /nav:nth-of-type\(2\)[\s\S]*margin:\s*16px 0 0\s*!important/);
  assert.match(css, /nav:nth-of-type\(2\)[\s\S]*padding:\s*12px 4px\s*!important/);
  assert.match(css, /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)\s*!important/);
  assert.match(css, /nav:nth-of-type\(2\)[\s\S]*gap:\s*16px\s*!important/);
  assert.match(css, /nav:nth-of-type\(2\) > a > span:first-child[\s\S]*width:\s*32px\s*!important/);
  assert.match(css, /button > img\[src\*='\/images\/flags\/'\][\s\S]*width:\s*24px\s*!important/);
  assert.match(css, /div:last-child[\s\S]*padding:\s*8px\s*!important/);
  assert.match(css, /div:last-child[\s\S]*gap:\s*12px\s*!important/);
  assert.match(css, /div:last-child > a[\s\S]*min-height:\s*38px\s*!important/);
  assert.match(css, /border-radius:\s*10px\s*!important/);
});
