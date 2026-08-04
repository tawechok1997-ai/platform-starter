'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { adminApiFetch } from '../../../app/admin-api';
import {
  getAdminWidgetLayoutStorageKey,
  moveAdminWidget,
  normalizeAdminWidgetLayout,
  parseAdminWidgetLayout,
  restoreDefaultAdminWidgetLayout,
  serializeAdminWidgetLayout,
  updateAdminWidgetLayoutItem,
  type AdminSavedWidgetLayout,
  type AdminWidgetLayoutItem,
  type AdminWidgetRegistry,
} from './chart-widget-contracts';

const DASHBOARD_LAYOUT_PREFERENCE_KEY = 'dashboard-widget-layout-v1';
const SAVE_DEBOUNCE_MS = 600;

export type AdminWidgetLayoutSyncState = 'loading' | 'saving' | 'saved' | 'local' | 'error';

export type AdminWidgetLayoutController = {
  ready: boolean;
  items: readonly AdminWidgetLayoutItem[];
  syncState: AdminWidgetLayoutSyncState;
  move: (widgetId: string, targetIndex: number) => void;
  update: (widgetId: string, patch: Partial<Omit<AdminWidgetLayoutItem, 'widgetId'>>) => void;
  restoreDefault: () => void;
};

type PreferenceResponse = {
  value?: unknown;
};

