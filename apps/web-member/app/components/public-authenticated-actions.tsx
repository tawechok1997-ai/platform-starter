'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { MemberLocale } from '../member-locale-provider';
import MemberProfileDetailModal from './member-profile-detail-modal';
import '../member-profile-detail-modal.css';

type OpenPanel = 'notifications' | 'profile' | null;
type NoticeTab = 'all' | 'benefits' | 'messages';

type PublicAuthenticatedActionsProps = {
  locale: MemberLocale;
  siteName: string;
  walletLoading: boolean;
  compactWalletBalance: string;
  pendingCount: number;
  logout: () => void;
  onToggleLocale: () => void;
};

const COPY = {
  th: {
    notifications: 'แจ้งเตือน',
    all: 'ทั้งหมด',
    benefits: 'สิทธิพิเศษ',
    messages: 'ข้อความ',
    noMessages: 'ไม่มีข้อความใหม่',
    pendingTitle: 'มีรายการที่กำลังตรวจสอบ',
    pendingDetail: 'ตรวจสอบสถานะรายการฝากและถอนล่าสุด',
    viewPending: 'ดูรายการ',
    balance: 'ยอดเงินคงเหลือ',
    deposit: 'ฝาก',
    withdraw: 'ถอน',
    member: 'สมาชิก',
    networkIncome: 'รายได้จากเครือข่าย',
    commissionIncome: 'รายได้จากคอมมิชชั่น',
    referralLink: 'ลิงก์แนะนำเพื่อน',
    openAffiliate: 'เปิดหน้าตัวแทน',
    vip: 'ระดับสมาชิก VIP',
    commission: 'รายได้คอมมิชชั่น',
    referral: 'แนะนำเพื่อน',
    coupon: 'คูปอง',
    specialBonus: 'โบนัสพิเศษ',
    live: 'ถ่ายทอดสด',
    promotions: 'โปรโมชั่น',
    news: 'ข่าวสาร',
    activity: 'กิจกรรม',
    history: 'ประวัติ',
    alert: 'แจ้งเตือน',
    video: 'วีดีโอแนะนำ',
    guide: 'แนะนำการใช้งาน',
    language: 'เปลี่ยนภาษา',
    logout: 'ออกจากระบบ',
    openProfile: 'เปิดเมนูสมาชิก',
    openProfileDetail: 'เปิดรายละเอียดโปรไฟล์',
    closePanel: 'ปิดเมนู',
  },
  en: {
    notifications: 'Notifications',
    all: 'All',
    benefits: 'Benefits',
    messages: 'Messages',
    noMessages: 'No new messages',
    pendingTitle: 'Items are being reviewed',
    pendingDetail: 'Review your latest deposit and withdrawal status',
    viewPending: 'View items',
    balance: 'Wallet balance',
    deposit: 'Deposit',
    withdraw: 'Withdraw',
    member: 'Member',
    networkIncome: 'Network income',
    commissionIncome: 'Commission income',
    referralLink: 'Referral link',
    openAffiliate: 'Open affiliate page',
    vip: 'VIP membership',
    commission: 'Commission income',
    referral: 'Refer friends',
    coupon: 'Coupons',
    specialBonus: 'Special bonus',
    live: 'Live',
    promotions: 'Promotions',
    news: 'News',
    activity: 'Activities',
    history: 'History',
    alert: 'Notifications',
    video: 'Video guide',
    guide: 'User guide',
    language: 'Change language',
    logout: 'Log out',
    openProfile: 'Open member menu',
    openProfileDetail: 'Open profile details',
    closePanel: 'Close menu',
  },
} as const;

