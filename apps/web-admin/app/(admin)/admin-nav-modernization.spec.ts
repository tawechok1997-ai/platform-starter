import assert from 'node:assert/strict';
import test from 'node:test';

import { navGroups, requiredPermissionsForPath, resolveNavItemHref } from './admin-nav';

test('sidebar exposes the complete permission-aware workspace directory', () => {
  const visible = navGroups.flatMap((group) => group.items.filter((item) => item.sidebar !== false));
  assert.equal(navGroups.length, 4);
  assert.ok(visible.length >= 40, `expected the complete Admin directory, received ${visible.length} entries`);
  assert.equal(new Set(visible.map((item) => item.href)).size, visible.length);
  assert.ok(visible.every((item) => item.title && item.titleEn));
  assert.ok(visible.every((item) => item.sidebar !== false));
});

test('finance workspace resolves to an accessible landing route', () => {
  const finance = navGroups.flatMap((group) => group.items).find((item) => item.titleEn === 'Finance');
  assert.ok(finance);
  assert.equal(resolveNavItemHref(finance, ['withdraw.view']), '/withdrawals');
  assert.equal(resolveNavItemHref(finance, ['wallet.view']), '/wallets');
  assert.equal(resolveNavItemHref(finance, ['reports.view']), '/reports');
  assert.equal(resolveNavItemHref(finance, ['*']), '/topups');
});

test('important specialist routes remain visible, searchable and deep-linkable', () => {
  const allItems = navGroups.flatMap((group) => group.items);
  const hrefs = new Set(allItems.map((item) => item.href));

  for (const href of ['/operations', '/withdrawals', '/wallet-ledgers', '/reports', '/member-insights', '/kyc-center', '/support-center', '/provider-presets', '/game-providers', '/webhook-logs', '/game-transfers', '/promotion-claims', '/admin-roles', '/audit', '/anti-bot']) {
    assert.ok(hrefs.has(href), `${href} must remain visible through the permission-aware sidebar and command search`);
  }
});

test('permission lookup preserves specialist route protection', () => {
  assert.deepEqual(requiredPermissionsForPath('/withdrawals/withdrawal-1'), ['withdraw.view']);
  assert.deepEqual(requiredPermissionsForPath('/admin-roles'), ['admin.access.view']);
  assert.deepEqual(requiredPermissionsForPath('/provider-presets'), ['game.providers.manage', 'provider.update']);
});
