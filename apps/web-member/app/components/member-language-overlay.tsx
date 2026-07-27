'use client';

import { useEffect, useMemo, useState } from 'react';
import styles from './member-language-overlay.module.css';

type MemberLocale = 'en' | 'th';
type DisplayLocale = MemberLocale | 'ph' | 'vi' | 'km' | 'lo' | 'id' | 'mm';

type LanguageOption = {
  code: DisplayLocale;
  label: string;
  flag?: string;
  enabled: boolean;
};

const LOCALE_STORAGE_KEY = 'member_locale';

const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', flag: '/assets/asset-pc/images/flags/en.svg', enabled: true },
  { code: 'th', label: 'ภาษาไทย', flag: '/assets/asset-pc/images/flags/th.svg', enabled: true },
  { code: 'ph', label: 'Tagalog', enabled: false },
  { code: 'vi', label: 'Tiếng Việt', enabled: false },
  { code: 'km', label: 'ភាសាខ្មែរ', enabled: false },
  { code: 'lo', label: 'ພາສາລາວ', enabled: false },
  { code: 'id', label: 'Bahasa Indonesia', enabled: false },
  { code: 'mm', label: 'Myan', enabled: false },
];

function readSavedLocale(): MemberLocale {
  if (typeof window === 'undefined') return 'th';
  return window.localStorage.getItem(LOCALE_STORAGE_KEY) === 'en' ? 'en' : 'th';
}

export default function MemberLanguageOverlay() {
  const [open, setOpen] = useState(false);
  const [locale, setLocale] = useState<MemberLocale>('th');
  const activeLanguage = useMemo(
    () => LANGUAGES.find((language) => language.code === locale) ?? LANGUAGES[1]!,
    [locale],
  );

  useEffect(() => {
    setLocale(readSavedLocale());

    const openLanguagePopup = (event: MouseEvent) => {
      const trigger = event.target instanceof Element
        ? event.target.closest<HTMLElement>('.public-home-flag, [data-language-trigger="true"], [aria-label="เปลี่ยนภาษา"]')
        : null;
      if (!trigger) return;
      event.preventDefault();
      event.stopPropagation();
      setLocale(readSavedLocale());
      setOpen(true);
    };

    document.addEventListener('click', openLanguagePopup, true);
    return () => document.removeEventListener('click', openLanguagePopup, true);
  }, []);

  useEffect(() => {
    if (!open) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const selectLanguage = (language: LanguageOption) => {
    if (!language.enabled || !language.flag || (language.code !== 'th' && language.code !== 'en')) return;

    setLocale(language.code);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, language.code);
    document.documentElement.lang = language.code;

    document.querySelectorAll<HTMLImageElement>('.public-home-flag img').forEach((image) => {
      image.src = language.flag!;
      image.alt = language.label;
    });

    window.dispatchEvent(new CustomEvent('member-locale-change', {
      detail: { locale: language.code },
    }));
    setOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="member-language-title">
        <div className={styles.topLine} aria-hidden="true" />

        <header className={styles.header}>
          <div className={styles.titleWrap}>
            <span className={styles.globeIcon} aria-hidden="true"><GlobeIcon /></span>
            <h2 id="member-language-title">เปลี่ยนภาษา</h2>
          </div>
          <button type="button" className={styles.closeButton} onClick={() => setOpen(false)} aria-label="ปิดหน้าต่างเปลี่ยนภาษา">
            <img src="/assets/asset-pc/images/close.svg" alt="" aria-hidden="true" />
          </button>
        </header>

        <div className={styles.grid} aria-label="เลือกภาษา">
          {LANGUAGES.map((language) => {
            const active = language.code === activeLanguage.code;
            return (
              <button
                key={language.code}
                type="button"
                className={`${styles.languageFrame} ${active ? styles.activeFrame : ''} ${language.enabled ? '' : styles.disabledFrame}`}
                onClick={() => selectLanguage(language)}
                aria-pressed={active}
                aria-disabled={!language.enabled}
                disabled={!language.enabled}
              >
                <span className={`${styles.languageCard} ${active ? styles.activeCard : ''}`}>
                  <span className={`${styles.flagWrap} ${active ? '' : styles.inactiveFlag}`}>
                    {language.flag
                      ? <img src={language.flag} alt={language.label} />
                      : <span className={styles.missingAsset}>MISSING<br />ASSET</span>}
                  </span>
                  <span className={`${styles.languageName} ${active ? styles.activeName : ''}`}>{language.label}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 31 31" fill="none">
      <circle cx="15.5" cy="15.5" r="13.93" stroke="currentColor" strokeWidth="2" />
      <path d="M1.57 15.5h27.86" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M20.86 15.5c-.27 5.09-2.14 9.97-5.36 13.93-3.22-3.96-5.1-8.84-5.36-13.93.26-5.09 2.14-9.97 5.36-13.93 3.22 3.96 5.09 8.84 5.36 13.93Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
