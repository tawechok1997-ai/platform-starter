import {
  isAdminPermissionAllowed,
  resolveAdminEffectivePermissions,
} from './admin-effective-access';

test('combines role and delegated permissions without duplicates', () => {
  const resolved = resolveAdminEffectivePermissions({
    rolePermissionCodes: ['members.view', 'withdraw.view'],
    delegatedPermissionCodes: ['withdraw.view', 'withdraw.approve'],
  });

  expect(resolved.permissions).toEqual(['members.view', 'withdraw.approve', 'withdraw.view']);
});

test('explicit deny wins over role and delegation permissions', () => {
  const resolved = resolveAdminEffectivePermissions({
    rolePermissionCodes: ['withdraw.approve'],
    delegatedPermissionCodes: ['withdraw.approve'],
    overrides: [{ permissionCode: 'withdraw.approve', effect: 'DENY' }],
  });

  expect(isAdminPermissionAllowed(resolved, 'withdraw.approve')).toBe(false);
  expect(resolved.deniedPermissions).toEqual(['withdraw.approve']);
});

test('specific deny blocks a wildcard account only for that permission', () => {
  const resolved = resolveAdminEffectivePermissions({
    rolePermissionCodes: [],
    roleCodes: ['owner'],
    overrides: [{ permissionCode: 'wallet.adjust', effect: 'DENY' }],
  });

  expect(resolved.hasWildcard).toBe(true);
  expect(isAdminPermissionAllowed(resolved, 'members.view')).toBe(true);
  expect(isAdminPermissionAllowed(resolved, 'wallet.adjust')).toBe(false);
});

test('wildcard deny removes all access', () => {
  const resolved = resolveAdminEffectivePermissions({
    rolePermissionCodes: ['members.view'],
    roleCodes: ['owner'],
    overrides: [{ permissionCode: '*', effect: 'DENY' }],
  });

  expect(resolved.permissions).toEqual([]);
  expect(isAdminPermissionAllowed(resolved, 'members.view')).toBe(false);
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

  expect(isAdminPermissionAllowed(resolved, 'members.view')).toBe(true);
});
