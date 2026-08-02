import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isAdminPermissionAllowed,
  resolveAdminEffectivePermissions,
} from './admin-effective-access';

test('combines role and delegated permissions without duplicates', () => {
  const resolved = resolveAdminEffectivePermissions({
    rolePermissionCodes: ['members.view', 'withdraw.view'],
    delegatedPermissionCodes: ['withdraw.view', 'withdraw.approve'],
  });

  assert.deepEqual(resolved.permissions, ['members.view', 'withdraw.approve', 'withdraw.view']);
});

test('explicit deny wins over role and delegation permissions', () => {
  const resolved = resolveAdminEffectivePermissions({
    rolePermissionCodes: ['withdraw.approve'],
    delegatedPermissionCodes: ['withdraw.approve'],
    overrides: [{ permissionCode: 'withdraw.approve', effect: 'DENY' }],
  });

  assert.equal(isAdminPermissionAllowed(resolved, 'withdraw.approve'), false);
  assert.deepEqual(resolved.deniedPermissions, ['withdraw.approve']);
});

test('specific deny blocks a wildcard account only for that permission', () => {
  const resolved = resolveAdminEffectivePermissions({
    rolePermissionCodes: [],
    roleCodes: ['owner'],
    overrides: [{ permissionCode: 'wallet.adjust', effect: 'DENY' }],
  });

  assert.equal(resolved.hasWildcard, true);
  assert.equal(isAdminPermissionAllowed(resolved, 'members.view'), true);
  assert.equal(isAdminPermissionAllowed(resolved, 'wallet.adjust'), false);
});

test('wildcard deny removes all access', () => {
  const resolved = resolveAdminEffectivePermissions({
    rolePermissionCodes: ['members.view'],
    roleCodes: ['owner'],
    overrides: [{ permissionCode: '*', effect: 'DENY' }],
  });

  assert.deepEqual(resolved.permissions, []);
  assert.equal(isAdminPermissionAllowed(resolved, 'members.view'), false);
});

test('expired overrides are ignored', () => {
  const now = new Date('2026-08-03T00:00:00.000Z');
  const resolved = resolveAdminEffectivePermissions({
    rolePermissionCodes: ['members.view'],
    overrides: [
      {
        permissionCode: 'members.view',
        effect: 'DENY',
        expiresAt: new Date('2026-08-02T23:59:59.000Z'),
      },
    ],
    now,
  });

  assert.equal(isAdminPermissionAllowed(resolved, 'members.view'), true);
});
