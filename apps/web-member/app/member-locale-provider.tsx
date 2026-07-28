'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type MemberLocale = 'th' | 'en';

const STORAGE_KEY = 'member_locale';

type MemberLocaleContextValue = {
  locale: MemberLocale;
  setLocale: (locale: MemberLocale) => void;
  toggleLocale: () => void;
};

const MemberLocaleContext = createContext<MemberLocaleContextValue | null>(null);

export function MemberLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<MemberLocale>('th');

  const applyLocale = useCallback((nextLocale: MemberLocale) => {
    setLocaleState(nextLocale);
    document.documentElement.lang = nextLocale;
    document.documentElement.dataset.memberLocale = nextLocale;
    window.localStorage.setItem(STORAGE_KEY, nextLocale);
    window.dispatchEvent(new CustomEvent('member-locale-change', { detail: { locale: nextLocale } }));
  }, []);

  useEffect(() => {
    const storedLocale = window.localStorage.getItem(STORAGE_KEY);
    const initialLocale: MemberLocale = storedLocale === 'en' ? 'en' : 'th';
    setLocaleState(initialLocale);
    document.documentElement.lang = initialLocale;
    document.documentElement.dataset.memberLocale = initialLocale;

    const syncLocale = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const nextLocale: MemberLocale = event.newValue === 'en' ? 'en' : 'th';
      setLocaleState(nextLocale);
      document.documentElement.lang = nextLocale;
      document.documentElement.dataset.memberLocale = nextLocale;
    };

    window.addEventListener('storage', syncLocale);
    return () => window.removeEventListener('storage', syncLocale);
  }, []);

  const setLocale = useCallback((nextLocale: MemberLocale) => applyLocale(nextLocale), [applyLocale]);
  const toggleLocale = useCallback(() => applyLocale(locale === 'th' ? 'en' : 'th'), [applyLocale, locale]);

  const value = useMemo(() => ({ locale, setLocale, toggleLocale }), [locale, setLocale, toggleLocale]);

  /*
   * Legacy page bodies read member_locale only when they mount. Keying the
   * provider boundary remounts that subtree when the locale changes, so the
   * header, page content, footer and embedded widgets update in the same click
   * without requiring a manual browser refresh.
   */
  return <MemberLocaleContext.Provider key={locale} value={value}>{children}</MemberLocaleContext.Provider>;
}

export function useMemberLocale() {
  const context = useContext(MemberLocaleContext);
  if (!context) throw new Error('useMemberLocale must be used inside MemberLocaleProvider');
  return context;
}