export function useAdminWidgetLayout(
  registry: AdminWidgetRegistry,
  adminUserId: string,
): AdminWidgetLayoutController {
  const defaults = useMemo(() => restoreDefaultAdminWidgetLayout(registry), [registry]);
  const [items, setItems] = useState<AdminWidgetLayoutItem[]>(defaults);
  const [ready, setReady] = useState(false);
  const [syncState, setSyncState] = useState<AdminWidgetLayoutSyncState>('loading');
  const acceptedSignatureRef = useRef('');
  const latestSignatureRef = useRef(layoutSignature(defaults));

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setSyncState('loading');
    if (!adminUserId.trim()) {
      acceptedSignatureRef.current = layoutSignature(defaults);
      latestSignatureRef.current = acceptedSignatureRef.current;
      setItems(defaults);
      setReady(true);
      setSyncState('local');
      return;
    }

    const key = getAdminWidgetLayoutStorageKey(adminUserId);
    let localSaved: AdminSavedWidgetLayout | null = null;
    try {
      localSaved = parseAdminWidgetLayout(window.localStorage.getItem(key), adminUserId);
    } catch {
      localSaved = null;
    }
    const localItems = normalizeAdminWidgetLayout(registry, localSaved?.items ?? defaults);
    setItems(localItems);
    latestSignatureRef.current = layoutSignature(localItems);

    void (async () => {
      try {
        const response = await adminApiFetch(`/admin/preferences/${DASHBOARD_LAYOUT_PREFERENCE_KEY}`);
        const payload = await response.json().catch(() => null) as PreferenceResponse | null;
        if (!response.ok) throw new Error('layout-preference-load-failed');
        const serverSaved = parsePreferencePayload(payload?.value, adminUserId);
        const serverIsNewer = Boolean(
          serverSaved && (!localSaved || timestamp(serverSaved.updatedAt) >= timestamp(localSaved.updatedAt)),
        );
        const selected = serverIsNewer ? serverSaved : localSaved;
        const selectedItems = normalizeAdminWidgetLayout(registry, selected?.items ?? defaults);
        const selectedSignature = layoutSignature(selectedItems);
        const serverSignature = serverSaved
          ? layoutSignature(normalizeAdminWidgetLayout(registry, serverSaved.items))
          : '';
        if (cancelled) return;

        setItems(selectedItems);
        latestSignatureRef.current = selectedSignature;
        acceptedSignatureRef.current = serverIsNewer || !localSaved ? selectedSignature : serverSignature;
        if (serverIsNewer && serverSaved) {
          window.localStorage.setItem(key, JSON.stringify(serverSaved));
        }
        setReady(true);
        setSyncState(serverSaved ? 'saved' : localSaved ? 'local' : 'saved');
      } catch {
        if (cancelled) return;
        acceptedSignatureRef.current = layoutSignature(localItems);
        latestSignatureRef.current = acceptedSignatureRef.current;
        setReady(true);
        setSyncState('local');
      }
    })();

    return () => { cancelled = true; };
  }, [adminUserId, defaults, registry]);

  useEffect(() => {
    if (!ready || !adminUserId.trim()) return;
    const signature = layoutSignature(items);
    latestSignatureRef.current = signature;
    if (signature === acceptedSignatureRef.current) return;

    const controller = new AbortController();
    const serialized = serializeAdminWidgetLayout(adminUserId, items, new Date().toISOString());
    try {
      window.localStorage.setItem(getAdminWidgetLayoutStorageKey(adminUserId), serialized);
    } catch {
      // The active layout remains usable even when browser storage is unavailable.
    }
    setSyncState('saving');

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await adminApiFetch(`/admin/preferences/${DASHBOARD_LAYOUT_PREFERENCE_KEY}`, {
            method: 'PATCH',
            signal: controller.signal,
            body: JSON.stringify({ value: JSON.parse(serialized) }),
          });
          const payload = await response.json().catch(() => null) as PreferenceResponse | null;
          if (!response.ok) throw new Error('layout-preference-save-failed');
          if (latestSignatureRef.current !== signature) return;
          acceptedSignatureRef.current = signature;
          const saved = parsePreferencePayload(payload?.value, adminUserId);
          if (saved) {
            window.localStorage.setItem(getAdminWidgetLayoutStorageKey(adminUserId), JSON.stringify(saved));
          }
          setSyncState('saved');
        } catch {
          if (controller.signal.aborted || latestSignatureRef.current !== signature) return;
          setSyncState('local');
        }
      })();
    }, SAVE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [adminUserId, items, ready]);

  useEffect(() => {
    if (!adminUserId.trim()) return;
    const key = getAdminWidgetLayoutStorageKey(adminUserId);
    const sync = (event: StorageEvent) => {
      if (event.key !== key) return;
      const saved = parseAdminWidgetLayout(event.newValue, adminUserId);
      const next = normalizeAdminWidgetLayout(registry, saved?.items);
      const signature = layoutSignature(next);
      acceptedSignatureRef.current = signature;
      latestSignatureRef.current = signature;
      setItems(next);
      setSyncState(saved ? 'saved' : 'local');
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [adminUserId, registry]);

  useEffect(() => {
    if (!adminUserId.trim()) return;
    let active = true;
    const refresh = () => {
      void (async () => {
        try {
          const response = await adminApiFetch(`/admin/preferences/${DASHBOARD_LAYOUT_PREFERENCE_KEY}`);
          const payload = await response.json().catch(() => null) as PreferenceResponse | null;
          const serverSaved = response.ok ? parsePreferencePayload(payload?.value, adminUserId) : null;
          const localSaved = parseAdminWidgetLayout(
            window.localStorage.getItem(getAdminWidgetLayoutStorageKey(adminUserId)),
            adminUserId,
          );
          if (!active || !serverSaved || timestamp(serverSaved.updatedAt) <= timestamp(localSaved?.updatedAt)) return;
          const next = normalizeAdminWidgetLayout(registry, serverSaved.items);
          const signature = layoutSignature(next);
          acceptedSignatureRef.current = signature;
          latestSignatureRef.current = signature;
          window.localStorage.setItem(getAdminWidgetLayoutStorageKey(adminUserId), JSON.stringify(serverSaved));
          setItems(next);
          setSyncState('saved');
        } catch {
          // Keep the local layout when the server cannot be reached.
        }
      })();
    };
    window.addEventListener('focus', refresh);
    return () => {
      active = false;
      window.removeEventListener('focus', refresh);
    };
  }, [adminUserId, registry]);

  const move = useCallback((widgetId: string, targetIndex: number) => {
    setItems((current) => moveAdminWidget(current, widgetId, targetIndex));
  }, []);

  const update = useCallback((widgetId: string, patch: Partial<Omit<AdminWidgetLayoutItem, 'widgetId'>>) => {
    setItems((current) => updateAdminWidgetLayoutItem(current, widgetId, patch));
  }, []);

  const restoreDefault = useCallback(() => setItems(defaults), [defaults]);

  return { ready, items, syncState, move, update, restoreDefault };
}

function parsePreferencePayload(value: unknown, adminUserId: string): AdminSavedWidgetLayout | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return parseAdminWidgetLayout(JSON.stringify(value), adminUserId);
}

function layoutSignature(items: readonly AdminWidgetLayoutItem[]) {
  return JSON.stringify(items);
}

function timestamp(value: string | null | undefined) {
  const parsed = value ? Date.parse(value) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}
