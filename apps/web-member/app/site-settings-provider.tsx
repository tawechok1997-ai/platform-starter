'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { defaultSettings, PublicSiteSettings } from './site-settings';
import type { TypedPublicSiteSettings } from './site-settings-types';
import { normalizeTypedSiteSettings } from './typed-site-settings';

type SiteSettingsContextValue = {
  settings: PublicSiteSettings;
  typedSettings: TypedPublicSiteSettings;
  ready: boolean;
  reload: () => Promise<void>;
};

type SiteSettingsProviderProps = {
  children: ReactNode;
  initialSettings?: PublicSiteSettings;
  revalidateOnMount?: boolean;
};

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);
const LIVE_SETTINGS_ENDPOINT = '/api/site-settings';

export function SiteSettingsProvider({
  children,
  initialSettings = defaultSettings,
  revalidateOnMount = true,
}: SiteSettingsProviderProps) {
  const [settings, setSettings] = useState<PublicSiteSettings>(initialSettings);
  const [ready, setReady] = useState(true);
  const reloadInFlight = useRef<Promise<void> | null>(null);

  const reload = useCallback(async () => {
    if (reloadInFlight.current) return reloadInFlight.current;

    const task = (async () => {
      try {
        const response = await fetch(LIVE_SETTINGS_ENDPOINT, {
          method: 'GET',
          cache: 'no-store',
          headers: { accept: 'application/json' },
        });
        if (!response.ok) throw new Error(`Site settings refresh failed with ${response.status}`);
        const nextSettings = await response.json() as PublicSiteSettings;
        setSettings(nextSettings);
      } catch {
        // Preserve the last known-good snapshot. Falling all the way back to
        // defaults after a transient network failure would visibly undo an
        // operator's theme while the page is open.
        setSettings((current) => current ?? defaultSettings);
      } finally {
        setReady(true);
        reloadInFlight.current = null;
      }
    })();

    reloadInFlight.current = task;
    return task;
  }, []);

  useEffect(() => {
    if (!revalidateOnMount) return;
    void reload();
  }, [reload, revalidateOnMount]);

  useEffect(() => {
    let lastReloadAt = 0;
    const reloadWhenActive = () => {
      if (document.visibilityState === 'hidden') return;
      const now = Date.now();
      if (now - lastReloadAt < 1500) return;
      lastReloadAt = now;
      void reload();
    };

    window.addEventListener('focus', reloadWhenActive);
    document.addEventListener('visibilitychange', reloadWhenActive);
    return () => {
      window.removeEventListener('focus', reloadWhenActive);
      document.removeEventListener('visibilitychange', reloadWhenActive);
    };
  }, [reload]);

  const typedSettings = useMemo(() => normalizeTypedSiteSettings(settings), [settings]);
  const value = useMemo(() => ({ settings, typedSettings, ready, reload }), [settings, typedSettings, ready, reload]);
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (!context) throw new Error('useSiteSettings must be used inside SiteSettingsProvider');
  return context;
}
