import assert from 'node:assert/strict';
import test from 'node:test';

import { canAccessNavItem, canAccessPath, navGroups, requiredPermissionsForPath } from './admin-nav';

test('safe self-service routes remain available to an authenticated Admin', () => {
  for (const route of ['/dashboard', '/operations', '/profile', '/security']) {
    assert.equal(canAccessPath(route, []), true, `${route} should remain available`);
  }
});

test('registered operational routes require at least one matching permission', () => {
  assert.equal(canAccessPath('/members', []), false);
  assert.equal(canAccessPath('/members', ['users.view']), true);
  assert.equal(canAccessPath('/withdrawals/withdrawal-1', ['deposit.view']), false);
  assert.equal(canAccessPath('/withdrawals/withdrawal-1', ['withdraw.view']), true);
  assert.deepEqual(requiredPermissionsForPath('/admin-roles'), ['admin.access.view']);
});

test('unregistered routes fail closed for non-wildcard Admin sessions', () => {
  assert.equal(canAccessPath('/internal-page-without-rbac-registration', []), false);
  assert.equal(canAccessPath('/internal-page-without-rbac-registration', ['users.view']), false);
});

test('wildcard authority bypasses registered permissions but not route registration', () => {
  assert.equal(canAccessPath('/members', ['*']), true);
  assert.equal(canAccessPath('/internal-page-without-rbac-registration', ['*']), false);
});

test('navigation exposes only entries allowed by the Admin permission set', () => {
  const items = navGroups.flatMap((group) => group.items);
  const memberItem = items.find((item) => item.href === '/members');
  const withdrawalItem = items.find((item) => item.href === '/withdrawals');
  const securityItem = items.find((item) => item.href === '/security');
  assert.ok(memberItem && withdrawalItem && securityItem);
  assert.equal(canAccessNavItem(memberItem, ['users.view']), true);
  assert.equal(canAccessNavItem(memberItem, ['withdraw.view']), false);
  assert.equal(canAccessNavItem(withdrawalItem, ['withdraw.view']), true);
  assert.equal(canAccessNavItem(withdrawalItem, ['users.view']), false);
  assert.equal(canAccessNavItem(securityItem, []), true);
});