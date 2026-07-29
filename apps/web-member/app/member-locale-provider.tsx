'use client';

import {
  Fragment,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';

export type MemberLocale = 'th' | 'en';

const STORAGE_KEY = 'member_locale';

type MemberLocaleContextValue = {
  locale: MemberLocale;
  setLocale: (locale: MemberLocale) => void;
  toggleLocale: () => void;
};

const MemberLocaleContext = createContext<MemberLocaleContextValue | null>(null);

function normalizeLocale(value: string | null | undefined): MemberLocale {
  return value === 'en' ? 'en' : 'th';
}

function applyLocaleToDocument(locale: MemberLocale) {
  document.documentElement.lang = locale;
  document.documentElement.dataset.memberLocale = locale;
}

export function MemberLocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<MemberLocale>('th');

  const commitLocale = useCallback((nextLocale: MemberLocale) => {
    flushSync(() => setLocaleState(nextLocale));
    applyLocaleToDocument(nextLocale);
    window.localStorage.setItem(STORAGE_KEY, nextLocale);
  }, []);

  useEffect(() => {
    const initialLocale = normalizeLocale(window.localStorage.getItem(STORAGE_KEY));
    setLocaleState(initialLocale);
    applyLocaleToDocument(initialLocale);

    const syncStorageLocale = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const nextLocale = normalizeLocale(event.newValue);
      flushSync(() => setLocaleState(nextLocale));
      applyLocaleToDocument(nextLocale);
    };

    window.addEventListener('storage', syncStorageLocale);
    return () => window.removeEventListener('storage', syncStorageLocale);
  }, []);

  const setLocale = useCallback((nextLocale: MemberLocale) => {
    commitLocale(nextLocale);
  }, [commitLocale]);

  const toggleLocale = useCallback(() => {
    const activeLocale = normalizeLocale(document.documentElement.dataset.memberLocale ?? locale);
    commitLocale(activeLocale === 'th' ? 'en' : 'th');
  }, [commitLocale, locale]);

  const value = useMemo(
    () => ({ locale, setLocale, toggleLocale }),
    [locale, setLocale, toggleLocale],
  );

  return (
    <MemberLocaleContext.Provider value={value}>
      <Fragment key={locale}>{children}</Fragment>
    </MemberLocaleContext.Provider>
  );
}

export function useMemberLocale() {
  const context = useContext(MemberLocaleContext);
  if (!context) throw new Error('useMemberLocale must be used inside MemberLocaleProvider');
  return context;
}
