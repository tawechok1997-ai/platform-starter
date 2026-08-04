'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import type { MemberLocale } from '../member-locale-provider';
import { useMemberRuntime } from '../member-runtime-provider';
import type { PromotionView } from '../browse/browse-promotions-cms';
import { MemberModal } from './member-modal-system';
import '../member-promotion-detail-popup.css';
import '../member-source-content-popup.css';
import '../member-source-content-popup-header.css';

const MemberSourceContentPopup = dynamic(
  () => import('./member-source-content-popup'),
  { ssr: false, loading: () => <div className="member-shared-popup-loading">กำลังโหลด...</div> },
);

export type MemberSharedPopupKind = PromotionView | 'language';
type OpenPopupDetail = { kind: MemberSharedPopupKind };

const OPEN_MEMBER_SHARED_POPUP_EVENT = 'member:open-shared-popup';
const BROWSE_VIEWS = new Set<PromotionView>(['all', 'promotion', 'activity', 'news']);

export function openMemberSharedPopup(kind: MemberSharedPopupKind) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<OpenPopupDetail>(OPEN_MEMBER_SHARED_POPUP_EVENT, { detail: { kind } }));
}

export default function MemberSharedPopupRuntime({
  locale,
  onSetLocale,
}: {
  locale: MemberLocale;
  onSetLocale: (locale: MemberLocale) => void;
}) {
  const { icons } = useMemberRuntime();
  const [popup, setPopup] = useState<MemberSharedPopupKind | null>(null);
  const [promotionDetailOpen, setPromotionDetailOpen] = useState(false);
  const [detailBackSignal, setDetailBackSignal] = useState(0);

  const close = useCallback(() => {
    setPopup(null);
    setPromotionDetailOpen(false);
  }, []);

  useEffect(() => {
    const openPopup = (event: Event) => {
      const detail = (event as CustomEvent<OpenPopupDetail>).detail;
      if (!detail || !isPopupKind(detail.kind)) return;
      setPromotionDetailOpen(false);
      setDetailBackSignal((current) => current + 1);
      setPopup(detail.kind);
    };
    window.addEventListener(OPEN_MEMBER_SHARED_POPUP_EVENT, openPopup);
    return () => window.removeEventListener(OPEN_MEMBER_SHARED_POPUP_EVENT, openPopup);
  }, []);

  useEffect(() => {
    const interceptSharedEntry = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;
      if (event.target.closest('.member-shared-popup, [data-member-modal-system="true"]')) return;

      // Mobile member actions have one dedicated owner. Shared popup must never
      // intercept the same click or two dialogs will open from one control.
      if (event.target.closest('[data-mobile-member-popup], [data-ui-owner="mobile-popup"]')) return;

      const languageTrigger = event.target.closest<HTMLElement>(
        '[data-member-language-trigger], .public-home-flag',
      );
      if (languageTrigger) {
        event.preventDefault();
        event.stopPropagation();
        setPromotionDetailOpen(false);
        setPopup('language');
        return;
      }

      const link = event.target.closest<HTMLAnchorElement>('a[href]');
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
      const kind = popupKindFromHref(link.getAttribute('href'));
      if (!kind) return;
      event.preventDefault();
      event.stopPropagation();
      setPromotionDetailOpen(false);
      setDetailBackSignal((current) => current + 1);
      setPopup(kind);
    };

    document.addEventListener('click', interceptSharedEntry, true);
    return () => document.removeEventListener('click', interceptSharedEntry, true);
  }, []);

  const title = popup ? popupTitle(popup, locale) : '';
  const showPromotionBack = promotionDetailOpen && popup !== 'language';
  const contentKind = popup && popup !== 'language'
    ? (popup === 'all' ? 'promotion' : popup)
    : null;

  return (
    <MemberModal
      open={Boolean(popup)}
      onClose={close}
      ariaLabel={title}
      mode="sheet"
      backdropClassName="member-shared-popup-backdrop"
      panelClassName={`member-shared-popup${showPromotionBack ? ' is-promotion-detail' : ''}${contentKind ? ` is-content-${contentKind}` : ''}`}
      contentClassName="member-shared-popup-content"
      header={popup ? (
        <>
          <span className="member-shared-popup-top-line" aria-hidden="true" />
          <header className="member-shared-popup-header">
            <div>
              {showPromotionBack ? (
                <button
                  type="button"
                  className="member-shared-popup-back"
                  aria-label={locale === 'th' ? 'ย้อนกลับ' : 'Back'}
                  onClick={() => {
                    setPromotionDetailOpen(false);
                    setDetailBackSignal((current) => current + 1);
                  }}
                >
                  <svg viewBox="0 0 32 32" aria-hidden="true"><path d="m10.4 17.3 7.5 7.5-1.9 1.9L5.3 16 16 5.3l1.9 1.9-7.5 7.5h16.3v2.6H10.4Z" /></svg>
                </button>
              ) : (
                <span>
                  {popup === 'language'
                    ? <img src="/assets/asset-pc/images/เปลียนภาษา.svg" alt="" aria-hidden="true" />
                    : <PopupHeaderIcon kind={popup} />}
                </span>
              )}
              <h2>{showPromotionBack ? (locale === 'th' ? 'โปรโมชั่น' : 'Promotion') : title}</h2>
            </div>
            <button type="button" onClick={close} aria-label={locale === 'th' ? 'ปิด' : 'Close'}>
              <img src={icons.close} alt="" aria-hidden="true" />
            </button>
          </header>
        </>
      ) : null}
    >
      {popup === 'language' ? (
        <LanguagePanel
          locale={locale}
          onSelect={(nextLocale) => {
            onSetLocale(nextLocale);
            close();
          }}
        />
      ) : popup ? (
        <MemberSourceContentPopup
          key={`${popup}:${detailBackSignal}`}
          view={popup}
          onDetailOpenChange={setPromotionDetailOpen}
        />
      ) : null}
    </MemberModal>
  );
}

