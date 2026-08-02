import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateRoleGrant, normalizeRoleSelection, type AdminRolePolicyRole } from './admin-role-policy';
import { ADMIN_ROLE_TEMPLATE_CODES, ADMIN_ROLE_TEMPLATES } from './admin-role-templates';

function role(
  id: string,
  code: string,
  level: number,
  permissionCodes: string[],
): AdminRolePolicyRole {
  return {
    id,
    code,
    name: code,
    level,
    permissions: permissionCodes.map((permissionCode) => ({ code: permissionCode, module: permissionCode.split('.')[0] })),
  };
}

test('P2 publishes exactly five deterministic role templates', () => {
  assert.deepEqual(
    ADMIN_ROLE_TEMPLATES.map((template) => template.code),
    ADMIN_ROLE_TEMPLATE_CODES,
  );
  assert.equal(ADMIN_ROLE_TEMPLATES.length, 5);
  assert.equal(new Set(ADMIN_ROLE_TEMPLATES.flatMap((template) => template.permissionCodes)).has('admin.subordinates.create'), true);
  assert.equal(new Set(ADMIN_ROLE_TEMPLATES.flatMap((template) => template.permissionCodes)).has('admin.teams.manage'), true);
});

test('multi-role selection deduplicates roles and permissions while keeping an explicit primary role', () => {
  const finance = role('finance-id', 'finance', 40, ['wallet.view', 'reports.view']);
  const manager = role('manager-id', 'manager', 20, ['reports.view', 'admin.access.manage']);
  const selection = normalizeRoleSelection([finance, manager, finance], finance.id);

  assert.deepEqual(selection.roles.map((item) => item.code), ['manager', 'finance']);
  assert.equal(selection.primaryRole.code, 'finance');
  assert.deepEqual(selection.permissionCodes, ['admin.access.manage', 'reports.view', 'wallet.view']);
  assert.deepEqual(selection.modules, ['admin', 'reports', 'wallet']);
});

test('multi-role selection falls back to the highest authority role when primary is omitted', () => {
  const finance = role('finance-id', 'finance', 40, ['wallet.view']);
  const manager = role('manager-id', 'manager', 20, ['admin.access.manage']);
  const selection = normalizeRoleSelection([finance, manager]);

  assert.equal(selection.primaryRole.code, 'manager');
});

test('grant policy blocks missing permissions and roles above the acting admin', () => {
  const actor = role('actor', 'manager', 30, ['users.view', 'reports.view']);
  const selected = role('selected', 'finance', 20, ['users.view', 'wallet.view']);
  const evaluation = evaluateRoleGrant([actor], [selected]);

  assert.equal(evaluation.allowed, false);
  assert.deepEqual(evaluation.missingPermissionCodes, ['wallet.view']);
  assert.equal(evaluation.reason, 'Selected roles contain permissions above the acting admin');
});

test('only protected wildcard actors can grant protected roles', () => {
  const ordinaryWildcard = role('system', 'system_admin', 15, ['*']);
  const owner = role('owner', 'owner', 1, ['*']);
  const protectedRole = role('super', 'super_admin', 1, ['*']);

  assert.equal(evaluateRoleGrant([ordinaryWildcard], [protectedRole]).allowed, false);
  assert.equal(evaluateRoleGrant([owner], [protectedRole]).allowed, true);
});
