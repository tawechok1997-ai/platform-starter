const SUPER_PERMISSION = '*';
const SUPER_ROLE_CODES = new Set(['owner', 'super_admin']);

export type AdminPermissionOverrideEffect = 'ALLOW' | 'DENY';

export type AdminPermissionOverrideRecord = {
  permissionCode: string;
  effect: AdminPermissionOverrideEffect;
  expiresAt?: Date | string | null;
};

export type ResolveAdminEffectivePermissionsInput = {
  rolePermissionCodes: string[];
  delegatedPermissionCodes?: string[];
  roleCodes?: string[];
  overrides?: AdminPermissionOverrideRecord[];
  now?: Date;
};

export type ResolvedAdminEffectivePermissions = {
  permissions: string[];
  deniedPermissions: string[];
  allowedOverrides: string[];
  deniedOverrides: string[];
  hasWildcard: boolean;
};

function isActiveOverride(override: AdminPermissionOverrideRecord, now: Date) {
  if (!override.expiresAt) return true;
  const expiresAt = override.expiresAt instanceof Date ? override.expiresAt : new Date(override.expiresAt);
  return Number.isFinite(expiresAt.getTime()) && expiresAt > now;
}

export function resolveAdminEffectivePermissions(
  input: ResolveAdminEffectivePermissionsInput,
): ResolvedAdminEffectivePermissions {
  const now = input.now ?? new Date();
  const base = new Set(
    [...(input.rolePermissionCodes ?? []), ...(input.delegatedPermissionCodes ?? [])]
      .map((code) => String(code).trim())
      .filter(Boolean),
  );

  if ((input.roleCodes ?? []).some((code) => SUPER_ROLE_CODES.has(code))) {
    base.add(SUPER_PERMISSION);
  }

  const activeOverrides = (input.overrides ?? []).filter((override) => isActiveOverride(override, now));
  const allowedOverrides = new Set<string>();
  const deniedOverrides = new Set<string>();

  for (const override of activeOverrides) {
    const code = String(override.permissionCode ?? '').trim();
    if (!code) continue;
    if (override.effect === 'DENY') deniedOverrides.add(code);
    if (override.effect === 'ALLOW') allowedOverrides.add(code);
  }

  for (const code of allowedOverrides) base.add(code);

  if (deniedOverrides.has(SUPER_PERMISSION)) {
    base.clear();
  } else {
    for (const code of deniedOverrides) base.delete(code);
  }

  return {
    permissions: Array.from(base).sort(),
    deniedPermissions: Array.from(deniedOverrides).sort(),
    allowedOverrides: Array.from(allowedOverrides).sort(),
    deniedOverrides: Array.from(deniedOverrides).sort(),
    hasWildcard: base.has(SUPER_PERMISSION) && !deniedOverrides.has(SUPER_PERMISSION),
  };
}

export function isAdminPermissionAllowed(
  resolved: Pick<ResolvedAdminEffectivePermissions, 'permissions' | 'deniedPermissions'>,
  permissionCode: string,
) {
  const code = String(permissionCode ?? '').trim();
  if (!code) return false;
  if (resolved.deniedPermissions.includes(SUPER_PERMISSION)) return false;
  if (resolved.deniedPermissions.includes(code)) return false;
  return resolved.permissions.includes(SUPER_PERMISSION) || resolved.permissions.includes(code);
}