function PopupHeaderIcon({ kind }: { kind: PromotionView }) {
  if (kind === 'activity') {
    return (
      <svg className="member-shared-popup-kind-icon" viewBox="0 0 31 30" aria-hidden="true">
        <path d="m25.2 27.4-13.36-4.98a2.5 2.5 0 0 1-.96-4.1l8.38-8.38a2.5 2.5 0 0 1 4.12 1.06l4.96 13.36a2.5 2.5 0 0 1-3.14 3.04Z" />
        <path d="M5.6 15.26a4.2 4.2 0 0 1 2.92-.42M10.16 9.56a4.2 4.2 0 0 1-.66-2.9M14.76 2.44a10 10 0 0 0 .26 6.56M3.5 8.56a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
      </svg>
    );
  }
  if (kind === 'news') {
    return (
      <svg className="member-shared-popup-kind-icon" viewBox="0 0 31 31" aria-hidden="true">
        <path d="m15.86 8.99 7.72 13.37M23.18 21.65 4.16 26.07l-1.22-2.11L16.27 9.7M8.29 25.11l1.05 1.81a2.84 2.84 0 1 0 4.91-2.86l-.17-.29M16.39 5.17V2.67M25.99 14.78h2.51M4.28 14.78h2.5M7.82 6.21 9.6 7.99M23.18 7.99l1.77-1.78" />
      </svg>
    );
  }
  return (
    <svg className="member-shared-popup-kind-icon" viewBox="0 0 31 31" aria-hidden="true">
      <path d="M26.49 25.97V14.29H5.39v11.68a2 2 0 0 0 2 2h17.1a2 2 0 0 0 2-2ZM15.94 27.97V14.28M28.22 11.08v1.2a2 2 0 0 1-2 2H5.66a2 2 0 0 1-2-2v-1.2a2 2 0 0 1 2-2h20.56a2 2 0 0 1 2 2Z" />
      <path d="M15.94 9.08c0-1.75-2.04-5.83-5.1-5.83-4.99 0-3.17 5.83-.79 5.83M15.94 9.08c0-1.75 2.04-5.83 5.1-5.83 4.98 0 3.17 5.83.78 5.83" />
    </svg>
  );
}

function LanguagePanel({ locale, onSelect }: { locale: MemberLocale; onSelect: (locale: MemberLocale) => void }) {
  return (
    <div className="member-shared-language-panel">
      <p>{locale === 'th' ? 'เลือกภาษาที่ต้องการใช้งาน' : 'Choose your preferred language'}</p>
      <div>
        <button type="button" className={locale === 'th' ? 'is-active' : ''} onClick={() => onSelect('th')}>
          <img src="/assets/asset-pc/images/flags/th.svg" alt="" aria-hidden="true" />
          <span><strong>ภาษาไทย</strong><small>Thai</small></span><b aria-hidden="true">✓</b>
        </button>
        <button type="button" className={locale === 'en' ? 'is-active' : ''} onClick={() => onSelect('en')}>
          <img src="/assets/asset-pc/images/flags/en.svg" alt="" aria-hidden="true" />
          <span><strong>English</strong><small>ภาษาอังกฤษ</small></span><b aria-hidden="true">✓</b>
        </button>
      </div>
    </div>
  );
}

function popupKindFromHref(rawHref: string | null): PromotionView | null {
  if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:')) return null;
  try {
    const url = new URL(rawHref, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    if (url.pathname === '/promotions') return 'promotion';
    if (url.pathname !== '/browse/promotions') return null;
    const requestedView = url.searchParams.get('view');
    return requestedView && BROWSE_VIEWS.has(requestedView as PromotionView) ? requestedView as PromotionView : 'all';
  } catch {
    return null;
  }
}

function isPopupKind(value: unknown): value is MemberSharedPopupKind {
  return value === 'language' || (typeof value === 'string' && BROWSE_VIEWS.has(value as PromotionView));
}

function popupTitle(kind: MemberSharedPopupKind, locale: MemberLocale) {
  if (locale === 'en') {
    if (kind === 'language') return 'Change language';
    if (kind === 'activity') return 'Activities';
    if (kind === 'news') return 'News';
    return 'Promotions';
  }
  if (kind === 'language') return 'เปลี่ยนภาษา';
  if (kind === 'activity') return 'กิจกรรม';
  if (kind === 'news') return 'ข่าวสาร';
  return 'โปรโมชั่น';
}
