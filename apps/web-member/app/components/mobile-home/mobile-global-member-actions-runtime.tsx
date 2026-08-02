'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMemberLocale, type MemberLocale } from '../../member-locale-provider';
import { useMemberSession } from '../../member-session-provider';
import styles from './mobile-global-member-actions-runtime.module.css';

type Overlay = 'language' | 'logout-confirm' | 'logout-loading' | null;

const LANGUAGE_OPTIONS = [
  { code: 'en', label: 'English', icon: '/images/flags/en.svg' },
  { code: 'th', label: 'ภาษาไทย', icon: '/images/flags/th.svg' },
  { code: 'ph', label: 'Tagalog', icon: '/images/flags/ph.svg' },
  { code: 'vi', label: 'Tiếng Việt', icon: '/images/flags/vi.svg' },
  { code: 'km', label: 'ភាសាខ្មែរ', icon: '/images/flags/km.svg' },
  { code: 'lo', label: 'ພາສາລາວ', icon: '/images/flags/lo.svg' },
  { code: 'id', label: 'Bahasa Indonesia', icon: '/images/flags/id.svg' },
  { code: 'mm', label: 'Myanmar', icon: '/images/flags/mm.svg' },
] as const;

export default function MobileGlobalMemberActionsRuntime() {
  const { locale, setLocale } = useMemberLocale();
  const { logout } = useMemberSession();
  const [isMobile, setIsMobile] = useState(false);
  const [overlay, setOverlay] = useState<Overlay>(null);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 900px)');
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener?.('change', sync);
    return () => media.removeEventListener?.('change', sync);
  }, []);

  useEffect(() => {
    if (!isMobile) return;

    const captureAction = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const action = event.target.closest<HTMLElement>('button,a,[role="button"]');
      if (!action) return;

      // Controls inside this runtime's own overlay must reach their React
      // handlers. Re-capturing the confirm button would reopen the confirm
      // state and stop logout() before it ever runs.
      if (action.closest('[data-mobile-global-overlay]')) return;

      const label = action.getAttribute('aria-label')?.trim() ?? '';
      const text = action.textContent?.replace(/\s+/g, ' ').trim() ?? '';
      const popup = action.dataset.mobileMemberPopup;
      const isLanguage = popup === 'language'
        || label === 'เปลี่ยนภาษา'
        || label === 'Change language'
        || text === 'เปลี่ยนภาษา'
        || text === 'Change language';

      if (isLanguage) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        closeMobileDrawer();
        setOverlay('language');
        return;
      }

      const isLogout = action.tagName === 'BUTTON'
        && (text === 'ออกจากระบบ' || text === 'Sign out' || text === 'Logout');
      if (!isLogout) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      closeMobileDrawer();
      setOverlay('logout-confirm');
    };

    window.addEventListener('click', captureAction, true);
    return () => window.removeEventListener('click', captureAction, true);
  }, [isMobile]);

  useEffect(() => {
    if (!overlay) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [overlay]);

  if (!isMobile || typeof document === 'undefined') return null;

  const chooseLanguage = (code: string) => {
    if (code === 'th' || code === 'en') {
      setLocale(code as MemberLocale);
      setOverlay(null);
    }
  };

  const confirmLogout = () => {
    setOverlay('logout-loading');
    window.setTimeout(() => logout(), 320);
  };

  return overlay ? createPortal(
    <div className={styles.backdrop} data-mobile-global-overlay={overlay}>
      {overlay === 'language' ? (
        <section className={styles.languageDialog} role="dialog" aria-modal="true" aria-labelledby="mobile-language-title">
          <button type="button" className={styles.close} aria-label="ปิด" onClick={() => setOverlay(null)}>×</button>
          <div className={styles.titleTab} id="mobile-language-title">เปลี่ยนภาษา</div>
          <div className={styles.languageGrid}>
            {LANGUAGE_OPTIONS.map((item) => {
              const selected = item.code === locale;
              return (
                <button
                  key={item.code}
                  type="button"
                  className={selected ? styles.languageSelected : ''}
                  aria-pressed={selected}
                  onClick={() => chooseLanguage(item.code)}
                >
                  <img src={item.icon} alt="" aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {overlay === 'logout-confirm' ? (
        <section className={styles.logoutDialog} role="dialog" aria-modal="true" aria-labelledby="mobile-logout-title">
          <h2 id="mobile-logout-title">ออกจากระบบ</h2>
          <p>คุณยืนยันจะออกจากระบบหรือไม่</p>
          <div className={styles.logoutActions}>
            <button
              type="button"
              className={styles.confirmLogout}
              data-mobile-global-confirm-logout="true"
              onClick={confirmLogout}
            >
              ออกจากระบบ
            </button>
            <button type="button" className={styles.cancelLogout} onClick={() => setOverlay(null)}>ยกเลิก</button>
          </div>
        </section>
      ) : null}

      {overlay === 'logout-loading' ? (
        <section className={`${styles.logoutDialog} ${styles.loadingDialog}`} role="status" aria-live="assertive">
          <h2>ออกจากระบบ</h2>
          <p>คุณยืนยันจะออกจากระบบหรือไม่</p>
          <div className={styles.loadingWord}>Loading</div>
        </section>
      ) : null}
    </div>,
    document.body,
  ) : null;
}

function closeMobileDrawer() {
  const dismiss = document.querySelector<HTMLButtonElement>('[data-mobile-drawer-dismiss="true"]');
  if (dismiss) {
    dismiss.click();
    return;
  }
  document.querySelector<HTMLButtonElement>('#mobile-home-drawer button[aria-label="ปิดเมนู"]')?.click();
}
