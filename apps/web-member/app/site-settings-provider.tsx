'use client';

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { defaultSettings, loadPublicSiteSettings, PublicSiteSettings } from './site-settings';
import type { TypedPublicSiteSettings } from './site-settings-types';
import { normalizeTypedSiteSettings } from './typed-site-settings';

type SiteSettingsContextValue = {
  settings: PublicSiteSettings;
  typedSettings: TypedPublicSiteSettings;
  ready: boolean;
  reload: () => Promise<void>;
};

const SiteSettingsContext = createContext<SiteSettingsContextValue | null>(null);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PublicSiteSettings>(defaultSettings);
  const [ready, setReady] = useState(false);

  async function reload() {
    try {
      setSettings(await loadPublicSiteSettings());
    } catch {
      setSettings(defaultSettings);
    } finally {
      setReady(true);
    }
  }

  useEffect(() => { reload(); }, []);

  const typedSettings = useMemo(() => normalizeTypedSiteSettings(settings), [settings]);
  const value = useMemo(() => ({ settings, typedSettings, ready, reload }), [settings, typedSettings, ready]);
  return <SiteSettingsContext.Provider value={value}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  const context = useContext(SiteSettingsContext);
  if (!context) throw new Error('useSiteSettings must be used inside SiteSettingsProvider');
  return context;
}
