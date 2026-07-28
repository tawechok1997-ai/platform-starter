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
import { useMemberLocale, type MemberLocale } from './member-locale-provider';
import { usePendingCount } from './hooks/use-pending-count';
import { BrandIcon } from './components/brand-icon';
import { MemberCard, MemberLinkButton } from './components/member-ui';
import { CloseIcon, MenuIcon } from './components/member-icon';
import { MemberCategoryRail } from './components/member-category-rail';
import { DesktopAllianceBand } from './components/member-home/desktop-alliance-band';
import { V47_ASSETS } from './components/member-home/v47-asset-map';
import MemberAuthOverlay, { type MemberAuthMode } from './components/auth/member-auth-overlay';
import MemberLanguageOverlay from './components/member-language-overlay';
import DailyMissionModal from './components/mission/daily-mission-modal';
import { formatMemberWalletBalance } from '../src/features/wallet/member-wallet';

const PUBLIC_HOME_NAV = [
  { key: 'home', href: '/', icon: V47_ASSETS.menuHome },
  { key: 'casino', href: '/browse/games?category=casino', icon: V47_ASSETS.menuCasino },
  { key: 'slot', href: '/browse/games?category=slot', icon: V47_ASSETS.menuSlot },
  { key: 'fishing', href: '/browse/games?category=fishing', icon: V47_ASSETS.menuFishing },
  { key: 'sport', href: '/browse/games?category=sport', icon: V47_ASSETS.menuSport },
  { key: 'card', href: '/browse/games?category=card', icon: V47_ASSETS.menuCard },
  { key: 'lottery', href: '/browse/games?category=lottery', icon: V47_ASSETS.menuLottery },
  { key: 'live', href: '/#live', icon: V47_ASSETS.menuLive },
] as const;

type PublicNavKey = (typeof PUBLIC_HOME_NAV)[number]['key'];

const PUBLIC_COPY: Record<MemberLocale, {
  changeLanguage: string;
  currentLanguage: string;
  search: string;
  mission: string;
  play: string;
  logout: string;
  login: string;
  register: string;
  navigation: string;
  nav: Record<PublicNavKey, string>;
}> = {
  th: {
    changeLanguage: 'เปลี่ยนเป็นภาษาอังกฤษ',
    currentLanguage: 'ภาษาไทย',
    search: 'ค้นหาเกม',
    mission: 'ภารกิจ',
    play: 'เข้าเล่นเกม',
    logout: 'ออกจากระบบ',
    login: 'เข้าสู่ระบบ',
    register: 'สมัครสมาชิก',
    navigation: 'เมนูหน้าแรก',
    nav: { home: 'หน้าหลัก', casino: 'คาสิโน', slot: 'สล็อต', fishing: 'ยิงปลา', sport: 'กีฬา', card: 'ไพ่', lottery: 'หวย', live: 'ถ่ายทอดสด' },
  },
  en: {
    changeLanguage: 'Switch to Thai',
    currentLanguage: 'English',
    search: 'Search games',
    mission: 'Missions',
    play: 'Play games',
    logout: 'Log out',
    login: 'Log in',
    register: 'Register',
    navigation: 'Main navigation',
    nav: { home: 'Home', casino: 'Casino', slot: 'Slots', fishing: 'Fishing', sport: 'Sports', card: 'Cards', lottery: 'Lottery', live: 'Live' },
  },
};

const MEMBER_COPY = {
  th: {
    loading: 'กำลังโหลด...', openMenu: 'เปิดเมนู', search: 'ค้นหาเกม', desktopNav: 'เมนูหลักเดสก์ท็อป', notifications: 'แจ้งเตือน', loadingWallet: 'กำลังโหลดยอดเงิน', availableBalance: 'ยอดใช้ได้', logout: 'ออกจากระบบ', closeMenu: 'ปิดเมนู', memberMenu: 'เมนูสมาชิก', back: 'ย้อนกลับ', pending: 'รายการรอตรวจสอบ', mainNav: 'เมนูหลัก', disabled: 'ปิดใช้งานชั่วคราว', backHome: 'กลับหน้าแรก', disabledMessage: 'ปิดฟีเจอร์นี้จากการตั้งค่าระบบ กรุณากลับหน้าแรกหรือรอประกาศเปิดใช้งานอีกครั้ง',
  },
  en: {
    loading: 'Loading...', openMenu: 'Open menu', search: 'Search games', desktopNav: 'Desktop navigation', notifications: 'Notifications', loadingWallet: 'Loading balance', availableBalance: 'Available balance', logout: 'Log out', closeMenu: 'Close menu', memberMenu: 'Member menu', back: 'Back', pending: 'items pending review', mainNav: 'Main navigation', disabled: 'Temporarily unavailable', backHome: 'Back to home', disabledMessage: 'This feature is disabled in system settings. Return home or wait for it to be enabled again.',
  },
} as const;

