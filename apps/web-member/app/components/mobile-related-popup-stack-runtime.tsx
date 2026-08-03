'use client';

import { useEffect, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { useMemberLocale } from '../member-locale-provider';
import styles from './mobile-home/mobile-member-popup-runtime.module.css';

type RelatedParentKind = 'menu' | 'password' | 'network-income' | 'commission-income';
type RelatedChildKind = 'contact' | 'coupon';
type RelatedPopup = {
  parent: RelatedParentKind;
  child: RelatedChildKind;
};

const CONTACT_LINE_ID = '@774uinsb';
const CONTACT_LINE_URL = 'https://line.me/R/ti/p/@774uinsb';

const RELATED_POPUP_CHILDREN: Readonly<Record<RelatedParentKind, readonly RelatedChildKind[]>> = {
  menu: ['coupon'],
  password: ['contact'],
  'network-income': ['contact'],
  'commission-income': ['contact'],
};

function relatedChildFromAction(parent: RelatedParentKind, action: HTMLElement): RelatedChildKind | null {
  const text = action.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const requested: RelatedChildKind | null = text.includes('ติดต่อเรา')
    ? 'contact'
    : text.includes('คูปอง')
      ? 'coupon'
      : null;

  return requested && RELATED_POPUP_CHILDREN[parent].includes(requested)
    ? requested
    : null;
}

function isRelatedParentKind(value: string | undefined): value is RelatedParentKind {
  return Boolean(value && Object.prototype.hasOwnProperty.call(RELATED_POPUP_CHILDREN, value));
}

export default function MobileRelatedPopupStackRuntime() {
  const { locale } = useMemberLocale();
  const [relatedPopup, setRelatedPopup] = useState<RelatedPopup | null>(null);

  useEffect(() => {
    const handleRelatedOpen = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const action = event.target.closest<HTMLElement>('a,button,[role="button"]');
      const parentDialog = action?.closest<HTMLElement>('[data-mobile-popup-owner]');
      const parent = parentDialog?.dataset.mobilePopupOwner;
      if (!action || !isRelatedParentKind(parent)) return;

      const child = relatedChildFromAction(parent, action);
      if (!child) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      setRelatedPopup({ parent, child });
    };

    document.addEventListener('click', handleRelatedOpen, true);
    return () => document.removeEventListener('click', handleRelatedOpen, true);
  }, []);

  useEffect(() => {
    if (!relatedPopup) return;
    const parentDialog = document.querySelector<HTMLElement>(
      `[data-mobile-popup-owner="${relatedPopup.parent}"]`,
    );
    if (!parentDialog) {
      setRelatedPopup(null);
      return;
    }

    const previousAriaHidden = parentDialog.getAttribute('aria-hidden');
    const previousInert = parentDialog.inert;
    parentDialog.setAttribute('aria-hidden', 'true');
    parentDialog.inert = true;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      setRelatedPopup(null);
    };
    window.addEventListener('keydown', closeOnEscape, true);

    return () => {
      if (previousAriaHidden === null) parentDialog.removeAttribute('aria-hidden');
      else parentDialog.setAttribute('aria-hidden', previousAriaHidden);
      parentDialog.inert = previousInert;
      window.removeEventListener('keydown', closeOnEscape, true);
    };
  }, [relatedPopup]);

  if (!relatedPopup || typeof document === 'undefined') return null;

  const close = () => setRelatedPopup(null);
  return createPortal(
    <div
      className={styles.backdrop}
      data-ui-owner="mobile-popup"
      data-mobile-related-popup-child={relatedPopup.child}
      data-mobile-related-popup-parent={relatedPopup.parent}
      role="presentation"
      style={{ zIndex: 202 }}
      onPointerDown={(event: ReactPointerEvent<HTMLDivElement>) => {
        if (event.currentTarget === event.target) close();
      }}
    >
      <section
        className={`${styles.dialog} ${relatedPopup.child === 'coupon' ? styles.dialogCompact : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={relatedPopup.child === 'contact' ? 'ติดต่อเรา' : 'คูปอง'}
        data-mobile-popup-owner={relatedPopup.child}
        data-mobile-popup-layer="child"
      >
        <div className={styles.border} aria-hidden="true" />
        <div className={styles.titleChrome} aria-hidden="true">
          <TitleFill />
          <TitleStroke />
        </div>
        <h2 className={styles.title}>
          {relatedPopup.child === 'contact'
            ? (locale === 'th' ? 'ติดต่อเรา' : 'Contact us')
            : (locale === 'th' ? 'คูปอง' : 'Coupon')}
        </h2>
        <button type="button" className={styles.close} aria-label="ปิด Popup ลูก" onClick={close}>
          <img src="/images/close.svg" alt="" aria-hidden="true" />
        </button>
        <div className={styles.content}>
          {relatedPopup.child === 'contact'
            ? <RelatedContactContent />
            : <RelatedCouponContent locale={locale} />}
        </div>
      </section>
    </div>,
    document.body,
  );
}

function RelatedContactContent() {
  return (
    <div className={styles.contactList}>
      <div className={styles.contactCard}>
        <img src="/images/line.png" alt="" aria-hidden="true" />
        <div>
          <strong>Line</strong>
          <span>{CONTACT_LINE_ID}</span>
        </div>
        <a href={CONTACT_LINE_URL} target="_blank" rel="noreferrer">คลิก</a>
      </div>
    </div>
  );
}

function RelatedCouponContent({ locale }: { locale: 'th' | 'en' }) {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  return (
    <div className={styles.couponContent}>
      <label className={styles.sourceField}>
        <span>{locale === 'th' ? 'คูปอง' : 'Coupon'}</span>
        <input value={code} onChange={(event) => setCode(event.target.value)} />
      </label>
      <button
        type="button"
        className={styles.fullSubmit}
        disabled={!code.trim()}
        onClick={() => setMessage(
          locale === 'th'
            ? 'ระบบใช้คูปองยังไม่เปิดใช้งาน'
            : 'Coupon redemption is not available yet',
        )}
      >
        {locale === 'th' ? 'ยืนยัน' : 'Confirm'}
      </button>
      {message ? <div className={styles.message} role="status">{message}</div> : null}
    </div>
  );
}

function TitleFill() {
  return (
    <svg viewBox="0 0 192 36" fill="none" aria-hidden="true">
      <path
        d="M0 0H192L186.5 17.9997C186.5 17.9997 182.916 27.4412 176 31.8135C169.319 36.037 159.562 35.9994 159.562 35.9994H138.125H95.25H52.375H30.9375C30.9375 35.9994 21.5831 36.1436 15 31.8135C8.23851 27.366 4.75 17.9997 4.75 17.9997L0 0Z"
        fill="url(#mobile-related-title-fill)"
      />
      <defs>
        <linearGradient id="mobile-related-title-fill" x1="95.9977" y1="36" x2="95.9977" y2="0" gradientUnits="userSpaceOnUse">
          <stop stopColor="#505050" />
          <stop offset="0.32" stopColor="#474747" />
          <stop offset="0.79" stopColor="#313131" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function TitleStroke() {
  return (
    <svg viewBox="0 0 194 38" fill="none" aria-hidden="true">
      <path
        d="M3 1H1.69l.346 1.264 4.651 17 .013.049.018.047c.032.083.832 2.148 2.35 4.745 1.505 2.576 3.771 5.735 6.883 7.783 3.45 2.27 7.534 3.299 10.622 3.786 1.557.245 2.882.326 3.824.346.47.01.845.004 1.106-.004l.301-.012.08-.004.022-.001h.006H53.375 96.25 139.125h21.438.006l.022.001.08.004.301.012c.261.008.636.014 1.106.004.942-.02 2.267-.101 3.824-.346 3.088-.487 7.172-1.516 10.622-3.786 3.112-2.048 5.378-5.207 6.883-7.783 1.518-2.597 2.318-4.662 2.35-4.745l.018-.047.013-.049 4.651-17L192.31 1H191 3Z"
        stroke="url(#mobile-related-title-stroke)"
        strokeOpacity="0.2"
        strokeWidth="2"
      />
      <defs>
        <linearGradient id="mobile-related-title-stroke" x1="142.531" y1="48.75" x2="142.076" y2="6.722" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f2f2f2" />
          <stop offset="1" stopColor="#f2f2f2" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}
