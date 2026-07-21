'use client';

import { useCallback, useEffect, useState } from 'react';

export type AdminLocale = 'th' | 'en';
export const ADMIN_LOCALE_STORAGE_KEY = 'admin_locale';
const ADMIN_LOCALE_EVENT = 'admin-locale-change';

function readLocale(): AdminLocale {
  return window.localStorage.getItem(ADMIN_LOCALE_STORAGE_KEY) === 'en' ? 'en' : 'th';
}

export function useAdminLocale() {
  const [locale, setLocale] = useState<AdminLocale>('th');

  useEffect(() => {
    const syncLocale = (next: AdminLocale) => {
      setLocale(next);
      document.documentElement.lang = next;
    };
    syncLocale(readLocale());
    const onStorage = (event: StorageEvent) => {
      if (event.key === ADMIN_LOCALE_STORAGE_KEY && (event.newValue === 'th' || event.newValue === 'en')) syncLocale(event.newValue);
    };
    const onLocaleChange = (event: Event) => {
      const next = (event as CustomEvent<AdminLocale>).detail;
      if (next === 'th' || next === 'en') syncLocale(next);
    };
    window.addEventListener('storage', onStorage);
    window.addEventListener(ADMIN_LOCALE_EVENT, onLocaleChange);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(ADMIN_LOCALE_EVENT, onLocaleChange);
    };
  }, []);

  const changeLocale = useCallback((next: AdminLocale) => {
    window.localStorage.setItem(ADMIN_LOCALE_STORAGE_KEY, next);
    document.documentElement.lang = next;
    setLocale(next);
    window.dispatchEvent(new CustomEvent<AdminLocale>(ADMIN_LOCALE_EVENT, { detail: next }));
  }, []);

  return [locale, changeLocale] as const;
}
