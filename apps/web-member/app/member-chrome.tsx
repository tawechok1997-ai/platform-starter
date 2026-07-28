'use client';

import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { MemberFeatureFlags } from './site-settings';
import { createGameCategoryNavigationConfig } from './brand/game-category-navigation';
import { activeNavigationHref, navigationFor } from './member-navigation';
import { disabledMemberRoute, isPublicMemberRoute, routeRuleFor } from './member-routes';
import MemberFooter from './member-footer';
import { useSiteSettings } from './site-settings-provider';
import { useMemberSession } from './member-session-provider';
import { usePendingCount } from './hooks/use-pending-count';
import { BrandIcon } from './components/brand-icon';
import { MemberCard, MemberLinkButton } from './components/member-ui';
import { CloseIcon, MenuIcon } from './components/member-icon';
import { MemberCategoryRail } from './components/member-category-rail';
import { DesktopAllianceBand } from './components/member-home/desktop-alliance-band';
import { V47_ASSETS } from './components/member-home/v47-asset-map';
import MemberAuthOverlay, { type MemberAuthMode } from './components/auth/member-auth-overlay';
import DailyMissionModal from './components/mission/daily-mission-modal';
import { formatMemberWalletBalance } from '../src/features/wallet/member-wallet';

const PUBLIC_HOME_NAV = [
  { key: 'home', title: 'หน้าหลัก', href: '/', icon: V47_ASSETS.menuHome },
  { key: 'casino', title: 'คาสิโน', href: '/browse/games?category=casino', icon: V47_ASSETS.menuCasino },
  { key: 'slot', title: 'สล็อต', href: '/browse/games?category=slot', icon: V47_ASSETS.menuSlot },
  { key: 'fishing', title: 'ยิงปลา', href: '/browse/games?category=fishing', icon: V47_ASSETS.menuFishing },
  { key: 'sport', title: 'กีฬา', href: '/browse/games?category=sport', icon: V47_ASSETS.menuSport },
  { key: 'card', title: 'ไพ่', href: '/browse/games?category=card', icon: V47_ASSETS.menuCard },
  { key: 'lottery', title: 'หวย', href: '/browse/games?category=lottery', icon: V47_ASSETS.menuLottery },
  { key: 'live', title: 'ถ่ายทอดสด', href: '#live', icon: V47_ASSETS.menuLive },
];

