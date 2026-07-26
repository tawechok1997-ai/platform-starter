import assert from 'node:assert/strict';
import test from 'node:test';

import { navGroups, requiredPermissionsForPath, resolveNavItemHref } from './admin-nav';

test('daily sidebar exposes exactly eleven workspace entries', () => {
  const visible = navGroups.flatMap((group) => group.items.filter((item) => item.sidebar !== false));
  assert.equal(navGroups.length, 4);
  assert.equal(visible.length, 11);
  assert.equal(new Set(visible.map((item) => item.href)).size, visible.length);
  assert.ok(visible.every((item) => item.title && item.titleEn));
});

test('finance workspace resolves to an accessible landing route', () => {
  const finance = navGroups.flatMap((group) => group.items).find((item) => item.titleEn === 'Finance');
  assert.ok(finance);
  assert.equal(resolveNavItemHref(finance, ['withdraw.view']), '/withdrawals');
  assert.equal(resolveNavItemHref(finance, ['wallet.view']), '/wallets');
  assert.equal(resolveNavItemHref(finance, ['reports.view']), '/reports');
  assert.equal(resolveNavItemHref(finance, ['*']), '/topups');
});

test('specialist routes remain searchable without crowding the sidebar', () => {
  const allItems = navGroups.flatMap((group) => group.items);
  const hiddenHrefs = new Set(allItems.filter((item) => item.sidebar === false).map((item) => item.href));

  for (const href of ['/withdrawals', '/wallet-ledgers', '/kyc-center', '/provider-presets', '/game-transfers', '/promotion-claims', '/admin-roles', '/anti-bot']) {
    assert.ok(hiddenHrefs.has(href), `${href} must remain available through command search and deep links`);
  }
});

test('permission lookup preserves specialist route protection', () => {
  assert.deepEqual(requiredPermissionsForPath('/withdrawals/withdrawal-1'), ['withdraw.view']);
  assert.deepEqual(requiredPermissionsForPath('/admin-roles'), ['admin.access.view']);
  assert.deepEqual(requiredPermissionsForPath('/provider-presets'), ['game.providers.manage', 'provider.update']);
});
