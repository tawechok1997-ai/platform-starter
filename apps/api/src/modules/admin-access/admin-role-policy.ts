const SUPER_PERMISSION = '*';
const PROTECTED_ROLE_CODES = new Set(['owner', 'super_admin']);

export type AdminRolePolicyPermission = {
  code: string;
  module?: string | null;
  name?: string | null;
};

export type AdminRolePolicyRole = {
  id: string;
  code: string;
  name: string;
  level: number;
  permissions: AdminRolePolicyPermission[];
};

export type AdminRoleSelection = {
  roles: AdminRolePolicyRole[];
  primaryRole: AdminRolePolicyRole;
  permissionCodes: string[];
  modules: string[];
  protected: boolean;
};

export type AdminRoleGrantEvaluation = {
  allowed: boolean;
  actorHasWildcard: boolean;
  actorBestLevel: number;
  selectedBestLevel: number;
  missingPermissionCodes: string[];
  protectedRoleCodes: string[];
  reason: string | null;
};

export function normalizeRoleSelection(
  rolesInput: AdminRolePolicyRole[],
  primaryRoleIdInput?: string | null,
): AdminRoleSelection {
  const uniqueRoles = Array.from(new Map(rolesInput.map((role) => [role.id, role])).values());
  if (uniqueRoles.length === 0) throw new Error('At least one role is required');

  const orderedRoles = [...uniqueRoles].sort((left, right) => {
    if (left.level !== right.level) return left.level - right.level;
    return left.code.localeCompare(right.code);
  });
  const primaryRole = primaryRoleIdInput
    ? orderedRoles.find((role) => role.id === primaryRoleIdInput)
    : orderedRoles[0];
  if (!primaryRole) throw new Error('Primary role must be included in the selected roles');

  const permissionMap = new Map<string, AdminRolePolicyPermission>();
  for (const role of orderedRoles) {
    for (const permission of role.permissions) {
      if (!permissionMap.has(permission.code)) permissionMap.set(permission.code, permission);
    }
  }

  const permissions = [...permissionMap.values()].sort((left, right) => left.code.localeCompare(right.code));
  return {
    roles: orderedRoles,
    primaryRole,
    permissionCodes: permissions.map((permission) => permission.code),
    modules: Array.from(new Set(permissions.map((permission) => permission.module).filter((module): module is string => Boolean(module)))).sort(),
    protected: orderedRoles.some((role) => PROTECTED_ROLE_CODES.has(role.code) || role.permissions.some((permission) => permission.code === SUPER_PERMISSION)),
  };
}

export function evaluateRoleGrant(
  actorRoles: AdminRolePolicyRole[],
  selectedRoles: AdminRolePolicyRole[],
): AdminRoleGrantEvaluation {
  const actorPermissionCodes = new Set(actorRoles.flatMap((role) => role.permissions.map((permission) => permission.code)));
  const actorHasWildcard = actorPermissionCodes.has(SUPER_PERMISSION);
  const actorProtected = actorRoles.some((role) => PROTECTED_ROLE_CODES.has(role.code));
  const actorBestLevel = actorRoles.length === 0 ? Number.POSITIVE_INFINITY : Math.min(...actorRoles.map((role) => role.level));
  const selectedBestLevel = selectedRoles.length === 0 ? Number.POSITIVE_INFINITY : Math.min(...selectedRoles.map((role) => role.level));
  const selectedPermissionCodes = Array.from(new Set(selectedRoles.flatMap((role) => role.permissions.map((permission) => permission.code))));
  const missingPermissionCodes = actorHasWildcard
    ? []
    : selectedPermissionCodes.filter((code) => !actorPermissionCodes.has(code)).sort();
  const protectedRoleCodes = selectedRoles
    .filter((role) => PROTECTED_ROLE_CODES.has(role.code) || role.permissions.some((permission) => permission.code === SUPER_PERMISSION))
    .map((role) => role.code)
    .sort();

  let reason: string | null = null;
  if (selectedRoles.length === 0) reason = 'At least one role is required';
  else if (protectedRoleCodes.length > 0 && (!actorHasWildcard || !actorProtected)) {
    reason = 'Only a protected owner-level admin can grant protected roles';
  } else if (missingPermissionCodes.length > 0) {
    reason = 'Selected roles contain permissions above the acting admin';
  } else if (!actorHasWildcard && selectedBestLevel < actorBestLevel) {
    reason = 'Selected roles are above the acting admin level';
  }

  return {
    allowed: reason === null,
    actorHasWildcard,
    actorBestLevel,
    selectedBestLevel,
    missingPermissionCodes,
    protectedRoleCodes,
    reason,
  };
}
