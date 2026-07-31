'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useMemberLocale } from '../member-locale-provider';
import { useMemberRuntime } from '../member-runtime-provider';
import { useMemberSession } from '../member-session-provider';
import { useSiteSettings } from '../site-settings-provider';
import { MemberDrawer } from './member-modal-system';
import { openMemberSharedPopup, type MemberSharedPopupKind } from './member-shared-popup-runtime';
import { V47_ASSETS } from './member-home/v47-asset-map';

const STANDALONE_PUBLIC_PREFIXES = ['/clone-preview', '/login', '/register', '/maintenance', '/session-expired'];
const ASSET_BASE = '/assets/asset-pc/images';

type PrimaryItemId = 'vip' | 'commission' | 'referral' | 'coupon' | 'bonus' | 'live';
type SecondaryItemId = 'promotions' | 'news' | 'activity' | 'history' | 'alerts' | 'video' | 'guide';

type PrimaryItem = {
  id: PrimaryItemId;
  href: string;
  icon: string;
};

type SecondaryItem = {
  id: SecondaryItemId;
  href: string;
  icon: string;
  protected?: boolean;
  sharedPopup?: MemberSharedPopupKind;
};

const PRIMARY_ITEMS: PrimaryItem[] = [
  { id: 'vip', href: '/profile', icon: `${ASSET_BASE}/ระดับสมาชิก.png` },
  { id: 'commission', href: '/affiliate', icon: `${ASSET_BASE}/รายได่คอมมิชชั่น.png` },
  { id: 'referral', href: '/affiliate', icon: `${ASSET_BASE}/เเนะนำเพื่อน.png` },
  { id: 'coupon', href: '/bonus', icon: `${ASSET_BASE}/คูปอง.png` },
  { id: 'bonus', href: '/bonus', icon: `${ASSET_BASE}/โบนัสพิเศษ.png` },
  { id: 'live', href: '/live', icon: `${ASSET_BASE}/ถ่ายถอดสด.png` },
];

const SECONDARY_ITEMS: SecondaryItem[] = [
  { id: 'promotions', href: '/promotions', icon: `${ASSET_BASE}/โปรโมชั้น.png`, sharedPopup: 'promotion' },
  { id: 'news', href: '/browse/promotions?view=news', icon: `${ASSET_BASE}/ข่าวสาร.png`, sharedPopup: 'news' },
  { id: 'activity', href: '/browse/promotions?view=activity', icon: `${ASSET_BASE}/กิจกรรม.png`, sharedPopup: 'activity' },
  { id: 'history', href: '/transactions', icon: `${ASSET_BASE}/ประวัติ.png`, protected: true },
  { id: 'alerts', href: '/notifications', icon: `${ASSET_BASE}/เเจ้งเตือน.png`, protected: true },
  { id: 'video', href: '/guide', icon: `${ASSET_BASE}/วิดีโอเเนะนำ.png` },
  { id: 'guide', href: '/guide', icon: `${ASSET_BASE}/เเนะนำการใช้งาน.png` },
];

const COPY = {
  th: {
    menu: 'เมนูสมาชิก',
    close: 'ปิดเมนู',
    changeLanguage: 'เปลี่ยนภาษา',
    register: 'สมัครสมาชิก',
    login: 'เข้าสู่ระบบ',
    logout: 'ออกจากระบบ',
    vip: 'ระดับสมาชิก VIP',
    commission: 'รายได้คอมมิชชั่น',
    referral: 'แนะนำเพื่อน',
    coupon: 'คูปอง',
    bonus: 'โบนัสพิเศษ',
    live: 'ถ่ายทอดสด',
    promotions: 'โปรโมชั่น',
    news: 'ข่าวสาร',
    activity: 'กิจกรรม',
    history: 'ประวัติ',
    alerts: 'แจ้งเตือน',
    video: 'วีดีโอแนะนำ',
    guide: 'แนะนำการใช้งาน',
  },
  en: {
    menu: 'Member menu',
    close: 'Close menu',
    changeLanguage: 'Change language',
    register: 'Register',
    login: 'Log in',
    logout: 'Log out',
    vip: 'VIP membership',
    commission: 'Commission income',
    referral: 'Refer friends',
    coupon: 'Coupons',
    bonus: 'Special bonus',
    live: 'Live',
    promotions: 'Promotions',
    news: 'News',
    activity: 'Activities',
    history: 'History',
    alerts: 'Notifications',
    video: 'Video guide',
    guide: 'User guide',
  },
} as const;

