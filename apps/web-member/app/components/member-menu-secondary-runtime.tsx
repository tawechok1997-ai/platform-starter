'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { MemberLocale } from '../member-locale-provider';
import UsageGuideModal from './member-home/usage-guide-modal';

const TransactionsPage = dynamic(() => import('../transactions/page'), {
  ssr: false,
  loading: () => <PopupLoading />,
});
const NotificationsPage = dynamic(() => import('../notifications/page'), {
  ssr: false,
  loading: () => <PopupLoading />,
});

type PopupKind = 'history' | 'notifications' | 'video' | 'guide' | null;

const COPY = {
  th: {
    history: 'ประวัติทำรายการ', notifications: 'แจ้งเตือน', video: 'วิธีแนะนำเพื่อน', close: 'ปิด', loading: 'กำลังโหลด...',
  },
  en: {
    history: 'Transaction history', notifications: 'Notifications', video: 'Referral guide', close: 'Close', loading: 'Loading...',
  },
} as const;

export default function MemberMenuSecondaryRuntime({ locale }: { locale: MemberLocale }) {
  const [popup, setPopup] = useState<PopupKind>(null);
  const closePopup = useCallback(() => setPopup(null), []);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const link = event.target.closest<HTMLAnchorElement>('.public-member-menu-grid--secondary a');
      if (!link) return;

      const links = Array.from(document.querySelectorAll<HTMLAnchorElement>('.public-member-menu-grid--secondary a'));
      const index = links.indexOf(link);
      if (index < 3 || index > 6) return;

      event.preventDefault();
      event.stopPropagation();

      if (index === 3) {
        setPopup('history');
        return;
      }
      if (index === 4) {
        setPopup('notifications');
        return;
      }
      if (index === 5) {
        setPopup('video');
        return;
      }
      setPopup('guide');
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  if (!popup || typeof document === 'undefined') return null;
  if (popup === 'guide') return <UsageGuideModal open onClose={closePopup} />;

  const copy = COPY[locale];
  const title = popup === 'history' ? copy.history : popup === 'notifications' ? copy.notifications : copy.video;
  const icon = popup === 'history'
    ? '/assets/asset-pc/images/ประวัติ.png'
    : popup === 'notifications'
      ? '/assets/asset-pc/images/เเจ้งเตือน.png'
      : '/assets/asset-pc/images/วิดีโอเเนะนำ.png';

  return createPortal(
    <ExistingPopup title={title} icon={icon} closeLabel={copy.close} onClose={closePopup}>
      {popup === 'history'
        ? <TransactionsPage />
        : popup === 'notifications'
          ? <NotificationsPage />
          : <ReferralVideo />}
    </ExistingPopup>,
    document.body,
  );
}

function ExistingPopup({ title, icon, closeLabel, onClose, children }: {
  title: string;
  icon: string;
  closeLabel: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const bodyOverflow = document.body.style.overflow;
    const htmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = htmlOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  return (
    <div
      className="member-existing-popup-backdrop"
      data-member-layer-keeps-profile-open="true"
      role="presentation"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="member-existing-popup" role="dialog" aria-modal="true" aria-label={title}>
        <span className="member-existing-popup-top-line" aria-hidden="true" />
        <header className="member-existing-popup-header">
          <div><span><img src={icon} alt="" aria-hidden="true" /></span><h2>{title}</h2></div>
          <button type="button" onClick={onClose} aria-label={closeLabel}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m3 3 10 10M13 3 3 13" /></svg></button>
        </header>
        <div className="member-existing-popup-content">{children}</div>
      </section>
    </div>
  );
}

function ReferralVideo() {
  return (
    <div className="member-existing-video">
      <video
        autoPlay
        loop
        muted
        controls
        playsInline
        src="/assets/asset-pc/images/affiliate_640.webm"
        onError={(event) => {
          const video = event.currentTarget;
          if (video.dataset.fallback === 'true') return;
          video.dataset.fallback = 'true';
          video.src = 'https://cdn.zabbet.com/videos/affiliate_640.webm';
          void video.play().catch(() => undefined);
        }}
      />
    </div>
  );
}

function PopupLoading() {
  return <div className="member-existing-popup-loading" role="status">กำลังโหลด...</div>;
}
