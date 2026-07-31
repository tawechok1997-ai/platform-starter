'use client';

import Link from 'next/link';
import { ReactNode, useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { MemberFeatureFlags } from './site-settings';
import type { MemberNavigationItem } from './member-runtime-contract';
import { disabledMemberRoute, isPublicMemberRoute, routeRuleFor } from './member-routes';
import MemberFooter from './member-footer';
import { useSiteSettings } from './site-settings-provider';
import { useMemberSession } from './member-session-provider';
import { useMemberLocale, type MemberLocale } from './member-locale-provider';
import { useMemberRuntime } from './member-runtime-provider';
import { MemberCard, MemberLinkButton } from './components/member-ui';
import { DesktopAllianceBand } from './components/member-home/desktop-alliance-band';
import { V47_ASSETS } from './components/member-home/v47-asset-map';
import MemberAuthOverlay, { type MemberAuthMode } from './components/auth/member-auth-overlay';
import DailyMissionModal from './components/mission/daily-mission-modal';
import PublicAuthenticatedActions from './components/public-authenticated-actions-styled';
import MemberSharedPopupRuntime from './components/member-shared-popup-runtime';

type PublicNavKey = 'home' | 'casino' | 'slot' | 'fishing' | 'sport' | 'card' | 'lottery' | 'live';
type ChromeViewport = 'mobile' | 'desktop';

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
    nav: { home: 'หน้าหลัก', casino: 'คาสิโน', slot: 'สล็อต', fishing: 'ตกปลา', sport: 'กีฬา', card: 'ไพ่', lottery: 'หวย', live: 'ถ่ายทอดสด' },
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
const MOBILE_CHROME_QUERY = '(max-width: 900px)';

export default function MemberChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const searchParams = useSearchParams();
  const router = useRouter();
  const [authModeOverride, setAuthModeOverride] = useState<MemberAuthMode | null>(null);
  const [missionOpen, setMissionOpen] = useState(false);
  const [viewportMode, setViewportMode] = useState<ChromeViewport | null>(null);
  const { locale, toggleLocale } = useMemberLocale();
  const copy = PUBLIC_COPY[locale];
  const { typedSettings } = useSiteSettings();
  const { ready, isLoggedIn, walletLoading, verify, logout } = useMemberSession();
  const runtime = useMemberRuntime();
  const { website, branding } = typedSettings;
  const features: MemberFeatureFlags = runtime.features;
  const requestedAuthMode = searchParams.get('auth');
  const queryAuthMode: MemberAuthMode | null = requestedAuthMode === 'login' || requestedAuthMode === 'register'
    ? requestedAuthMode
    : null;
  const authMode = authModeOverride ?? queryAuthMode;
  const activeCategory = searchParams.get('category')?.trim().toLowerCase() ?? '';

  const isPublicRoute = isPublicMemberRoute(pathname);
  const standaloneRoute = STANDALONE_PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const currentRule = routeRuleFor(pathname);
  const blockedRoute = disabledMemberRoute(pathname, features);
  const configuredLogoUrl = branding.logo_url?.trim();
  const logoUrl = configuredLogoUrl && !configuredLogoUrl.startsWith('/home-asset/')
    ? configuredLogoUrl
    : V47_ASSETS.headerLogo;
  const brandMark = branding.brand_mark || website.site_name.slice(0, 1).toUpperCase() || 'N';
  const compactWalletBalance = formatRuntimeBalance(runtime.summary.walletAvailable, runtime.summary.walletCurrency);

  const closeAuth = useCallback(() => {
    setAuthModeOverride(null);
    const url = new URL(window.location.href);
    if (!url.searchParams.has('auth') && !url.searchParams.has('next')) return;
    url.searchParams.delete('auth');
    url.searchParams.delete('next');
    router.replace(`${url.pathname}${url.search}${url.hash}`, { scroll: false });
  }, [router]);

  const completeAuth = useCallback(async () => {
    const next = new URLSearchParams(window.location.search).get('next');
    const authenticated = await verify();
    if (!authenticated) return;

    setAuthModeOverride(null);
    if (next && next.startsWith('/') && !next.startsWith('//')) {
      router.replace(next);
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.delete('auth');
    url.searchParams.delete('next');
    router.replace(`${url.pathname}${url.search}${url.hash}`, { scroll: false });
  }, [router, verify]);

  useLayoutEffect(() => {
    const media = window.matchMedia(MOBILE_CHROME_QUERY);
    const syncViewport = () => setViewportMode(media.matches ? 'mobile' : 'desktop');

    syncViewport();
    media.addEventListener?.('change', syncViewport);
    return () => media.removeEventListener?.('change', syncViewport);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (currentRule?.authRedirectHome && isLoggedIn) {
      router.replace('/');
      return;
    }
    if (!isPublicRoute && !isLoggedIn) {
      const next = encodeURIComponent(`${pathname}${window.location.search}`);
      router.replace(`/?auth=login&next=${next}`);
    }
  }, [ready, isLoggedIn, isPublicRoute, pathname, currentRule?.authRedirectHome, router]);

  useEffect(() => {
    setMissionOpen(false);
  }, [pathname]);

  if (standaloneRoute) return <>{children}</>;

  let bodyContent: ReactNode = children;
  if (!isPublicRoute && (!ready || !isLoggedIn)) {
    bodyContent = <main className="member-loading-screen">{copy.loading}</main>;
  } else if (blockedRoute) {
    bodyContent = <FeatureDisabled label={blockedRoute.label} siteName={website.site_name} locale={locale} />;
  }

  return (
    <>
      {viewportMode === 'desktop' ? (
        <PublicHomeHeader
          logoUrl={logoUrl}
          brandMark={brandMark}
          features={features}
          navigation={runtime.navigation}
          missionIcon={runtime.icons.mission}
          pathname={pathname}
          locale={locale}
          ready={ready}
          isLoggedIn={isLoggedIn}
          siteName={website.site_name}
          walletLoading={walletLoading}
          compactWalletBalance={compactWalletBalance}
          pendingCount={runtime.summary.pendingCount}
          activeCategory={activeCategory}
          logout={logout}
          onToggleLocale={toggleLocale}
          onOpenLogin={() => setAuthModeOverride('login')}
          onOpenRegister={() => setAuthModeOverride('register')}
          onOpenMission={() => setMissionOpen(true)}
        />
      ) : null}

      <div className="public-game-shell member-persistent-shell" data-route={pathname}>
        <div className="public-game-shell__content member-persistent-shell__body">{bodyContent}</div>
        {viewportMode === 'desktop' ? <DesktopAllianceBand /> : null}
      </div>

      <MemberFooter settings={typedSettings} />
      {authMode ? <MemberAuthOverlay mode={authMode} onClose={closeAuth} onSuccess={completeAuth} /> : null}
      <DailyMissionModal open={missionOpen} onClose={() => setMissionOpen(false)} />
      <MemberSharedPopupRuntime
        locale={locale}
        onSetLocale={(nextLocale) => {
          if (nextLocale !== locale) toggleLocale();
        }}
      />
    </>
  );
}

function PublicHomeHeader({
  logoUrl,
  brandMark,
  features,
  navigation,
  missionIcon,
  pathname,
  locale,
  ready,
  isLoggedIn,
  siteName,
  walletLoading,
  compactWalletBalance,
  pendingCount,
  activeCategory,
  logout,
  onToggleLocale,
  onOpenLogin,
  onOpenRegister,
  onOpenMission,
}: {
  logoUrl: string;
  brandMark: string;
  features: MemberFeatureFlags;
  navigation: MemberNavigationItem[];
  missionIcon: string;
  pathname: string;
  locale: MemberLocale;
  ready: boolean;
  isLoggedIn: boolean;
  siteName: string;
  walletLoading: boolean;
  compactWalletBalance: string;
  pendingCount: number;
  activeCategory: string;
  logout: () => void;
  onToggleLocale: () => void;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onOpenMission: () => void;
}) {
  const copy = PUBLIC_COPY[locale];
  const flagUrl = locale === 'th' ? V47_ASSETS.headerFlag : '/assets/asset-pc/images/flags/en.svg';

  return (
    <header className="member-topbar global-member-topbar public-home-topbar" data-locale={locale}>
      <div className="member-topbar__inner public-home-desktop-bar">
        <Link href="/" className="member-brand">
          <span className="member-brand-mark">{logoUrl ? <img src={logoUrl} alt={siteName} className="member-brand-logo" /> : brandMark}</span>
        </Link>
        <button type="button" className="public-home-flag" aria-label={copy.changeLanguage} title={copy.changeLanguage} onClick={onToggleLocale} data-member-language-trigger>
          <img src={flagUrl} alt={copy.currentLanguage} />
        </button>
        <Link className="public-home-search" href="/browse/games" aria-label={copy.search}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4.2-4.2" /></svg>
        </Link>
        <a
          className="public-home-mission"
          href="#daily-mission"
          aria-haspopup="dialog"
          onClick={(event) => {
            event.preventDefault();
            onOpenMission();
          }}
        >
          <img src={missionIcon} alt="" aria-hidden="true" />
          <span>{copy.mission}</span>
        </a>
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
        {navigation.filter((item) => item.desktop).map((item) => {
          const category = item.id === 'home' ? '' : item.id;
          const active = item.id === 'home'
            ? pathname === '/' && !activeCategory
            : item.id === 'live'
              ? pathname === '/' && activeCategory === 'live'
              : pathname.startsWith('/browse') && activeCategory === category;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={active ? 'active' : ''}
              aria-current={active ? 'page' : undefined}
            >
              <span className="public-home-nav-icon-frame"><img src={item.icon} alt="" className="public-home-nav-icon" aria-hidden="true" /></span>
              <span>{item.label}</span>
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

function formatRuntimeBalance(value: string, currency: string) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return `${currency} ${amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`.replace(/^[A-Z]{3}\s+/, '');
}
