import type { P8PersonaId } from './p8-release-matrix';

export type P8PersonaFixture = {
  id: P8PersonaId;
  roleCodes: readonly string[];
  primaryRoleCode: string;
  deniedPermissionCodes: readonly string[];
};

export type P8ResolvedPersona = P8PersonaFixture & {
  permissionCodes: readonly string[];
};

export const P8_PERSONA_FIXTURES: readonly P8PersonaFixture[] = [
  fixture('finance', ['finance'], 'finance'),
  fixture('deposit-withdrawal', ['deposit_withdrawal'], 'deposit_withdrawal'),
  fixture('marketing', ['marketing'], 'marketing'),
  fixture('manager', ['manager'], 'manager'),
  fixture('system-admin', ['system_admin'], 'system_admin'),
  fixture('multi-role', ['finance', 'marketing'], 'finance'),
  fixture('explicit-deny', ['system_admin'], 'system_admin', ['settings.features.view']),
];

export function getP8PersonaFixture(id: P8PersonaId) {
  return P8_PERSONA_FIXTURES.find((fixtureDefinition) => fixtureDefinition.id === id) ?? null;
}

export function resolveP8PersonaPermissions(
  fixtureDefinition: P8PersonaFixture,
  rolePermissionCodes: Readonly<Record<string, readonly string[]>>,
): P8ResolvedPersona | null {
  if (!fixtureDefinition.roleCodes.includes(fixtureDefinition.primaryRoleCode)) return null;

  const rolePermissions = fixtureDefinition.roleCodes.map((roleCode) => rolePermissionCodes[roleCode]);
  if (rolePermissions.some((permissionCodes) => !permissionCodes)) return null;

  const denied = new Set(fixtureDefinition.deniedPermissionCodes);
  const permissions = [...new Set(rolePermissions.flatMap((permissionCodes) => permissionCodes ?? []))]
    .filter((permissionCode) => !denied.has(permissionCode))
    .sort();

  return Object.freeze({
    ...fixtureDefinition,
    roleCodes: Object.freeze([...fixtureDefinition.roleCodes]),
    deniedPermissionCodes: Object.freeze([...fixtureDefinition.deniedPermissionCodes]),
    permissionCodes: Object.freeze(permissions),
  });
}

export function validateP8PersonaFixtures(fixtures: readonly P8PersonaFixture[] = P8_PERSONA_FIXTURES) {
  const findings: string[] = [];
  const ids = new Set<string>();

  for (const fixtureDefinition of fixtures) {
    if (ids.has(fixtureDefinition.id)) findings.push(`duplicate-persona:${fixtureDefinition.id}`);
    ids.add(fixtureDefinition.id);
    if (fixtureDefinition.roleCodes.length === 0) findings.push(`missing-role:${fixtureDefinition.id}`);
    if (!fixtureDefinition.roleCodes.includes(fixtureDefinition.primaryRoleCode)) {
      findings.push(`primary-role-not-selected:${fixtureDefinition.id}`);
    }
    if (fixtureDefinition.id === 'explicit-deny' && fixtureDefinition.deniedPermissionCodes.length === 0) {
      findings.push('explicit-deny-without-deny');
    }
  }

  return Object.freeze(findings);
}

function fixture(
  id: P8PersonaId,
  roleCodes: readonly string[],
  primaryRoleCode: string,
  deniedPermissionCodes: readonly string[] = [],
): P8PersonaFixture {
  return Object.freeze({
    id,
    roleCodes: Object.freeze([...roleCodes]),
    primaryRoleCode,
    deniedPermissionCodes: Object.freeze([...deniedPermissionCodes]),
  });
}
