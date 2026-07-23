'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { adminApiFetch } from '../../admin-api';
import { hasAllAdminPermissions, hasAnyAdminPermission } from './admin-permission-contract';

type PermissionState = readonly string[] | null;
type PermissionListener = (permissions: readonly string[]) => void;

let cachedPermissions: PermissionState = null;
let pendingPermissions: Promise<readonly string[]> | null = null;
const listeners = new Set<PermissionListener>();

export function primeAdminPermissions(permissions: readonly string[]) {
  cachedPermissions = normalizePermissions(permissions);
  for (const listener of listeners) listener(cachedPermissions);
}

export async function loadAdminPermissions() {
  if (cachedPermissions) return cachedPermissions;
  if (pendingPermissions) return pendingPermissions;

  pendingPermissions = adminApiFetch('/admin/auth/me')
    .then(async (response) => {
      const payload = await response.json().catch(() => null);
      const permissions = response.ok && Array.isArray(payload?.permissions) ? payload.permissions : [];
      primeAdminPermissions(permissions);
      return cachedPermissions ?? [];
    })
    .catch(() => {
      primeAdminPermissions([]);
      return [];
    })
    .finally(() => {
      pendingPermissions = null;
    });

  return pendingPermissions;
}

export function useAdminPermissions() {
  const [permissions, setPermissions] = useState<PermissionState>(cachedPermissions);

  useEffect(() => {
    const listener: PermissionListener = (next) => setPermissions(next);
    listeners.add(listener);
    if (cachedPermissions) setPermissions(cachedPermissions);
    else void loadAdminPermissions();
    return () => { listeners.delete(listener); };
  }, []);

  const hasAny = useCallback((required: readonly string[]) => hasAnyAdminPermission(permissions ?? [], required), [permissions]);
  const hasAll = useCallback((required: readonly string[]) => hasAllAdminPermissions(permissions ?? [], required), [permissions]);

  return {
    permissions: permissions ?? [],
    ready: permissions !== null,
    hasAny,
    hasAll,
  };
}

export function AdminPermissionGate({ anyOf = [], allOf = [], fallback = null, children }: { anyOf?: readonly string[] | undefined; allOf?: readonly string[] | undefined; fallback?: ReactNode; children: ReactNode }) {
  const access = useAdminPermissions();
  if (!access.ready) return fallback;
  if (anyOf.length > 0 && !access.hasAny(anyOf)) return fallback;
  if (allOf.length > 0 && !access.hasAll(allOf)) return fallback;
  return children;
}

function normalizePermissions(permissions: readonly string[]) {
  return [...new Set(permissions.filter((permission): permission is string => typeof permission === 'string' && permission.trim().length > 0).map((permission) => permission.trim()))].sort();
}
