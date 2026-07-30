'use client';

import Link from 'next/link';
import { ReactNode, useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { MemberFeatureFlags } from './site-settings';
import { disabledMemberRoute, isPublicMemberRoute, routeRuleFor } from './member-routes';
import MemberFooter from './member-footer';
import { useSiteSettings } from './site-settings-provider';
import { useMemberSession } from './member-session-provider';
import { useMemberLocale, type MemberLocale } from './member-locale-provider';
import { usePendingCount } from './hooks/use-pending-count';
import { MemberCard, MemberLinkButton } from './components/member-ui';
import { DesktopAllianceBand } from './components/member-home/desktop-alliance-band';
import { V47_ASSETS } from './components/member-home/v47-asset-map';
import MemberAuthOverlay, { type MemberAuthMode } from './components/auth/member-auth-overlay';
import DailyMissionModal from './components/mission/daily-mission-modal';
import PublicAuthenticatedActions from './components/public-authenticated-actions-styled';
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
  login: string;
  register: string;
  navigation: string;
  loading: string;
  nav: Record<PublicNavKey, string>;
}> = {
  th: {
    changeLanguage: 'เปลี่ยนเป็นภาษาอังกฤษ',
    currentLanguage: 'ภาษาไทย',
    search: 'ค้นหาเกม',
    mission: 'ภารกิจ',
    login: 'เข้าสู่ระบบ',
    register: 'สมัครสมาชิก',
    navigation: 'เมนูหลัก',
    loading: 'กำลังโหลด...',
    nav: { home: 'หน้าหลัก', casino: 'คาสิโน', slot: 'สล็อต', fishing: 'ยิงปลา', sport: 'กีฬา', card: 'ไพ่', lottery: 'หวย', live: 'ถ่ายทอดสด' },
  },
  en: {
    changeLanguage: 'Switch to Thai',
    currentLanguage: 'English',
    search: 'Search games',
    mission: 'Missions',
    login: 'Log in',
    register: 'Register',
    navigation: 'Main navigation',
    loading: 'Loading...',
    nav: { home: 'Home', casino: 'Casino', slot: 'Slots', fishing: 'Fishing', sport: 'Sports', card: 'Cards', lottery: 'Lottery', live: 'Live' },
  },
};

const STANDALONE_PUBLIC_PREFIXES = ['/clone-preview', '/login', '/register', '/maintenance', '/session-expired'];