export default function PublicAuthenticatedActions({
  locale,
  siteName,
  walletLoading,
  compactWalletBalance,
  pendingCount,
  logout,
  onToggleLocale,
}: PublicAuthenticatedActionsProps) {
  const copy = COPY[locale];
  const rootRef = useRef<HTMLDivElement>(null);
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [noticeTab, setNoticeTab] = useState<NoticeTab>('messages');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(7);
  const memberLabel = locale === 'th' ? `${copy.member} ${siteName}` : `${siteName} ${copy.member}`;
  const flagUrl = locale === 'th' ? '/images/flags/th.svg' : '/assets/asset-pc/images/flags/en.svg';
  const avatarUrl = `/images/avatar/${selectedAvatar}.webp`;

  useEffect(() => {
    try {
      const storedAvatar = Number(window.localStorage.getItem('member_selected_avatar'));
      if (Number.isInteger(storedAvatar) && storedAvatar >= 1 && storedAvatar <= 15) setSelectedAvatar(storedAvatar);
    } catch {
      // Storage can be unavailable in private or restricted browser contexts.
    }
  }, []);

  useEffect(() => {
    if (!openPanel) return;

    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpenPanel(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenPanel(null);
    };

    document.addEventListener('pointerdown', closeOutside);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [openPanel]);

  const togglePanel = (panel: Exclude<OpenPanel, null>) => {
    setOpenPanel((current) => (current === panel ? null : panel));
  };

  const selectAvatar = (avatar: number) => {
    const image = new Image();
    image.onload = () => {
      setSelectedAvatar(avatar);
      try {
        window.localStorage.setItem('member_selected_avatar', String(avatar));
      } catch {
        // Keep the selected avatar for this session when storage is unavailable.
      }
    };
    image.src = `/images/avatar/${avatar}.webp`;
  };

  const primaryItems = [
    { label: copy.vip, href: '/profile', glyph: 'VIP' },
    { label: copy.commission, href: '/affiliate', glyph: '฿' },
    { label: copy.referral, href: '/affiliate', glyph: '↗' },
    { label: copy.coupon, href: '/bonus', glyph: '◇' },
    { label: copy.specialBonus, href: '/bonus', glyph: '✦' },
    { label: copy.live, href: '/#live', glyph: '●' },
  ];

  const secondaryItems = [
    { label: copy.promotions, href: '/promotions', glyph: '%' },
    { label: copy.news, href: '/browse/promotions?view=news', glyph: 'N' },
    { label: copy.activity, href: '/browse/promotions?view=activity', glyph: '★' },
    { label: copy.history, href: '/transactions', glyph: '↺' },
    { label: copy.alert, href: '/notifications', glyph: '!' },
    { label: copy.video, href: '/guide', glyph: '▶' },
    { label: copy.guide, href: '/guide', glyph: '?' },
  ];

  return (
    <div className="public-member-actions" ref={rootRef}>
      <div className="public-member-popover-anchor public-member-notification-anchor">
        <button
          type="button"
          className="public-member-icon-button"
          aria-label={copy.notifications}
          aria-expanded={openPanel === 'notifications'}
          aria-controls="public-member-notifications"
          onClick={() => togglePanel('notifications')}
        >
          <BellIcon />
          {pendingCount > 0 ? <span className="public-member-badge">{Math.min(pendingCount, 99)}</span> : null}
        </button>

        {openPanel === 'notifications' ? (
          <section id="public-member-notifications" className="public-member-popover public-member-notification-popover" role="dialog" aria-label={copy.notifications}>
            <div className="public-member-tabs" role="tablist" aria-label={copy.notifications}>
              {(['all', 'benefits', 'messages'] as NoticeTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={noticeTab === tab}
                  className={noticeTab === tab ? 'is-active' : ''}
                  onClick={() => setNoticeTab(tab)}
                >
                  {copy[tab]}
                </button>
              ))}
            </div>

            <div className="public-member-notice-body" aria-live="polite">
              {noticeTab === 'all' && pendingCount > 0 ? (
                <div className="public-member-pending-notice">
                  <span className="public-member-pending-icon">{pendingCount}</span>
                  <div>
                    <strong>{copy.pendingTitle}</strong>
                    <p>{copy.pendingDetail}</p>
                    <Link href="/transactions" onClick={() => setOpenPanel(null)}>{copy.viewPending}</Link>
                  </div>
                </div>
              ) : (
                <div className="public-member-empty-notice">
                  <EmptyNoticeIcon />
                  <span>{copy.noMessages}</span>
                </div>
              )}
            </div>
            <span className="public-member-popover-arrow" aria-hidden="true" />
          </section>
        ) : null}
      </div>

      <div className="public-member-wallet-pill" aria-label={`${copy.balance} ${compactWalletBalance}`}>
        <span className="public-member-wallet-balance">
          <img src="/images/wallet.webp" alt="" aria-hidden="true" />
          <strong>{walletLoading ? '…' : compactWalletBalance}</strong>
        </span>
        <span className="public-member-wallet-divider" aria-hidden="true" />
        <Link className="public-member-wallet-action" href="/deposit" aria-label={copy.deposit}>
          <DepositIcon />
          <span>{copy.deposit}</span>
        </Link>
        <span className="public-member-wallet-divider" aria-hidden="true" />
        <Link className="public-member-wallet-action" href="/withdraw" aria-label={copy.withdraw}>
          <WithdrawIcon />
          <span>{copy.withdraw}</span>
        </Link>
      </div>

      <div className="public-member-popover-anchor public-member-profile-anchor">
        <button
          type="button"
          className="public-member-profile-trigger"
          aria-label={copy.openProfile}
          aria-expanded={openPanel === 'profile'}
          aria-controls="public-member-profile-menu"
          onClick={() => togglePanel('profile')}
        >
          <img src={avatarUrl} alt="" onError={useAvatarFallback} />
          <ChevronIcon />
        </button>

        {openPanel === 'profile' ? (
          <section id="public-member-profile-menu" className="public-member-popover public-member-profile-popover" role="dialog" aria-label={copy.openProfile}>
            <div className="public-member-profile-head">
              <button
                type="button"
                className="public-member-profile-avatar-button"
                aria-label={copy.openProfileDetail}
                onClick={() => {
                  setOpenPanel(null);
                  setProfileModalOpen(true);
                }}
              >
                <img src={avatarUrl} alt="" onError={useAvatarFallback} />
              </button>
              <strong>{memberLabel}</strong>
            </div>

            <div className="public-member-income-row">
              <Link href="/affiliate" onClick={() => setOpenPanel(null)}>
                <span>{copy.networkIncome}</span>
                <strong>0.00</strong>
                <em>›</em>
              </Link>
              <Link href="/affiliate" onClick={() => setOpenPanel(null)}>
                <span>{copy.commissionIncome}</span>
                <strong>0.00</strong>
                <em>›</em>
              </Link>
            </div>

            <Link className="public-member-referral-row" href="/affiliate" onClick={() => setOpenPanel(null)}>
              <span className="public-member-referral-icon">↗</span>
              <span>
                <strong>{copy.referralLink}</strong>
                <small>{copy.openAffiliate}</small>
              </span>
              <em>›</em>
            </Link>

            <nav className="public-member-menu-grid" aria-label={copy.openProfile}>
              {primaryItems.map((item) => (
                <Link key={`${item.href}-${item.label}`} href={item.href} onClick={() => setOpenPanel(null)}>
                  <span className="public-member-menu-glyph">{item.glyph}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <nav className="public-member-menu-grid public-member-menu-grid--secondary" aria-label={copy.openProfile}>
              {secondaryItems.map((item) => (
                <Link key={`${item.href}-${item.label}`} href={item.href} onClick={() => setOpenPanel(null)}>
                  <span className="public-member-menu-glyph">{item.glyph}</span>
                  <span>{item.label}</span>
                  {item.href === '/notifications' && pendingCount > 0 ? <b>{Math.min(pendingCount, 99)}</b> : null}
                </Link>
              ))}
              <button
                type="button"
                onClick={() => {
                  onToggleLocale();
                  setOpenPanel(null);
                }}
              >
                <span className="public-member-menu-glyph public-member-language-glyph"><img src={flagUrl} alt="" /></span>
                <span>{copy.language}</span>
              </button>
            </nav>

            <button
              type="button"
              className="public-member-logout-button"
              onClick={() => {
                setOpenPanel(null);
                logout();
              }}
            >
              <LogoutIcon />
              <span>{copy.logout}</span>
            </button>
            <span className="public-member-popover-arrow public-member-popover-arrow--profile" aria-hidden="true" />
          </section>
        ) : null}
      </div>

      <MemberProfileDetailModal
        open={profileModalOpen}
        locale={locale}
        fallbackLabel={memberLabel}
        selectedAvatar={selectedAvatar}
        onClose={() => setProfileModalOpen(false)}
        onSelectAvatar={selectAvatar}
      />
    </div>
  );
}

function useAvatarFallback(event: React.SyntheticEvent<HTMLImageElement>) {
  const image = event.currentTarget;
  if (image.dataset.fallback === 'true') return;
  image.dataset.fallback = 'true';
  image.src = '/images/avatar/7.webp';
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </svg>
  );
}

function DepositIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v11" />
      <path d="m8 11 4 4 4-4" />
      <path d="M5 20h14" />
    </svg>
  );
}

function WithdrawIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 20V9" />
      <path d="m8 13 4-4 4 4" />
      <path d="M5 4h14" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 5H5v14h5" />
      <path d="M13 8l4 4-4 4" />
      <path d="M8 12h9" />
    </svg>
  );
}

function EmptyNoticeIcon() {
  return (
    <svg viewBox="0 0 116 81" aria-hidden="true">
      <path d="M23 36h64v37a8 8 0 0 1-8 8H31a8 8 0 0 1-8-8V36Z" />
      <path d="M8 17 65 2a8 8 0 0 1 10 6l2 8a8 8 0 0 1-6 10L14 41a8 8 0 0 1-10-6l-2-8a8 8 0 0 1 6-10Z" />
      <path d="M48 49h14" />
      <path d="M69 35c13-3 19-7 16-12-2-3-7-3-10 0-3 3-2 10 2 10 11 1 23-5 29-16" />
    </svg>
  );
}
