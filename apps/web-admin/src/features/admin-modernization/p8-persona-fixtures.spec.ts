import assert from 'node:assert/strict';
import test from 'node:test';

import {
  P8_PERSONA_FIXTURES,
  getP8PersonaFixture,
  resolveP8PersonaPermissions,
  validateP8PersonaFixtures,
} from './p8-persona-fixtures';

const rolePermissions: Readonly<Record<string, readonly string[]>> = {
  finance: ['wallet.view', 'reports.view'],
  deposit_withdrawal: ['wallet.view', 'topups.approve', 'withdraw.success'],
  marketing: ['promotion.view', 'settings.features.view', 'reports.view'],
  manager: ['admin.access.view', 'admin.access.manage', 'users.view'],
  system_admin: ['admin.access.view', 'provider.update', 'settings.features.view'],
};

test('persona fixtures use the five deterministic P2 role codes without wildcard shortcuts', () => {
  assert.equal(P8_PERSONA_FIXTURES.length, 7);
  assert.deepEqual(validateP8PersonaFixtures(), []);
  assert.equal(P8_PERSONA_FIXTURES.some((fixture) => fixture.roleCodes.includes('*')), false);
});

test('multi-role persona unions permissions and keeps its selected primary role', () => {
  const fixture = getP8PersonaFixture('multi-role');
  assert.ok(fixture);

  const resolved = resolveP8PersonaPermissions(fixture, rolePermissions);
  assert.ok(resolved);
  assert.equal(resolved.primaryRoleCode, 'finance');
  assert.deepEqual(resolved.permissionCodes, [
    'promotion.view',
    'reports.view',
    'settings.features.view',
    'wallet.view',
  ]);
});

test('explicit DENY wins over the selected role permission union', () => {
  const fixture = getP8PersonaFixture('explicit-deny');
  assert.ok(fixture);

  const resolved = resolveP8PersonaPermissions(fixture, rolePermissions);
  assert.ok(resolved);
  assert.deepEqual(resolved.deniedPermissionCodes, ['settings.features.view']);
  assert.deepEqual(resolved.permissionCodes, ['admin.access.view', 'provider.update']);
});

test('persona resolution fails closed when role data or primary-role selection is invalid', () => {
  const fixture = getP8PersonaFixture('finance');
  assert.ok(fixture);
  assert.equal(resolveP8PersonaPermissions(fixture, {}), null);
  assert.equal(resolveP8PersonaPermissions({ ...fixture, primaryRoleCode: 'manager' }, rolePermissions), null);
});
