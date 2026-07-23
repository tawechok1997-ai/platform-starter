import assert from 'node:assert/strict';
import test from 'node:test';
import { ADMIN_PERMISSIONS, hasAllAdminPermissions, hasAnyAdminPermission } from './admin-permission-contract';

test('wildcard grants any and all permission requirements', () => {
  assert.equal(hasAnyAdminPermission([ADMIN_PERMISSIONS.wildcard], ['admin.access.manage']), true);
  assert.equal(hasAllAdminPermissions([ADMIN_PERMISSIONS.wildcard], ['admin.create', 'risk.view']), true);
});

test('any permission requirement accepts one matching permission', () => {
  assert.equal(hasAnyAdminPermission(['deposit.view'], ['topups.view', 'deposit.view']), true);
  assert.equal(hasAnyAdminPermission(['wallet.view'], ['topups.view', 'deposit.view']), false);
});

test('all permission requirement requires every permission', () => {
  assert.equal(hasAllAdminPermissions(['admin.create', 'admin.access.view'], ['admin.create', 'admin.access.view']), true);
  assert.equal(hasAllAdminPermissions(['admin.create'], ['admin.create', 'admin.access.view']), false);
});

test('empty requirements are accessible', () => {
  assert.equal(hasAnyAdminPermission([], []), true);
  assert.equal(hasAllAdminPermissions([], []), true);
});
