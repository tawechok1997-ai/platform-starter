'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../../app/admin-api';

export function useAdminPermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await adminApiFetch('/admin/auth/me');
        const data = await response.json().catch(() => null);
        if (!cancelled && response.ok) setPermissions(Array.isArray(data?.permissions) ? data.permissions : []);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return useMemo(() => ({
    ready,
    permissions,
    can(permission: string) {
      return permissions.includes('*') || permissions.includes(permission);
    },
  }), [permissions, ready]);
}
