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
    permissions: permissionCodes.map((permissionCode) => ({
      code: permissionCode,
      module: permissionCode.split('.')[0],
    })),
  };
}

test('P2 publishes exactly five deterministic role templates', () => {
  expect(ADMIN_ROLE_TEMPLATES.map((template) => template.code)).toEqual(ADMIN_ROLE_TEMPLATE_CODES);
  expect(ADMIN_ROLE_TEMPLATES).toHaveLength(5);
  expect(
    new Set(ADMIN_ROLE_TEMPLATES.flatMap((template) => template.permissionCodes)).has(
      'admin.subordinates.create',
    ),
  ).toBe(true);
  expect(
    new Set(ADMIN_ROLE_TEMPLATES.flatMap((template) => template.permissionCodes)).has(
      'admin.teams.manage',
    ),
  ).toBe(true);
});

test('multi-role selection deduplicates roles and permissions while keeping an explicit primary role', () => {
  const finance = role('finance-id', 'finance', 40, ['wallet.view', 'reports.view']);
  const manager = role('manager-id', 'manager', 20, ['reports.view', 'admin.access.manage']);
  const selection = normalizeRoleSelection([finance, manager, finance], finance.id);

  expect(selection.roles.map((item) => item.code)).toEqual(['manager', 'finance']);
  expect(selection.primaryRole.code).toBe('finance');
  expect(selection.permissionCodes).toEqual(['admin.access.manage', 'reports.view', 'wallet.view']);
  expect(selection.modules).toEqual(['admin', 'reports', 'wallet']);
});

test('multi-role selection falls back to the highest authority role when primary is omitted', () => {
  const finance = role('finance-id', 'finance', 40, ['wallet.view']);
  const manager = role('manager-id', 'manager', 20, ['admin.access.manage']);
  const selection = normalizeRoleSelection([finance, manager]);

  expect(selection.primaryRole.code).toBe('manager');
});

test('grant policy blocks missing permissions and roles above the acting admin', () => {
  const actor = role('actor', 'manager', 30, ['users.view', 'reports.view']);
  const selected = role('selected', 'finance', 20, ['users.view', 'wallet.view']);
  const evaluation = evaluateRoleGrant([actor], [selected]);

  expect(evaluation.allowed).toBe(false);
  expect(evaluation.missingPermissionCodes).toEqual(['wallet.view']);
  expect(evaluation.reason).toBe('Selected roles contain permissions above the acting admin');
});

test('only protected wildcard actors can grant protected roles', () => {
  const ordinaryWildcard = role('system', 'system_admin', 15, ['*']);
  const owner = role('owner', 'owner', 1, ['*']);
  const protectedRole = role('super', 'super_admin', 1, ['*']);

  expect(evaluateRoleGrant([ordinaryWildcard], [protectedRole]).allowed).toBe(false);
  expect(evaluateRoleGrant([owner], [protectedRole]).allowed).toBe(true);
});
