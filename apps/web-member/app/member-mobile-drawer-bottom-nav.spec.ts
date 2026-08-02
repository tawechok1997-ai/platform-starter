import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('./member-mobile-drawer-bottom-nav.css', import.meta.url), 'utf8');
const imports = readFileSync(new URL('./member-source-fonts.css', import.meta.url), 'utf8');

test('bottom navigation is visible only on the mobile home surface with the drawer closed', () => {
  assert.match(css, /html:not\(\[data-mobile-member-home-surface='true'\]\)/);
  assert.match(css, /aria-controls='mobile-home-drawer'/);
  assert.match(css, /aria-expanded='true'/);
  assert.match(css, /data-mobile-member-bottom-navigation='true'/);
  assert.match(css, /display:\s*none\s*!important/);
  assert.match(css, /visibility:\s*hidden\s*!important/);
  assert.match(css, /pointer-events:\s*none\s*!important/);
  assert.match(css, /padding-bottom:\s*0\s*!important/);
  assert.match(imports, /member-mobile-drawer-bottom-nav\.css/);
});
