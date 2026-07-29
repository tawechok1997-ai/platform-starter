'use client';

import { useEffect, useState } from 'react';
import { useMemberLocale, type MemberLocale } from '../member-locale-provider';
import styles from './member-language-overlay.module.css';

type LanguageOption = {
  code: MemberLocale;
  label: string;
  flag: string;
};

const LANGUAGES: readonly LanguageOption[] = [
  { code: 'th', label: 'ภาษาไทย', flag: '/assets/asset-pc/images/flags/th.svg' },
  { code: 'en', label: 'English', flag: '/assets/asset-pc/images/flags/en.svg' },
];

const COPY = {
  th: { title: 'เปลี่ยนภาษา', close: 'ปิดหน้าต่างเปลี่ยนภาษา', choose: 'เลือกภาษา' },
  en: { title: 'Change language', close: 'Close language dialog', choose: 'Choose language' },
} as const;

export default function MemberLanguageOverlay() {
  const [open, setOpen] = useState(false);
  const { locale, setLocale } = useMemberLocale();
  const copy = COPY[locale];

  useEffect(() => {
    const openLanguagePopup = (event: MouseEvent) => {
      const trigger = event.target instanceof Element
        ? event.target.closest<HTMLElement>('.public-home-flag, [data-language-trigger="true"], [aria-label="เปลี่ยนภาษา"]')
        : null;
      if (!trigger) return;
      event.preventDefault();
      event.stopPropagation();
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

  if (!open) return null;

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="member-language-title">
        <div className={styles.topLine} aria-hidden="true" />
        <header className={styles.header}>
          <div className={styles.titleWrap}>
            <span className={styles.globeIcon} aria-hidden="true"><GlobeIcon /></span>
            <h2 id="member-language-title">{copy.title}</h2>
          </div>
          <button type="button" className={styles.closeButton} onClick={() => setOpen(false)} aria-label={copy.close}>
            <img src="/assets/asset-pc/images/close.svg" alt="" aria-hidden="true" />
          </button>
        </header>

        <div className={styles.grid} aria-label={copy.choose}>
          {LANGUAGES.map((language) => {
            const active = language.code === locale;
            return (
              <button
                key={language.code}
                type="button"
                className={`${styles.languageFrame} ${active ? styles.activeFrame : ''}`}
                onClick={() => { setLocale(language.code); setOpen(false); }}
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
