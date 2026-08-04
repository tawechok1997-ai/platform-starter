import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const navigation = readFileSync(new URL('./member-navigation-auth-controller.tsx', import.meta.url), 'utf8');
const popup = readFileSync(new URL('./member-shared-popup-runtime.tsx', import.meta.url), 'utf8');

test('shared promotion routes bypass canonical navigation rewriting', () => {
  assert.match(navigation, /if \(authAction && isSharedPopupTarget\(authAction\)\) return/);
  assert.match(navigation, /url\.pathname === '\/browse\/promotions'/);
  assert.match(navigation, /url\.pathname === '\/promotions'/);
});

test('shared popup runtime remains the route click owner', () => {
  assert.match(popup, /popupKindFromHref\(link\.getAttribute\('href'\)\)/);
  assert.match(popup, /url\.pathname === '\/promotions'/);
  assert.match(popup, /url\.pathname !== '\/browse\/promotions'/);
  assert.match(popup, /document\.addEventListener\('click', interceptSharedEntry, true\)/);
});
