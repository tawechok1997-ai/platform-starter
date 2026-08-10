'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { defaultSettings, loadPublicSiteSettings, PublicSiteSettings } from './site-settings';
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
        setSettings(await loadPublicSiteSettings());
      } catch {
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