export default function MemberChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authMode, setAuthMode] = useState<MemberAuthMode | null>(null);
  const [missionOpen, setMissionOpen] = useState(false);
  const { typedSettings } = useSiteSettings();
  const { ready, isLoggedIn, wallet, walletLoading, verify, logout } = useMemberSession();
  const { website, branding, icons, theme, features: typedFeatures } = typedSettings;

  const features: MemberFeatureFlags = {
    registration: typedFeatures.registration_enabled,
    login: typedFeatures.login_enabled,
    deposit: typedFeatures.deposit_enabled,
    withdraw: typedFeatures.withdraw_enabled,
    promotion: typedFeatures.promotion_enabled,
    bonus: typedFeatures.bonus_enabled,
    affiliate: typedFeatures.affiliate_enabled,
    support: typedFeatures.support_enabled,
    kyc: typedFeatures.kyc_enabled,
    games: typedFeatures.game_lobby_enabled,
    profile: typedFeatures.profile_enabled,
    notifications: typedFeatures.notification_enabled,
  };

  const isHomeRoute = pathname === '/';
  const isPublicRoute = isPublicMemberRoute(pathname);
  const isBrowseRoute = pathname.startsWith('/browse');
  const isPublicGameShellRoute = isHomeRoute || isBrowseRoute;
  const currentRule = routeRuleFor(pathname);
  const blockedRoute = disabledMemberRoute(pathname, features);
  const activeHref = useMemo(() => activeNavigationHref(pathname), [pathname]);
  const visibleBottomNav = navigationFor('bottom', features);
  const visibleDrawer = navigationFor('drawer', features);
  const gameCategoryNavigation = createGameCategoryNavigationConfig(typedSettings);
  const { pendingCount } = usePendingCount(isLoggedIn && !isHomeRoute && !isPublicRoute);

  const siteName = website.site_name;
  const siteDescription = website.site_description;
  const configuredLogoUrl = branding.logo_url?.trim();
  const logoUrl = configuredLogoUrl && !configuredLogoUrl.startsWith('/home-asset/')
    ? configuredLogoUrl
    : V47_ASSETS.headerLogo;
  const brandMark = branding.brand_mark || siteName.slice(0, 1).toUpperCase() || 'P';
  const formattedWalletBalance = formatMemberWalletBalance(wallet);
  const compactWalletBalance = formattedWalletBalance.replace(/^[A-Z]{3}\s+/, '');

  const closeAuth = useCallback(() => {
    setAuthMode(null);
    const url = new URL(window.location.href);
    if (url.searchParams.has('auth')) {
      url.searchParams.delete('auth');
      url.searchParams.delete('next');
      window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);

  const closeMission = useCallback(() => setMissionOpen(false), []);

  const completeAuth = useCallback(async () => {
    const next = new URLSearchParams(window.location.search).get('next');
    await verify();
    setAuthMode(null);
    if (next && next.startsWith('/') && !next.startsWith('//')) {
      window.location.assign(next);
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.delete('auth');
    url.searchParams.delete('next');
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
    router.refresh();
  }, [router, verify]);

  useEffect(() => {
    document.documentElement.style.setProperty('--color-brand', branding.primary_color);
  }, [branding.primary_color]);

  useEffect(() => {
    if (!ready) return;
    if (currentRule?.authRedirectHome && isLoggedIn) {
      window.location.replace('/');
      return;
    }
    if (!isHomeRoute && !isPublicRoute && !isLoggedIn) {
      const next = encodeURIComponent(`${pathname}${window.location.search}`);
      window.location.replace(`/?auth=login&next=${next}`);
    }
  }, [ready, isLoggedIn, isHomeRoute, isPublicRoute, pathname, currentRule?.authRedirectHome]);

  useEffect(() => {
    if (!isHomeRoute && !isBrowseRoute) return;
    const requestedMode = new URLSearchParams(window.location.search).get('auth');
    if (requestedMode === 'login' || requestedMode === 'register') setAuthMode(requestedMode);
  }, [isHomeRoute, isBrowseRoute, pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const bodyOverflow = document.body.style.overflow;
    const htmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = htmlOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
    setMissionOpen(false);
  }, [pathname]);

  const authOverlay = authMode ? <MemberAuthOverlay mode={authMode} onClose={closeAuth} onSuccess={completeAuth} /> : null;
  const missionOverlay = <DailyMissionModal open={missionOpen} onClose={closeMission} />;

  if (isPublicGameShellRoute) {
    return (
      <>
        <PublicHomeHeader
          logoUrl={logoUrl}
          brandMark={brandMark}
          features={features}
          pathname={pathname}
          isLoggedIn={isLoggedIn}
          walletLoading={walletLoading}
          compactWalletBalance={compactWalletBalance}
          logout={logout}
          onOpenLogin={() => setAuthMode('login')}
          onOpenRegister={() => setAuthMode('register')}
          onOpenMission={() => setMissionOpen(true)}
        />
        <div className="public-game-shell">
          <div className="public-game-shell__content">{children}</div>
          <DesktopAllianceBand />
        </div>
        <MemberFooter settings={typedSettings} />
        {authOverlay}
        {missionOverlay}
      </>
    );
  }

  if (isPublicRoute) return <>{children}</>;
  if (!ready || !isLoggedIn) return <main className="member-loading-screen">กำลังโหลด...</main>;

  const content = blockedRoute ? <FeatureDisabled label={blockedRoute.label} siteName={siteName} /> : children;

  return (
    <>
      <header className="member-topbar global-member-topbar">
        <div className="member-topbar__inner">
          <div className="member-header-tools">
            <button type="button" className="member-header-tool" onClick={() => setMenuOpen(true)} aria-label="เปิดเมนู"><MenuIcon /></button>
            <a className="member-header-tool" href="/games" aria-label="ค้นหาเกม">⌕</a>
          </div>
          <a href="/" className="member-brand">
            <span className="member-brand-mark">{logoUrl ? <img src={logoUrl} alt="" className="member-brand-logo" /> : brandMark}</span>
            <span className="member-brand-copy"><strong>{siteName}</strong><small>{siteDescription}</small></span>
          </a>
          <nav className="member-desktop-nav" aria-label="เมนูหลักเดสก์ท็อป">
            {visibleBottomNav.map((item) => (
              <a key={item.key} href={item.href} className={activeHref === item.href ? 'active' : ''} aria-current={activeHref === item.href ? 'page' : undefined}>
                <BrandIcon name={item.iconKey} existing={icons} className="member-nav-icon-image" />
                <span>{item.shortTitle ?? item.title}</span>
                {item.badge === 'pending' && pendingCount > 0 && <em>{pendingCount}</em>}
              </a>
            ))}
          </nav>
          <div className="member-actions">
            <a href="/notifications" className="member-header-icon" aria-label="แจ้งเตือน">
              <BrandIcon name="notification" existing={icons} className="member-nav-icon-image" />
              {pendingCount > 0 && <em>{pendingCount}</em>}
            </a>
            <span className="member-header-wallet" aria-label={walletLoading ? 'กำลังโหลดยอดเงิน' : `ยอดใช้ได้ ${formattedWalletBalance}`} aria-live="polite">
              <img src="/images/member-lobby/noah345-reference/0012_wallet_a4fadd0a57.webp" alt="" aria-hidden="true" />
              <span className="member-header-wallet__amount">{walletLoading ? '…' : compactWalletBalance}</span>
            </span>
            <button type="button" className="member-header-logout" onClick={logout} aria-label="ออกจากระบบ"><span aria-hidden="true">↪</span><span>ออกจากระบบ</span></button>
          </div>
        </div>
      </header>

      {theme.show_game_categories && <MemberCategoryRail pathname={pathname} features={features} config={gameCategoryNavigation} baseIcons={icons} />}
      {menuOpen && <button type="button" className="member-menu-backdrop ui-overlay" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู" />}

      <aside className={menuOpen ? 'member-drawer ui-drawer open' : 'member-drawer ui-drawer'} role="dialog" aria-modal="true" aria-label="เมนูสมาชิก" aria-hidden={!menuOpen} tabIndex={-1}>
        <div className="member-drawer-head ui-overlay-surface__header">
          <div><strong>{siteName}</strong><p>{siteDescription}</p></div>
          <div className="member-drawer-head__actions">
            {pathname !== '/' && <button type="button" className="member-drawer-back-button" onClick={() => { setMenuOpen(false); if (window.history.length > 1) router.back(); else router.push('/'); }}>← ย้อนกลับ</button>}
            <button type="button" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู"><CloseIcon /></button>
          </div>
        </div>
        <nav className="member-drawer-nav ui-overlay-surface__body">
          {visibleDrawer.map((item) => (
            <a key={item.key} href={item.href} onClick={() => setMenuOpen(false)} className={activeHref === item.href ? 'active' : ''}>
              <BrandIcon name={item.iconKey} existing={icons} className="member-nav-icon-image" />
              <span className="member-drawer-copy"><strong>{item.title}</strong><small>{item.badge === 'pending' && pendingCount > 0 ? `${pendingCount} รายการรอตรวจสอบ` : item.description}</small></span>
              {item.badge === 'pending' && pendingCount > 0 && <em>{pendingCount}</em>}
            </a>
          ))}
        </nav>
        <div className="ui-overlay-surface__actions"><button type="button" className="member-logout-button" onClick={logout}>ออกจากระบบ</button></div>
      </aside>

      {content}
      <MemberFooter settings={typedSettings} />

      <nav className="member-bottom-nav" aria-label="เมนูหลัก">
        {visibleBottomNav.map((item) => (
          <a key={item.key} href={item.href} className={activeHref === item.href ? 'active' : ''} aria-current={activeHref === item.href ? 'page' : undefined} data-navigation-key={item.key}>
            <span className="member-bottom-icon"><BrandIcon name={item.iconKey} existing={icons} /></span>
            <span>{item.shortTitle ?? item.title}</span>
            {item.badge === 'pending' && pendingCount > 0 && <em>{pendingCount}</em>}
          </a>
        ))}
      </nav>
    </>
  );
}

function PublicHomeHeader({ logoUrl, brandMark, features, pathname, isLoggedIn, walletLoading, compactWalletBalance, logout, onOpenLogin, onOpenRegister, onOpenMission }: {
  logoUrl: string;
  brandMark: string;
  features: MemberFeatureFlags;
  pathname: string;
  isLoggedIn: boolean;
  walletLoading: boolean;
  compactWalletBalance: string;
  logout: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenMission: () => void;
}) {
  return (
    <header className="member-topbar global-member-topbar public-home-topbar">
      <div className="member-topbar__inner public-home-desktop-bar">
        <a href="/" className="member-brand">
          <span className="member-brand-mark">{logoUrl ? <img src={logoUrl} alt="NOAH345" className="member-brand-logo" /> : brandMark}</span>
        </a>
        <button type="button" className="public-home-flag" aria-label="เปลี่ยนภาษา">
          <img src={V47_ASSETS.headerFlag} alt="ภาษาไทย" />
        </button>
        <a className="public-home-search" href="/browse/games" aria-label="ค้นหาเกม">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4.2-4.2" /></svg>
        </a>
        <a
          className="public-home-mission"
          href="#daily-mission"
          aria-haspopup="dialog"
          onClick={(event) => {
            event.preventDefault();
            onOpenMission();
          }}
        >
          <img src={V47_ASSETS.headerMission} alt="" aria-hidden="true" />
          <span>ภารกิจ</span>
        </a>
        <span className="public-home-header-spacer" aria-hidden="true" />
        <div className="member-actions">
          {isLoggedIn ? (
            <>
              <a className="member-guest-action member-guest-action--login" href="/games">เข้าเล่นเกม</a>
              <span className="member-header-wallet"><span className="member-header-wallet__amount">{walletLoading ? '…' : compactWalletBalance}</span></span>
              <button type="button" className="member-header-logout" onClick={logout}>ออกจากระบบ</button>
            </>
          ) : (
            <div className="member-guest-actions" data-login-enabled={features.login ? 'true' : 'false'} data-registration-enabled={features.registration ? 'true' : 'false'}>
              <button type="button" className="member-guest-action member-guest-action--login" onClick={onOpenLogin}>เข้าสู่ระบบ</button>
              <button type="button" className="member-guest-action member-guest-action--register" onClick={onOpenRegister}>สมัครสมาชิก</button>
            </div>
          )}
        </div>
      </div>
      <nav className="member-desktop-nav member-desktop-nav--guest" aria-label="เมนูหน้าแรก">
        {PUBLIC_HOME_NAV.map((item) => {
          const active = item.key === 'home' && pathname === '/';
          return (
            <a key={item.key} href={item.href} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>
              <span className="public-home-nav-icon-frame"><img src={item.icon} alt="" className="public-home-nav-icon" aria-hidden="true" /></span>
              <span>{item.title}</span>
            </a>
          );
        })}
      </nav>
    </header>
  );
}

function FeatureDisabled({ label, siteName }: { label: string; siteName: string }) {
  return (
    <main className="member-feature-disabled">
      <MemberCard tone="brand" className="member-feature-disabled__card">
        <span className="member-feature-disabled__badge">ปิดใช้งานชั่วคราว</span>
        <h1>{label}</h1>
        <p>{siteName} ปิดฟีเจอร์นี้จากการตั้งค่าระบบ กรุณากลับหน้าแรกหรือรอประกาศเปิดใช้งานอีกครั้ง</p>
        <MemberLinkButton href="/">กลับหน้าแรก</MemberLinkButton>
      </MemberCard>
    </main>
  );
}