export default function PublicMobileSourceHeader() {
  const pathname = usePathname() ?? '/';
  const { locale } = useMemberLocale();
  const { typedSettings } = useSiteSettings();
  const runtime = useMemberRuntime();
  const { ready, isLoggedIn, logout } = useMemberSession();
  const [menuOpen, setMenuOpen] = useState(false);

  if (STANDALONE_PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null;

  const copy = COPY[locale];
  const authenticated = ready && isLoggedIn;
  const mobileNavigation = runtime.navigation.filter((item) => item.mobile);
  const liveNavigation = mobileNavigation.find((item) => item.id === 'live');
  const configuredLogoUrl = typedSettings.branding.logo_mobile_url?.trim() || typedSettings.branding.logo_url?.trim();
  const logoUrl = configuredLogoUrl && !configuredLogoUrl.startsWith('/home-asset/')
    ? configuredLogoUrl
    : V47_ASSETS.headerLogo;
  const flagUrl = locale === 'th'
    ? V47_ASSETS.headerFlag
    : '/assets/asset-pc/images/flags/en.svg';

  const openSharedPopup = (kind: MemberSharedPopupKind) => {
    setMenuOpen(false);
    window.requestAnimationFrame(() => openMemberSharedPopup(kind));
  };

  return (
    <>
      <header className="public-mobile-source-header" data-locale={locale}>
        <div className="public-mobile-source-header__inner">
          <button
            type="button"
            className="public-mobile-source-header__menu"
            aria-label={copy.menu}
            aria-controls="member-mobile-menu-drawer"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <span aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </button>

          <Link href="/" className="public-mobile-source-header__brand" aria-label={typedSettings.website.site_name}>
            <img src={logoUrl} alt={typedSettings.website.site_name} />
          </Link>

          <button
            type="button"
            className="public-mobile-source-header__language"
            aria-label={copy.changeLanguage}
            title={copy.changeLanguage}
            onClick={() => openMemberSharedPopup('language')}
          >
            <img src={flagUrl} alt="" aria-hidden="true" />
          </button>
        </div>
      </header>

      <MemberDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        ariaLabel={copy.menu}
        backdropClassName="member-mobile-runtime-drawer-backdrop"
        panelClassName="member-mobile-runtime-drawer"
        contentClassName="member-mobile-runtime-drawer__content"
      >
        <div className="member-mobile-source-menu">
          <div className="member-mobile-source-menu__top">
            <Link href="/" onClick={() => setMenuOpen(false)} aria-label={typedSettings.website.site_name}>
              <img src={logoUrl} alt={typedSettings.website.site_name} />
            </Link>
            <button type="button" onClick={() => setMenuOpen(false)} aria-label={copy.close}>
              <img src={runtime.icons.close || '/images/close.svg'} alt="" aria-hidden="true" />
            </button>
          </div>

          {authenticated ? (
            <div className="member-mobile-source-menu__summary">
              <strong>{runtime.summary.displayName}</strong>
              <span>{runtime.summary.walletCurrency} {runtime.summary.walletAvailable}</span>
            </div>
          ) : null}

          <nav
            className="public-member-menu-grid member-mobile-source-menu__primary"
            aria-label={locale === 'th' ? 'บริการสมาชิก' : 'Member services'}
          >
            {PRIMARY_ITEMS.map((item) => {
              const requiresLogin = item.id !== 'live';
              const destination = item.id === 'live' ? (liveNavigation?.href || item.href) : item.href;
              const href = requiresLogin && !authenticated ? memberLoginHref(destination) : destination;
              const icon = item.id === 'live' ? (liveNavigation?.icon || item.icon) : item.icon;
              const label = item.id === 'live' ? (liveNavigation?.label || copy.live) : copy[item.id];
              return (
                <Link
                  key={item.id}
                  href={href}
                  onClick={() => {
                    if (!authenticated || item.id === 'live') setMenuOpen(false);
                  }}
                >
                  <span className="public-member-menu-glyph">
                    <img src={icon} alt="" aria-hidden="true" />
                  </span>
                  <strong>{label}</strong>
                  <span className="member-mobile-source-menu__arrow" aria-hidden="true">→</span>
                </Link>
              );
            })}
          </nav>

          <nav
            className="member-mobile-source-menu__secondary"
            aria-label={locale === 'th' ? 'เมนูเพิ่มเติม' : 'More member tools'}
          >
            {SECONDARY_ITEMS.map((item) => {
              const label = copy[item.id];
              const sharedPopup = item.sharedPopup;
              if (sharedPopup) {
                return (
                  <button type="button" key={item.id} onClick={() => openSharedPopup(sharedPopup)}>
                    <span className="public-member-menu-glyph">
                      <img src={item.icon} alt="" aria-hidden="true" />
                    </span>
                    <strong>{label}</strong>
                  </button>
                );
              }

              const href = item.protected && !authenticated ? memberLoginHref(item.href) : item.href;
              return (
                <Link key={item.id} href={href} onClick={() => setMenuOpen(false)}>
                  <span className="public-member-menu-glyph">
                    <img src={item.icon} alt="" aria-hidden="true" />
                  </span>
                  <strong>{label}</strong>
                  {item.id === 'alerts' && runtime.summary.pendingCount > 0 ? (
                    <b>{Math.min(runtime.summary.pendingCount, 99)}</b>
                  ) : null}
                </Link>
              );
            })}

            <button type="button" onClick={() => openSharedPopup('language')}>
              <span className="public-member-menu-glyph public-member-language-glyph">
                <img src={`${ASSET_BASE}/เปลียนภาษา.svg`} alt="" aria-hidden="true" />
              </span>
              <strong>{copy.changeLanguage}</strong>
            </button>
          </nav>

          <div className="member-mobile-source-menu__auth">
            {!authenticated ? (
              <>
                {runtime.features.registration ? (
                  <Link className="is-register" href="/?auth=register" onClick={() => setMenuOpen(false)}>
                    <span>{copy.register}</span>
                  </Link>
                ) : null}
                {runtime.features.login ? (
                  <Link className="is-login" href="/?auth=login" onClick={() => setMenuOpen(false)}>
                    <span>{copy.login}</span>
                  </Link>
                ) : null}
              </>
            ) : (
              <button
                type="button"
                className="is-logout"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
              >
                <span>{copy.logout}</span>
              </button>
            )}
          </div>
        </div>
      </MemberDrawer>
    </>
  );
}

function memberLoginHref(next: string) {
  return `/?auth=login&next=${encodeURIComponent(next)}`;
}