export default function MemberChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const [authMode, setAuthMode] = useState<MemberAuthMode | null>(null);
  const [missionOpen, setMissionOpen] = useState(false);
  const { locale, toggleLocale } = useMemberLocale();
  const copy = PUBLIC_COPY[locale];
  const { typedSettings } = useSiteSettings();
  const { ready, isLoggedIn, wallet, walletLoading, verify, logout } = useMemberSession();
  const { website, branding, features: typedFeatures } = typedSettings;
  const { pendingCount } = usePendingCount(isLoggedIn);

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

  const currentRule = routeRuleFor(pathname);
  const publicRoute = isPublicMemberRoute(pathname);
  const protectedRoute = !publicRoute;
  const standaloneRoute = STANDALONE_PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const blockedRoute = disabledMemberRoute(pathname, features);
  const configuredLogoUrl = branding.logo_url?.trim();
  const logoUrl = configuredLogoUrl && !configuredLogoUrl.startsWith('/home-asset/')
    ? configuredLogoUrl
    : V47_ASSETS.headerLogo;
  const brandMark = branding.brand_mark || website.site_name.slice(0, 1).toUpperCase() || 'N';
  const formattedWalletBalance = formatMemberWalletBalance(wallet);
  const compactWalletBalance = formattedWalletBalance.replace(/^[A-Z]{3}\s+/, '');

  const closeAuth = useCallback(() => {
    setAuthMode(null);
    const url = new URL(window.location.href);
    if (!url.searchParams.has('auth')) return;
    url.searchParams.delete('auth');
    url.searchParams.delete('next');
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const completeAuth = useCallback(async () => {
    const next = new URLSearchParams(window.location.search).get('next');
    const authenticated = await verify();
    if (!authenticated) return;

    setAuthMode(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('auth');
    url.searchParams.delete('next');
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);

    if (next && next.startsWith('/') && !next.startsWith('//')) {
      router.push(next);
    }
  }, [router, verify]);

  useEffect(() => {
    document.documentElement.style.setProperty('--color-brand', branding.primary_color);
  }, [branding.primary_color]);

  useEffect(() => {
    if (!ready) return;
    if (currentRule?.authRedirectHome && isLoggedIn) {
      router.replace('/');
      return;
    }
    if (protectedRoute && !isLoggedIn) {
      const next = encodeURIComponent(`${pathname}${window.location.search}`);
      router.replace(`/?auth=login&next=${next}`);
    }
  }, [ready, isLoggedIn, pathname, protectedRoute, currentRule?.authRedirectHome, router]);

  useEffect(() => {
    if (standaloneRoute && pathname !== '/login' && pathname !== '/register') return;
    const requestedMode = new URLSearchParams(window.location.search).get('auth');
    if (requestedMode === 'login' || requestedMode === 'register') setAuthMode(requestedMode);
  }, [pathname, standaloneRoute]);

  useEffect(() => {
    setMissionOpen(false);
  }, [pathname]);

  if (standaloneRoute) return <>{children}</>;

  let bodyContent: ReactNode = children;
  if (protectedRoute && (!ready || !isLoggedIn)) {
    bodyContent = <main className="member-loading-screen">{copy.loading}</main>;
  } else if (blockedRoute) {
    bodyContent = <FeatureDisabled label={blockedRoute.label} siteName={website.site_name} locale={locale} />;
  }

  return (
    <>
      <PublicHomeHeader
        logoUrl={logoUrl}
        brandMark={brandMark}
        features={features}
        pathname={pathname}
        locale={locale}
        ready={ready}
        isLoggedIn={isLoggedIn}
        siteName={website.site_name}
        walletLoading={walletLoading}
        compactWalletBalance={compactWalletBalance}
        pendingCount={pendingCount}
        logout={logout}
        onToggleLocale={toggleLocale}
        onOpenLogin={() => setAuthMode('login')}
        onOpenRegister={() => setAuthMode('register')}
        onOpenMission={() => setMissionOpen(true)}
      />

      <div className="public-game-shell member-persistent-shell" data-route={pathname}>
        <div className="public-game-shell__content member-persistent-shell__body">{bodyContent}</div>
        <DesktopAllianceBand />
      </div>

      <MemberFooter settings={typedSettings} />
      {authMode ? <MemberAuthOverlay mode={authMode} onClose={closeAuth} onSuccess={completeAuth} /> : null}
      <DailyMissionModal open={missionOpen} onClose={() => setMissionOpen(false)} />
    </>
  );
}

function PublicHomeHeader({
  logoUrl,
  brandMark,
  features,
  pathname,
  locale,
  ready,
  isLoggedIn,
  siteName,
  walletLoading,
  compactWalletBalance,
  pendingCount,
  logout,
  onToggleLocale,
  onOpenLogin,
  onOpenRegister,
  onOpenMission,
}: {
  logoUrl: string;
  brandMark: string;
  features: MemberFeatureFlags;
  pathname: string;
  locale: MemberLocale;
  ready: boolean;
  isLoggedIn: boolean;
  siteName: string;
  walletLoading: boolean;
  compactWalletBalance: string;
  pendingCount: number;
  logout: () => void;
  onToggleLocale: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenMission: () => void;
}) {
  const copy = PUBLIC_COPY[locale];
  const flagUrl = locale === 'th' ? V47_ASSETS.headerFlag : '/assets/asset-pc/images/flags/en.svg';

  return (
    <header className="member-topbar global-member-topbar public-home-topbar member-persistent-shell__header" data-locale={locale}>
      <div className="member-topbar__inner public-home-desktop-bar">
        <Link href="/" className="member-brand">
          <span className="member-brand-mark">{logoUrl ? <img src={logoUrl} alt="NOAH345" className="member-brand-logo" /> : brandMark}</span>
        </Link>
        <button type="button" className="public-home-flag" aria-label={copy.changeLanguage} title={copy.changeLanguage} onClick={onToggleLocale}>
          <img src={flagUrl} alt={copy.currentLanguage} />
        </button>
        <Link className="public-home-search" href="/browse/games" aria-label={copy.search}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4.2-4.2" /></svg>
        </Link>
        <button type="button" className="public-home-mission" aria-haspopup="dialog" onClick={onOpenMission}>
          <img src={V47_ASSETS.headerMission} alt="" aria-hidden="true" />
          <span>{copy.mission}</span>
        </button>
        <span className="public-home-header-spacer" aria-hidden="true" />
        <div className="member-actions" data-session-ready={ready ? 'true' : 'false'}>
          {!ready ? (
            <span className="public-member-actions-placeholder" aria-hidden="true" />
          ) : isLoggedIn ? (
            <PublicAuthenticatedActions
              locale={locale}
              siteName={siteName}
              walletLoading={walletLoading}
              compactWalletBalance={compactWalletBalance}
              pendingCount={pendingCount}
              logout={logout}
              onToggleLocale={onToggleLocale}
            />
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
          const active = item.key === 'home'
            ? pathname === '/'
            : pathname.startsWith('/browse') && pathname.includes(`category=${item.key}`);
          return (
            <Link key={item.key} href={item.href} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>
              <span className="public-home-nav-icon-frame"><img src={item.icon} alt="" className="public-home-nav-icon" aria-hidden="true" /></span>
              <span>{copy.nav[item.key]}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

function FeatureDisabled({ label, siteName, locale }: { label: string; siteName: string; locale: MemberLocale }) {
  const message = locale === 'th'
    ? 'ฟีเจอร์นี้ปิดใช้งานชั่วคราวจากการตั้งค่าระบบ'
    : 'This feature is temporarily disabled in system settings.';
  return (
    <main className="member-feature-disabled">
      <MemberCard tone="brand" className="member-feature-disabled__card">
        <span className="member-feature-disabled__badge">{locale === 'th' ? 'ปิดใช้งานชั่วคราว' : 'Temporarily unavailable'}</span>
        <h1>{label}</h1>
        <p>{siteName} {message}</p>
        <MemberLinkButton href="/">{locale === 'th' ? 'กลับหน้าแรก' : 'Back home'}</MemberLinkButton>
      </MemberCard>
    </main>
  );
}
