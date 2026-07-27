import assert from 'node:assert/strict';
import test from 'node:test';

import { navGroups, requiredPermissionsForPath, resolveNavItemHref } from './admin-nav';

test('sidebar exposes the complete permission-aware workspace directory', () => {
  const visible = navGroups.flatMap((group) => group.items.filter((item) => item.sidebar !== false));
  assert.equal(navGroups.length, 9);
  assert.deepEqual(navGroups.map((group) => group.id), ['overview', 'finance', 'members', 'risk', 'providers', 'games', 'growth', 'content', 'administration']);
  assert.ok(visible.length >= 40, `expected the complete Admin directory, received ${visible.length} entries`);
  assert.equal(new Set(visible.map((item) => item.href)).size, visible.length);
  assert.ok(visible.every((item) => item.title && item.titleEn));
  assert.ok(visible.every((item) => item.sidebar !== false));
});

test('finance workspace resolves to accessible permission-aware routes', () => {
  const finance = navGroups.find((group) => group.id === 'finance');
  assert.ok(finance);

  const topups = finance.items.find((item) => item.href === '/topups');
  const withdrawals = finance.items.find((item) => item.href === '/withdrawals');
  const wallets = finance.items.find((item) => item.href === '/wallets');
  const reports = finance.items.find((item) => item.href === '/reports');

  assert.ok(topups);
  assert.ok(withdrawals);
  assert.ok(wallets);
  assert.ok(reports);
  assert.equal(resolveNavItemHref(withdrawals, ['withdraw.view']), '/withdrawals');
  assert.equal(resolveNavItemHref(wallets, ['wallet.view']), '/wallets');
  assert.equal(resolveNavItemHref(reports, ['reports.view']), '/reports');
  assert.equal(resolveNavItemHref(topups, ['*']), '/topups');
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
