'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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
  revalidateOnMount = false,
}: SiteSettingsProviderProps) {
  const [settings, setSettings] = useState<PublicSiteSettings>(initialSettings);
  const [ready, setReady] = useState(true);

  const reload = useCallback(async () => {
    try {
      setSettings(await loadPublicSiteSettings());
    } catch {
      setSettings((current) => current ?? defaultSettings);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!revalidateOnMount) return;
    void reload();
  }, [reload, revalidateOnMount]);

  const typedSettings = useMemo(() => normalizeTypedSiteSettings(settings), [settings]);
  const value = useMemo(() => ({ settings, typedSettings, ready, reload }), [settings, typedSettings, ready, reload]);
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (!context) throw new Error('useSiteSettings must be used inside SiteSettingsProvider');
  return context;
}
