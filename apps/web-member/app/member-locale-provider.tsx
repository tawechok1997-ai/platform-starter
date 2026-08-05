'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import MobileP10P12ClosureRuntime from './components/mobile-home/mobile-p10-p12-closure-runtime';

export type MemberLocale = 'th' | 'en';

const STORAGE_KEY = 'member_locale';
const MOBILE_LANGUAGE_OWNER_SELECTOR = [
  '[data-mobile-home-root] button[aria-label="เปลี่ยนภาษา"]',
  '[data-mobile-home-root] button[aria-label="Change language"]',
  '#mobile-home-drawer button',
].join(',');

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
    setLocaleState((currentLocale) => (currentLocale === nextLocale ? currentLocale : nextLocale));
    applyLocaleToDocument(nextLocale);
    window.localStorage.setItem(STORAGE_KEY, nextLocale);
  }, []);

  useEffect(() => {
    const initialLocale = normalizeLocale(
      document.documentElement.dataset.memberLocale
      ?? window.localStorage.getItem(STORAGE_KEY),
    );
    setLocaleState((currentLocale) => (currentLocale === initialLocale ? currentLocale : initialLocale));
    applyLocaleToDocument(initialLocale);

    const syncStorageLocale = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const nextLocale = normalizeLocale(event.newValue);
      setLocaleState((currentLocale) => (currentLocale === nextLocale ? currentLocale : nextLocale));
      applyLocaleToDocument(nextLocale);
    };

    window.addEventListener('storage', syncStorageLocale);
    return () => window.removeEventListener('storage', syncStorageLocale);
  }, []);

  useEffect(() => {
    const handleMobileLanguageToggle = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const button = event.target.closest<HTMLButtonElement>(MOBILE_LANGUAGE_OWNER_SELECTOR);
      if (!button) return;

      const label = `${button.getAttribute('aria-label') ?? ''} ${button.textContent ?? ''}`
        .trim()
        .toLowerCase();
      if (!/เปลี่ยนภาษา|change language/.test(label)) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      const activeLocale = normalizeLocale(
        document.documentElement.dataset.memberLocale
        ?? window.localStorage.getItem(STORAGE_KEY),
      );
      commitLocale(activeLocale === 'th' ? 'en' : 'th');
    };

    document.addEventListener('click', handleMobileLanguageToggle, true);
    return () => document.removeEventListener('click', handleMobileLanguageToggle, true);
  }, [commitLocale]);

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
      <MobileP10P12ClosureRuntime locale={locale} />
      {children}
    </MemberLocaleContext.Provider>
  );
}

export function useMemberLocale() {
  const context = useContext(MemberLocaleContext);
  if (!context) throw new Error('useMemberLocale must be used inside MemberLocaleProvider');
  return context;
}
