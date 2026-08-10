'use client';

import { useEffect, useRef } from 'react';
import { ADMIN_IDENTITY_INVALIDATED_EVENT, adminApiFetch } from './admin-api';

const ACCESS_REFRESH_INTERVAL_MS = 30_000;

export function AdminAccessRefreshRuntime() {
  const accessSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let reloading = false;

    async function readAccessSignature() {
      try {
        const response = await adminApiFetch('/admin/auth/me', { cache: 'no-store' });
        const data = await response.json().catch(() => null) as {
          permissions?: unknown;
          roles?: unknown;
          workspaceAssignments?: unknown;
          workspaces?: unknown;
          primaryWorkspaceId?: unknown;
        } | null;
        if (cancelled || !response.ok || !data) return;

        const signature = stableAccessSignature(data);
        if (accessSignatureRef.current === null) {
          accessSignatureRef.current = signature;
          return;
        }
        if (signature === accessSignatureRef.current || reloading) return;

        accessSignatureRef.current = signature;
        reloading = true;
        window.location.reload();
      } catch {
        // Authentication/session policy is owned by the protected layout.
        // A transient refresh failure must not log the operator out.
      }
    }

    const refresh = () => { void readAccessSignature(); };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };

    refresh();
    window.addEventListener(ADMIN_IDENTITY_INVALIDATED_EVENT, refresh);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    const timer = window.setInterval(refresh, ACCESS_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.removeEventListener(ADMIN_IDENTITY_INVALIDATED_EVENT, refresh);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.clearInterval(timer);
    };
  }, []);

  return null;
}

function stableAccessSignature(value: {
  permissions?: unknown;
  roles?: unknown;
  workspaceAssignments?: unknown;
  workspaces?: unknown;
  primaryWorkspaceId?: unknown;
}) {
  return JSON.stringify({
    permissions: normalizeArray(value.permissions),
    roles: normalizeArray(value.roles),
    workspaceAssignments: normalizeArray(value.workspaceAssignments),
    workspaces: normalizeArray(value.workspaces),
    primaryWorkspaceId: value.primaryWorkspaceId ?? null,
  });
}

function normalizeArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return [...value].map((item) => normalizeValue(item)).sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
}

function normalizeValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((item) => normalizeValue(item));
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, normalizeValue(item)]),
  );
}
