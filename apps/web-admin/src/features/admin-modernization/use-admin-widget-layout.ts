'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getAdminWidgetLayoutStorageKey,
  moveAdminWidget,
  normalizeAdminWidgetLayout,
  parseAdminWidgetLayout,
  restoreDefaultAdminWidgetLayout,
  serializeAdminWidgetLayout,
  updateAdminWidgetLayoutItem,
  type AdminWidgetLayoutItem,
  type AdminWidgetRegistry,
} from './chart-widget-contracts';

export type AdminWidgetLayoutController = {
  ready: boolean;
  items: readonly AdminWidgetLayoutItem[];
  move: (widgetId: string, targetIndex: number) => void;
  update: (widgetId: string, patch: Partial<Omit<AdminWidgetLayoutItem, 'widgetId'>>) => void;
  restoreDefault: () => void;
};

export function useAdminWidgetLayout(
  registry: AdminWidgetRegistry,
  adminUserId: string,
): AdminWidgetLayoutController {
  const defaults = useMemo(() => restoreDefaultAdminWidgetLayout(registry), [registry]);
  const [items, setItems] = useState<AdminWidgetLayoutItem[]>(defaults);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    if (!adminUserId.trim()) {
      setItems(defaults);
      return;
    }

    try {
      const key = getAdminWidgetLayoutStorageKey(adminUserId);
      const saved = parseAdminWidgetLayout(window.localStorage.getItem(key), adminUserId);
      setItems(normalizeAdminWidgetLayout(registry, saved?.items));
    } catch {
      setItems(defaults);
    } finally {
      setReady(true);
    }
  }, [adminUserId, defaults, registry]);

  useEffect(() => {
    if (!ready || !adminUserId.trim()) return;
    try {
      const key = getAdminWidgetLayoutStorageKey(adminUserId);
      window.localStorage.setItem(key, serializeAdminWidgetLayout(adminUserId, items));
    } catch {
      // The active layout remains available for this session when storage is unavailable.
    }
  }, [adminUserId, items, ready]);

  useEffect(() => {
    if (!adminUserId.trim()) return;
    const key = getAdminWidgetLayoutStorageKey(adminUserId);
    const sync = (event: StorageEvent) => {
      if (event.key !== key) return;
      const saved = parseAdminWidgetLayout(event.newValue, adminUserId);
      setItems(normalizeAdminWidgetLayout(registry, saved?.items));
    };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [adminUserId, registry]);

  const move = useCallback((widgetId: string, targetIndex: number) => {
    setItems((current) => moveAdminWidget(current, widgetId, targetIndex));
  }, []);

  const update = useCallback((widgetId: string, patch: Partial<Omit<AdminWidgetLayoutItem, 'widgetId'>>) => {
    setItems((current) => updateAdminWidgetLayoutItem(current, widgetId, patch));
  }, []);

  const restoreDefault = useCallback(() => setItems(defaults), [defaults]);

  return { ready, items, move, update, restoreDefault };
}
