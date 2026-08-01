'use client';

import Link from 'next/link';
import { useLayoutEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { resolveLocalAssetByBasename } from '../../lib/local-asset-by-basename';
import { useMemberRuntime } from '../../member-runtime-provider';
import { useMemberSession } from '../../member-session-provider';
import MobileMemberPopupRuntime from './mobile-member-popup-runtime';
import styles from './mobile-authenticated-home-runtime.module.css';

const AUTH_SELECTORS = [
  '[data-mobile-section-owner="auth-actions"]',
  '[data-mobile-auth-layout="drawer"]',
] as const;

const VIP_BADGE_SOURCE = 'https://cdn.zabbet.com/FEZX/grouptypes/bc954df4-70bb-460c-9ce8-c2cae326acbe.png';
const MEMBER_AVATAR_FALLBACK = '/images/avatar/7.webp';
const WALLET_ICON = '/images/wallet.webp';
const DEPOSIT_ICON = '/images/ฝาก.png';
const WITHDRAW_ICON = '/images/ถอน.png';
const NETWORK_ICON = '/assets/asset-pc/images/เเนะนำเพื่อน.png';
const COMMISSION_ICON = '/assets/asset-pc/images/รายได่คอมมิชชั่น.png';

type PortalTargets = {
  header: HTMLElement;
  drawerProfile: HTMLElement;
  drawerLogout: HTMLElement;
};

export default function MobileAuthenticatedHomeRuntime() {
  const { profile, summary } = useMemberRuntime();
  const { logout } = useMemberSession();
  const [targets, setTargets] = useState<PortalTargets | null>(null);
  const vipBadge = useMemo(
    () => resolveLocalAssetByBasename(VIP_BADGE_SOURCE, 'mobile')
      || resolveLocalAssetByBasename(VIP_BADGE_SOURCE, 'pc')
      || VIP_BADGE_SOURCE,
    [],
  );

  const profileData = profile as unknown as Record<string, unknown> | null;
  const summaryData = summary as unknown as Record<string, unknown>;
  const memberName = summary.displayName || summary.username || profile?.phone || 'สมาชิก';
  const walletAmount = summary.walletAvailable || '0.00';
  const walletMeta = [summary.walletCurrency || 'THB', summary.walletStatus].filter(Boolean).join(' • ');
  const memberAvatar = textValue(profileData?.avatarUrl) || MEMBER_AVATAR_FALLBACK;
  const affiliateBalance = textValue(summaryData.affiliateBalance) || '0.00';
  const commissionBalance = textValue(summaryData.commissionBalance) || '0.00';
  const referralLink = textValue(summaryData.referralLink) || textValue(profileData?.referralLink) || '/affiliate';

  useLayoutEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-mobile-home-root="true"]');
    if (!root) {
      setTargets(null);
      return;
    }

    const authenticated = summary.isLoggedIn;
    root.dataset.mobileAuthenticated = authenticated ? 'true' : 'false';

    const authElements = AUTH_SELECTORS.flatMap((selector) => Array.from(root.querySelectorAll<HTMLElement>(selector)));
    authElements.forEach((element) => {
      element.hidden = authenticated;
      if (authenticated) element.setAttribute('aria-hidden', 'true');
      else element.removeAttribute('aria-hidden');
    });

    const header = root.querySelector<HTMLElement>('[data-mobile-section-owner="header"] > div');
    const languageButton = header?.querySelector<HTMLElement>('button[aria-label="เปลี่ยนภาษา"]') ?? null;
    if (languageButton) {
      languageButton.hidden = authenticated;
      if (authenticated) languageButton.setAttribute('aria-hidden', 'true');
      else languageButton.removeAttribute('aria-hidden');
    }

    if (!authenticated || !header) {
      setTargets(null);
      return () => restoreGuestElements(authElements, languageButton);
    }

    const drawer = root.querySelector<HTMLElement>('#mobile-home-drawer');
    const menuNavs = drawer ? Array.from(drawer.querySelectorAll<HTMLElement>('nav')) : [];
    const primaryMenu = menuNavs[0] ?? null;
    const secondaryMenu = menuNavs[1] ?? null;
    if (!drawer || !primaryMenu || !secondaryMenu) {
      setTargets(null);
      return;
    }

    primaryMenu.classList.add('public-member-menu-grid');
    secondaryMenu.classList.add('public-member-menu-grid', 'public-member-menu-grid--secondary');

    const languageTrigger = secondaryMenu.querySelector<HTMLButtonElement>('button');
    languageTrigger?.setAttribute('data-mobile-member-popup', 'language');

    const closeButton = drawer.querySelector<HTMLButtonElement>('button[aria-label="ปิดเมนู"]');
    const closeBeforePlainNavigation = (event: PointerEvent) => {
      if (!(event.target instanceof Element)) return;
      const action = event.target.closest<HTMLElement>('a,button');
      if (
        !action
        || !drawer.contains(action)
        || action.dataset.mobileMemberPopup
        || action.dataset.mobileMemberDrawerCopy
      ) return;
      closeButton?.click();
    };
    drawer.addEventListener('pointerdown', closeBeforePlainNavigation, true);

    const drawerProfile = document.createElement('div');
    drawerProfile.dataset.mobileAuthenticatedDrawerProfileTarget = 'true';
    drawer.insertBefore(drawerProfile, primaryMenu);

    const drawerLogout = document.createElement('div');
    drawerLogout.dataset.mobileAuthenticatedDrawerLogoutTarget = 'true';
    drawer.append(drawerLogout);

    const drawerTop = closeButton?.parentElement ?? null;
    if (drawerTop) drawerTop.dataset.mobileAuthenticatedDrawerTop = 'true';

    setTargets({ header, drawerProfile, drawerLogout });

    return () => {
      restoreGuestElements(authElements, languageButton);
      drawer.removeEventListener('pointerdown', closeBeforePlainNavigation, true);
      primaryMenu.classList.remove('public-member-menu-grid');
      secondaryMenu.classList.remove('public-member-menu-grid', 'public-member-menu-grid--secondary');
      languageTrigger?.removeAttribute('data-mobile-member-popup');
      if (drawerTop) delete drawerTop.dataset.mobileAuthenticatedDrawerTop;
      drawerProfile.remove();
      drawerLogout.remove();
    };
  }, [summary.isLoggedIn]);

  if (!summary.isLoggedIn || !targets) return null;

  return (
    <>
      <MobileMemberPopupRuntime />

      {createPortal(
        <>
          <Link href="/search" className={styles.headerSearch} aria-label="ค้นหาเกม"><SearchIcon /></Link>
          <a href="/deposit" className={styles.headerWallet} aria-label={`ยอดเงิน ${walletAmount}`} data-mobile-member-popup="deposit">
            <img src={WALLET_ICON} alt="" aria-hidden="true" />
            <span>{walletAmount}</span>
          </a>
        </>,
        targets.header,
      )}

      {createPortal(
        <div className={styles.drawerAccount} data-mobile-authenticated-drawer-content="true">
          <div className={styles.profileRow}>
            <img className={styles.avatar} src={memberAvatar} alt="รูปโปรไฟล์สมาชิก" onError={(event) => {
              event.currentTarget.src = MEMBER_AVATAR_FALLBACK;
            }} />
            <div className={styles.profileDetails}>
              <div className={styles.vipBadge}>
                <img src={vipBadge} alt="" aria-hidden="true" />
                <span>{summary.vipLevel || 'New'}</span>
              </div>
              <div className={styles.memberNameRow}>
                <strong>{memberName}</strong>
                <Link href="/mobile/member/profile" aria-label="แก้ไขโปรไฟล์"><EditIcon /></Link>
              </div>
              <div className={styles.accountLine}>
                <img src={WALLET_ICON} alt="" aria-hidden="true" />
                <span>{walletMeta || 'กระเป๋าเงินสมาชิก'}</span>
              </div>
            </div>
          </div>

          <div className={styles.moneyActions}>
            <a href="/deposit" data-mobile-member-popup="deposit"><span>ฝากเงิน</span><i aria-hidden="true"><img src={DEPOSIT_ICON} alt="" /></i></a>
            <a href="/withdraw" data-mobile-member-popup="withdraw"><span>ถอนเงิน</span><i aria-hidden="true"><img src={WITHDRAW_ICON} alt="" /></i></a>
          </div>

          <div className={styles.incomePanel}>
            <a href="/affiliate" className={styles.incomeItem} data-mobile-member-popup="network-income">
              <span className={styles.incomeIcon} aria-hidden="true"><img src={NETWORK_ICON} alt="" /></span>
              <span className={styles.incomeCopy}><span>รายได้จากเครือข่าย</span><strong>{affiliateBalance}</strong></span>
              <span className={styles.incomeArrow} aria-hidden="true">›</span>
            </a>
            <a href="/affiliate" className={styles.incomeItem} data-mobile-member-popup="commission-income">
              <span className={styles.incomeIcon} aria-hidden="true"><img src={COMMISSION_ICON} alt="" /></span>
              <span className={styles.incomeCopy}><span>รายได้จากคอมมิชชั่น</span><strong>{commissionBalance}</strong></span>
              <span className={styles.incomeArrow} aria-hidden="true">›</span>
            </a>
          </div>

          <button
            type="button"
            className={styles.referralRow}
            data-mobile-member-drawer-copy="referral"
            onClick={() => {
              const absoluteLink = referralLink.startsWith('http')
                ? referralLink
                : `${window.location.origin}${referralLink}`;
              void navigator.clipboard?.writeText(absoluteLink);
            }}
          >
            <img src={NETWORK_ICON} alt="" aria-hidden="true" />
            <span><strong>ลิงก์แนะนำเพื่อน</strong><small>{referralLink}</small></span>
            <CopyIcon />
          </button>
        </div>,
        targets.drawerProfile,
      )}

      {createPortal(
        <button type="button" className={styles.logoutButton} onClick={logout}><LogoutIcon /><span>ออกจากระบบ</span></button>,
        targets.drawerLogout,
      )}
    </>
  );
}

function textValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function restoreGuestElements(authElements: HTMLElement[], languageButton: HTMLElement | null) {
  authElements.forEach((element) => {
    element.hidden = false;
    element.removeAttribute('aria-hidden');
  });
  if (languageButton) {
    languageButton.hidden = false;
    languageButton.removeAttribute('aria-hidden');
  }
}

function SearchIcon() {
  return <svg viewBox="0 0 18 18" fill="none" aria-hidden="true"><path d="M7.395.704a7.49 7.49 0 0 0-4.529 2.163A7.43 7.43 0 0 0 .77 6.908c-.078.434-.11 1.593-.055 2.073.203 1.738.937 3.264 2.147 4.47 1.308 1.301 2.909 2.035 4.764 2.183 1.725.137 3.63-.413 4.977-1.432l.23-.176 1.605 1.6c1.75 1.746 1.706 1.711 2.132 1.68.41-.031.703-.324.734-.734.031-.426.063-.383-1.679-2.132l-1.6-1.605.171-.23c1.242-1.66 1.73-3.897 1.3-5.962C14.852 3.527 12.307 1.157 9.156.739 8.789.689 7.653.669 7.395.704Zm1.757 1.718c.789.129 1.749.531 2.429 1.019.425.305 1.01.894 1.319 1.332.488.687.84 1.518 1.004 2.37.093.487.093 1.58-.004 2.069-.477 2.412-2.277 4.212-4.69 4.689-.487.097-1.58.097-2.069.004-1.171-.227-2.249-.785-3.06-1.586-1.999-1.979-2.316-5.044-.758-7.398.309-.465 1.015-1.195 1.456-1.503 1.07-.746 2.327-1.125 3.573-1.074.238.012.597.047.8.078Z" fill="currentColor" /></svg>;
}

function EditIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></svg>;
}

function CopyIcon() {
  return <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M6 12c-.367 0-.681-.131-.942-.392a1.284 1.284 0 0 1-.391-.941v-8c0-.367.13-.681.391-.942.261-.261.575-.392.942-.392h6c.367 0 .681.131.942.392.26.261.391.575.391.942v8c0 .366-.13.68-.391.941A1.284 1.284 0 0 1 12 12H6Zm0-1.333h6v-8H6v8ZM3.333 14.667c-.366 0-.68-.13-.941-.391A1.284 1.284 0 0 1 2 13.333V4h1.333v9.333h7.334v1.334H3.333Z" fill="currentColor" /></svg>;
}

function LogoutIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3" /><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" /></svg>;
}
