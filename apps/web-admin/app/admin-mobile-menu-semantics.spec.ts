import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const controller = readFileSync(new URL('./admin-mobile-drawer-controller.tsx', import.meta.url), 'utf8');
const protectedLayout = readFileSync(new URL('./(admin)/layout.tsx', import.meta.url), 'utf8');

test('protected layout provides an accessible mobile menu label', () => {
  assert.match(protectedLayout, /openMenu: 'เปิดเมนูแอดมิน'/);
  assert.match(protectedLayout, /openMenu: 'Open admin menu'/);
  assert.match(protectedLayout, /className="admin-menu-button"[\s\S]*aria-label=\{copy\.openMenu\}/);
});

test('mobile controller preserves drawer semantics instead of desktop collapse semantics', () => {
  assert.match(controller, /if \(media\.matches\)/);
  assert.match(controller, /const label = open \? copy\.close : copy\.openMenu/);
  assert.match(controller, /menuButton\.setAttribute\('aria-expanded', String\(open\)\)/);
  assert.match(controller, /menuButton\.setAttribute\('aria-label', label\)/);
  assert.match(controller, /collapsed \? copy\.expandMenu : copy\.collapseMenu/);
});

test('menu semantics resynchronize when the responsive breakpoint changes', () => {
  assert.match(controller, /media\.addEventListener\('change', syncButtonState\)/);
  assert.match(controller, /media\.removeEventListener\('change', syncMediaState\)/);
});
