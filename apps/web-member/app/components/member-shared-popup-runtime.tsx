'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { MemberLocale } from '../member-locale-provider';
import type { PromotionView } from '../browse/browse-promotions-cms';

const BrowsePromotionsCms = dynamic(
  () => import('../browse/browse-promotions-cms').then((module) => module.BrowsePromotionsCms),
  { ssr: false, loading: () => <div className="member-shared-popup-loading">กำลังโหลด...</div> },
);

export type MemberSharedPopupKind = PromotionView | 'language';

type OpenPopupDetail = { kind: MemberSharedPopupKind };

const OPEN_MEMBER_SHARED_POPUP_EVENT = 'member:open-shared-popup';
const BROWSE_VIEWS = new Set<PromotionView>(['all', 'promotion', 'activity', 'news']);

export function openMemberSharedPopup(kind: MemberSharedPopupKind) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<OpenPopupDetail>(OPEN_MEMBER_SHARED_POPUP_EVENT, {
    detail: { kind },
  }));
}

export default function MemberSharedPopupRuntime({
  locale,
  onSetLocale,
}: {
  locale: MemberLocale;
  onSetLocale: (locale: MemberLocale) => void;
}) {
  const [popup, setPopup] = useState<MemberSharedPopupKind | null>(null);

  const close = useCallback(() => setPopup(null), []);

  useEffect(() => {
    const openPopup = (event: Event) => {
      const detail = (event as CustomEvent<OpenPopupDetail>).detail;
      if (!detail || !isPopupKind(detail.kind)) return;
      setPopup(detail.kind);
    };

    window.addEventListener(OPEN_MEMBER_SHARED_POPUP_EVENT, openPopup);
    return () => window.removeEventListener(OPEN_MEMBER_SHARED_POPUP_EVENT, openPopup);
  }, []);

  useEffect(() => {
    const interceptSharedEntry = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (!(event.target instanceof Element)) return;
      if (event.target.closest('[data-member-shared-popup]')) return;

      const languageTrigger = event.target.closest<HTMLElement>('[data-member-language-trigger], .public-home-flag');
      if (languageTrigger) {
        event.preventDefault();
        event.stopPropagation();
        setPopup('language');
        return;
      }

      const link = event.target.closest<HTMLAnchorElement>('a[href]');
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;

      const kind = popupKindFromHref(link.getAttribute('href'));
      if (!kind) return;

      event.preventDefault();
      event.stopPropagation();
      setPopup(kind);
    };

    document.addEventListener('click', interceptSharedEntry, true);
    return () => document.removeEventListener('click', interceptSharedEntry, true);
  }, []);

  useEffect(() => {
    if (!popup) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', closeOnEscape);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [close, popup]);

  if (!popup || typeof document === 'undefined') return null;

  const title = popupTitle(popup, locale);
  const icon = popupIcon(popup);

  return createPortal(
    <div
      className="member-shared-popup-backdrop"
      data-member-layer-keeps-profile-open="true"
      data-member-shared-popup="true"
      role="presentation"
      onPointerDown={(event) => {
        if (event.currentTarget === event.target) close();
      }}
    >
      <section className="member-shared-popup" role="dialog" aria-modal="true" aria-label={title}>
        <span className="member-shared-popup-top-line" aria-hidden="true" />
        <header className="member-shared-popup-header">
          <div>
            <span><img src={icon} alt="" aria-hidden="true" /></span>
            <h2>{title}</h2>
          </div>
          <button type="button" onClick={close} aria-label={locale === 'th' ? 'ปิด' : 'Close'}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 3 10 10M13 3 3 13" /></svg>
          </button>
        </header>

        <div className="member-shared-popup-content">
          {popup === 'language' ? (
            <LanguagePanel
              locale={locale}
              onSelect={(nextLocale) => {
                onSetLocale(nextLocale);
                close();
              }}
            />
          ) : (
            <BrowsePromotionsCms
              embedded
              initialView={popup}
              onViewChange={(view) => setPopup(view)}
            />
          )}
        </div>
      </section>
    </div>,
    document.body,
  );
}

function LanguagePanel({
  locale,
  onSelect,
}: {
  locale: MemberLocale;
  onSelect: (locale: MemberLocale) => void;
}) {
  return (
    <div className="member-shared-language-panel">
      <p>{locale === 'th' ? 'เลือกภาษาที่ต้องการใช้งาน' : 'Choose your preferred language'}</p>
      <div>
        <button type="button" className={locale === 'th' ? 'is-active' : ''} onClick={() => onSelect('th')}>
          <img src="/assets/asset-pc/images/flags/th.svg" alt="" aria-hidden="true" />
          <span><strong>ภาษาไทย</strong><small>Thai</small></span>
          <b aria-hidden="true">✓</b>
        </button>
        <button type="button" className={locale === 'en' ? 'is-active' : ''} onClick={() => onSelect('en')}>
          <img src="/assets/asset-pc/images/flags/en.svg" alt="" aria-hidden="true" />
          <span><strong>English</strong><small>ภาษาอังกฤษ</small></span>
          <b aria-hidden="true">✓</b>
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
    return requestedView && BROWSE_VIEWS.has(requestedView as PromotionView)
      ? requestedView as PromotionView
      : 'all';
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
    if (kind === 'all') return 'Promotions, activities and news';
    return 'Promotions';
  }
  if (kind === 'language') return 'เปลี่ยนภาษา';
  if (kind === 'activity') return 'กิจกรรม';
  if (kind === 'news') return 'ข่าวสาร';
  if (kind === 'all') return 'โปรโมชั่น กิจกรรม และข่าวสาร';
  return 'โปรโมชั่น';
}

function popupIcon(kind: MemberSharedPopupKind) {
  const root = '/assets/asset-pc/images';
  if (kind === 'language') return `${root}/เปลียนภาษา.svg`;
  if (kind === 'activity') return `${root}/กิจกรรม.png`;
  if (kind === 'news') return `${root}/ข่าวสาร.png`;
  return `${root}/โปรโมชั้น.png`;
}