export default function MemberChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [authMode, setAuthMode] = useState<MemberAuthMode | null>(null);
  const [missionOpen, setMissionOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const { locale } = useMemberLocale();
  const commonCopy = MEMBER_COPY[locale];
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
  const isBrandedPublicRoute = pathname === '/contact' || pathname.startsWith('/legal');
  const isPublicGameShellRoute = isHomeRoute || isBrowseRoute || isBrandedPublicRoute;
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
          locale={locale}
          isLoggedIn={isLoggedIn}
          walletLoading={walletLoading}
          compactWalletBalance={compactWalletBalance}
          logout={logout}
          onOpenLanguage={() => setLanguageOpen(true)}
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
        <MemberLanguageOverlay open={languageOpen} onOpenChange={setLanguageOpen} />
      </>
    );
  }

  if (isPublicRoute) return <>{children}</>;
  if (!ready || !isLoggedIn) return <main className="member-loading-screen">{commonCopy.loading}</main>;

  const content = blockedRoute ? <FeatureDisabled label={blockedRoute.label} siteName={siteName} locale={locale} /> : children;

  return (
    <>
      <header className="member-topbar global-member-topbar">
        <div className="member-topbar__inner">
          <div className="member-header-tools">
            <button type="button" className="member-header-tool" onClick={() => setMenuOpen(true)} aria-label={commonCopy.openMenu}><MenuIcon /></button>
            <a className="member-header-tool" href="/games" aria-label={commonCopy.search}>⌕</a>
          </div>
          <a href="/" className="member-brand">
            <span className="member-brand-mark">{logoUrl ? <img src={logoUrl} alt="" className="member-brand-logo" /> : brandMark}</span>
            <span className="member-brand-copy"><strong>{siteName}</strong><small>{siteDescription}</small></span>
          </a>
          <nav className="member-desktop-nav" aria-label={commonCopy.desktopNav}>
            {visibleBottomNav.map((item) => (
              <a key={item.key} href={item.href} className={activeHref === item.href ? 'active' : ''} aria-current={activeHref === item.href ? 'page' : undefined}>
                <BrandIcon name={item.iconKey} existing={icons} className="member-nav-icon-image" />
                <span>{item.shortTitle ?? item.title}</span>
                {item.badge === 'pending' && pendingCount > 0 && <em>{pendingCount}</em>}
              </a>
            ))}
          </nav>
          <div className="member-actions">
            <a href="/notifications" className="member-header-icon" aria-label={commonCopy.notifications}>
              <BrandIcon name="notification" existing={icons} className="member-nav-icon-image" />
              {pendingCount > 0 && <em>{pendingCount}</em>}
            </a>
            <span className="member-header-wallet" aria-label={walletLoading ? commonCopy.loadingWallet : `${commonCopy.availableBalance} ${formattedWalletBalance}`} aria-live="polite">
              <img src="/images/member-lobby/noah345-reference/0012_wallet_a4fadd0a57.webp" alt="" aria-hidden="true" />
              <span className="member-header-wallet__amount">{walletLoading ? '…' : compactWalletBalance}</span>
            </span>
            <button type="button" className="member-header-logout" onClick={logout} aria-label={commonCopy.logout}><span aria-hidden="true">↪</span><span>{commonCopy.logout}</span></button>
          </div>
        </div>
      </header>

      {theme.show_game_categories && <MemberCategoryRail pathname={pathname} features={features} config={gameCategoryNavigation} baseIcons={icons} />}
      {menuOpen && <button type="button" className="member-menu-backdrop ui-overlay" onClick={() => setMenuOpen(false)} aria-label={commonCopy.closeMenu} />}

      <aside className={menuOpen ? 'member-drawer ui-drawer open' : 'member-drawer ui-drawer'} role="dialog" aria-modal="true" aria-label={commonCopy.memberMenu} aria-hidden={!menuOpen} tabIndex={-1}>
        <div className="member-drawer-head ui-overlay-surface__header">
          <div><strong>{siteName}</strong><p>{siteDescription}</p></div>
          <div className="member-drawer-head__actions">
            {pathname !== '/' && <button type="button" className="member-drawer-back-button" onClick={() => { setMenuOpen(false); if (window.history.length > 1) router.back(); else router.push('/'); }}>← {commonCopy.back}</button>}
            <button type="button" onClick={() => setMenuOpen(false)} aria-label={commonCopy.closeMenu}><CloseIcon /></button>
          </div>
        </div>
        <nav className="member-drawer-nav ui-overlay-surface__body">
          {visibleDrawer.map((item) => (
            <a key={item.key} href={item.href} onClick={() => setMenuOpen(false)} className={activeHref === item.href ? 'active' : ''}>
              <BrandIcon name={item.iconKey} existing={icons} className="member-nav-icon-image" />
              <span className="member-drawer-copy"><strong>{item.title}</strong><small>{item.badge === 'pending' && pendingCount > 0 ? `${pendingCount} ${commonCopy.pending}` : item.description}</small></span>
              {item.badge === 'pending' && pendingCount > 0 && <em>{pendingCount}</em>}
            </a>
          ))}
        </nav>
        <div className="ui-overlay-surface__actions"><button type="button" className="member-logout-button" onClick={logout}>{commonCopy.logout}</button></div>
      </aside>

      {content}
      <MemberFooter settings={typedSettings} />

      <nav className="member-bottom-nav" aria-label={commonCopy.mainNav}>
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

function PublicHomeHeader({ logoUrl, brandMark, features, pathname, locale, isLoggedIn, walletLoading, compactWalletBalance, logout, onOpenLanguage, onOpenLogin, onOpenRegister, onOpenMission }: {
  logoUrl: string;
  brandMark: string;
  features: MemberFeatureFlags;
  pathname: string;
  locale: MemberLocale;
  isLoggedIn: boolean;
  walletLoading: boolean;
  compactWalletBalance: string;
  logout: () => void;
  onOpenLanguage: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenMission: () => void;
}) {
  const copy = PUBLIC_COPY[locale];
  const flagUrl = locale === 'th' ? V47_ASSETS.headerFlag : '/assets/asset-pc/images/flags/en.svg';

  return (
    <header className="member-topbar global-member-topbar public-home-topbar" data-locale={locale}>
      <div className="member-topbar__inner public-home-desktop-bar">
        <a href="/" className="member-brand">
          <span className="member-brand-mark">{logoUrl ? <img src={logoUrl} alt="NOAH345" className="member-brand-logo" /> : brandMark}</span>
        </a>
        <button type="button" className="public-home-flag" aria-label={copy.changeLanguage} title={copy.changeLanguage} onClick={onOpenLanguage}>
          <img src={flagUrl} alt={copy.currentLanguage} />
        </button>
        <a className="public-home-search" href="/browse/games" aria-label={copy.search}>
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
          <span>{copy.mission}</span>
        </a>
        <span className="public-home-header-spacer" aria-hidden="true" />
        <div className="member-actions">
          {isLoggedIn ? (
            <>
              <a className="member-guest-action member-guest-action--login" href="/games">{copy.play}</a>
              <span className="member-header-wallet"><span className="member-header-wallet__amount">{walletLoading ? '…' : compactWalletBalance}</span></span>
              <button type="button" className="member-header-logout" onClick={logout}>{copy.logout}</button>
            </>
          ) : (
            <div className="member-guest-actions" data-login-enabled={features.login ? 'true' : 'false'} data-registration-enabled={features.registration ? 'true' : 'false'}>
              <button type="button" className="member-guest-action member-guest-action--login" onClick={onOpenLogin}>{copy.login}</button>
              <button type="button" className="member-guest-action member-guest-action--register" onClick={onOpenRegister}>{copy.register}</button>
            </div>
          )}
        </div>
      </div>
      <nav className="member-desktop-nav member-desktop-nav--guest" aria-label={copy.navigation}>
        {PUBLIC_HOME_NAV.map((item) => {
          const active = item.key === 'home' && pathname === '/';
          return (
            <a key={item.key} href={item.href} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>
              <span className="public-home-nav-icon-frame"><img src={item.icon} alt="" className="public-home-nav-icon" aria-hidden="true" /></span>
              <span>{copy.nav[item.key]}</span>
            </a>
          );
        })}
      </nav>
    </header>
  );
}

function FeatureDisabled({ label, siteName, locale }: { label: string; siteName: string; locale: MemberLocale }) {
  const copy = MEMBER_COPY[locale];
  return (
    <main className="member-feature-disabled">
      <MemberCard tone="brand" className="member-feature-disabled__card">
        <span className="member-feature-disabled__badge">{copy.disabled}</span>
        <h1>{label}</h1>
        <p>{siteName} {copy.disabledMessage}</p>
        <MemberLinkButton href="/">{copy.backHome}</MemberLinkButton>
      </MemberCard>
    </main>
  );
}
