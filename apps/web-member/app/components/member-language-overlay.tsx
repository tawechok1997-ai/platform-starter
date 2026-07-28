'use client';

import { useEffect, useMemo } from 'react';
import { useMemberLocale, type MemberLocale } from '../member-locale-provider';
import styles from './member-language-overlay.module.css';

type LanguageOption = {
  code: MemberLocale;
  label: string;
  flag: string;
};

const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', flag: '/assets/asset-pc/images/flags/en.svg' },
  { code: 'th', label: 'ภาษาไทย', flag: '/assets/asset-pc/images/flags/th.svg' },
];

export default function MemberLanguageOverlay({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { locale, setLocale } = useMemberLocale();
  const activeLanguage = useMemo(
    () => LANGUAGES.find((language) => language.code === locale) ?? LANGUAGES[1]!,
    [locale],
  );

  useEffect(() => {
    if (!open) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onOpenChange(false);
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onOpenChange, open]);

  const selectLanguage = (language: LanguageOption) => {
    setLocale(language.code);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div
      className={styles.overlay}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onOpenChange(false);
      }}
    >
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="member-language-title">
        <div className={styles.topLine} aria-hidden="true" />

        <header className={styles.header}>
          <div className={styles.titleWrap}>
            <span className={styles.globeIcon} aria-hidden="true"><GlobeIcon /></span>
            <h2 id="member-language-title">เปลี่ยนภาษา</h2>
          </div>
          <button type="button" className={styles.closeButton} onClick={() => onOpenChange(false)} aria-label="ปิดหน้าต่างเปลี่ยนภาษา">
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
                className={`${styles.languageFrame} ${active ? styles.activeFrame : ''}`}
                onClick={() => selectLanguage(language)}
                aria-pressed={active}
              >
                <span className={`${styles.languageCard} ${active ? styles.activeCard : ''}`}>
                  <span className={`${styles.flagWrap} ${active ? '' : styles.inactiveFlag}`}>
                    <img src={language.flag} alt={language.label} />
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
