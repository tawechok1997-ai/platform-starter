'use client';

import Link from 'next/link';
import { type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMemberLocale, type MemberLocale } from '../member-locale-provider';
import { useMemberSession } from '../member-session-provider';
import { useSiteSettings } from '../site-settings-provider';
import { usePendingCount } from '../hooks/use-pending-count';
import MemberFooter from '../member-footer';
import MemberAuthOverlay, { type MemberAuthMode } from './auth/member-auth-overlay';
import DailyMissionModal from './mission/daily-mission-modal';
import PublicAuthenticatedActions from './public-authenticated-actions-styled';
import { DesktopAllianceBand } from './member-home/desktop-alliance-band';
import { V47_ASSETS } from './member-home/v47-asset-map';
import { formatMemberWalletBalance } from '../../src/features/wallet/member-wallet';

const NAVIGATION = [
  { key: 'home', href: '/', icon: V47_ASSETS.menuHome },
  { key: 'casino', href: '/browse/games?category=casino', icon: V47_ASSETS.menuCasino },
  { key: 'slot', href: '/browse/games?category=slot', icon: V47_ASSETS.menuSlot },
  { key: 'fishing', href: '/browse/games?category=fishing', icon: V47_ASSETS.menuFishing },
  { key: 'sport', href: '/browse/games?category=sport', icon: V47_ASSETS.menuSport },
  { key: 'card', href: '/browse/games?category=card', icon: V47_ASSETS.menuCard },
  { key: 'lottery', href: '/browse/games?category=lottery', icon: V47_ASSETS.menuLottery },
  { key: 'live', href: '/#live', icon: V47_ASSETS.menuLive },
] as const;

type NavigationKey = (typeof NAVIGATION)[number]['key'];

const COPY: Record<MemberLocale, {
  changeLanguage: string;
  currentLanguage: string;
  search: string;
  mission: string;
  login: string;
  register: string;
  navigation: string;
  nav: Record<NavigationKey, string>;
}> = {
  th: {
    changeLanguage: 'เปลี่ยนเป็นภาษาอังกฤษ',
    currentLanguage: 'ภาษาไทย',
    search: 'ค้นหาเกม',
    mission: 'ภารกิจ',
    login: 'เข้าสู่ระบบ',
    register: 'สมัครสมาชิก',
    navigation: 'เมนูหลัก',
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
    nav: { home: 'Home', casino: 'Casino', slot: 'Slots', fishing: 'Fishing', sport: 'Sports', card: 'Cards', lottery: 'Lottery', live: 'Live' },
  },
};

const STANDALONE_PREFIXES = ['/clone-preview', '/login', '/register', '/maintenance', '/session-expired'];

export default function PersistentMemberShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const { locale, toggleLocale } = useMemberLocale();
  const { typedSettings } = useSiteSettings();
  const { ready, isLoggedIn, wallet, walletLoading, verify, logout } = useMemberSession();
  const { pendingCount } = usePendingCount(isLoggedIn);
  const [authMode, setAuthMode] = useState<MemberAuthMode | null>(null);
  const [missionOpen, setMissionOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState('');
  const pendingNextRef = useRef<string | null>(null);
  const standalone = STANDALONE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const copy = COPY[locale];
  const { website, branding, features } = typedSettings;
  const configuredLogoUrl = branding.logo_url?.trim();
  const logoUrl = configuredLogoUrl && !configuredLogoUrl.startsWith('/home-asset/')
    ? configuredLogoUrl
    : V47_ASSETS.headerLogo;
  const brandMark = branding.brand_mark || website.site_name.slice(0, 1).toUpperCase() || 'N';
  const compactWalletBalance = formatMemberWalletBalance(wallet).replace(/^[A-Z]{3}\s+/, '');

  useLayoutEffect(() => {
    const url = new URL(window.location.href);
    const requestedMode = url.searchParams.get('auth');
    if (requestedMode !== 'login' && requestedMode !== 'register') return;

    pendingNextRef.current = url.searchParams.get('next');
    setAuthMode(requestedMode);
    url.searchParams.delete('auth');
    url.searchParams.delete('next');
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }, [pathname]);

  useEffect(() => {
    const category = new URLSearchParams(window.location.search).get('category');
    setActiveCategory(category?.trim().toLowerCase() ?? '');
    setMissionOpen(false);
  }, [pathname]);

  const closeAuth = useCallback(() => {
    setAuthMode(null);
    pendingNextRef.current = null;
  }, []);

  const completeAuth = useCallback(async () => {
    const authenticated = await verify();
    if (!authenticated) return;

    const next = pendingNextRef.current;
    pendingNextRef.current = null;
    setAuthMode(null);
    if (next && next.startsWith('/') && !next.startsWith('//')) router.push(next);
  }, [router, verify]);

  if (standalone) return <>{children}</>;

  return (
    <div className="member-persistent-root" data-pathname={pathname}>
      <header className="member-topbar global-member-topbar public-home-topbar member-persistent-header" data-locale={locale}>
        <div className="member-topbar__inner public-home-desktop-bar">
          <Link href="/" className="member-brand">
            <span className="member-brand-mark">{logoUrl ? <img src={logoUrl} alt="NOAH345" className="member-brand-logo" /> : brandMark}</span>
          </Link>
          <button type="button" className="public-home-flag" aria-label={copy.changeLanguage} title={copy.changeLanguage} onClick={toggleLocale}>
            <img src={locale === 'th' ? V47_ASSETS.headerFlag : '/assets/asset-pc/images/flags/en.svg'} alt={copy.currentLanguage} />
          </button>
          <Link className="public-home-search" href="/browse/games" aria-label={copy.search}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4.2-4.2" /></svg>
          </Link>
          <button type="button" className="public-home-mission" aria-haspopup="dialog" onClick={() => setMissionOpen(true)}>
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
                siteName={website.site_name}
                walletLoading={walletLoading}
                compactWalletBalance={compactWalletBalance}
                pendingCount={pendingCount}
                logout={logout}
                onToggleLocale={toggleLocale}
              />
            ) : (
              <div className="member-guest-actions" data-login-enabled={features.login_enabled ? 'true' : 'false'} data-registration-enabled={features.registration_enabled ? 'true' : 'false'}>
                <button type="button" className="member-guest-action member-guest-action--login" onClick={() => setAuthMode('login')}>{copy.login}</button>
                <button type="button" className="member-guest-action member-guest-action--register" onClick={() => setAuthMode('register')}>{copy.register}</button>
              </div>
            )}
          </div>
        </div>

        <nav className="member-desktop-nav member-desktop-nav--guest" aria-label={copy.navigation}>
          {NAVIGATION.map((item) => {
            const active = item.key === 'home'
              ? pathname === '/' && !activeCategory
              : pathname.startsWith('/browse') && activeCategory === item.key;
            return (
              <Link key={item.key} href={item.href} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>
                <span className="public-home-nav-icon-frame"><img src={item.icon} alt="" className="public-home-nav-icon" aria-hidden="true" /></span>
                <span>{copy.nav[item.key]}</span>
              </Link>
            );
          })}
        </nav>
      </header>

      <div className="member-persistent-body">{children}</div>
      <DesktopAllianceBand />
      <MemberFooter settings={typedSettings} />
      {authMode ? <MemberAuthOverlay mode={authMode} onClose={closeAuth} onSuccess={completeAuth} /> : null}
      <DailyMissionModal open={missionOpen} onClose={() => setMissionOpen(false)} />
    </div>
  );
}
