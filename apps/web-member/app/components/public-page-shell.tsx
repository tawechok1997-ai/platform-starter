'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import MemberFooter from '../member-footer';
import { useMemberLocale, type MemberLocale } from '../member-locale-provider';
import { useSiteSettings } from '../site-settings-provider';
import { DesktopAllianceBand } from './member-home/desktop-alliance-band';
import { V47_ASSETS } from './member-home/v47-asset-map';

const NAV_ITEMS = [
  { key: 'home', href: '/', icon: V47_ASSETS.menuHome },
  { key: 'games', href: '/browse/games', icon: V47_ASSETS.menuSlot },
  { key: 'guide', href: '/guide', icon: V47_ASSETS.menuCard },
  { key: 'contact', href: '/contact', icon: V47_ASSETS.menuLive },
  { key: 'legal', href: '/legal', icon: V47_ASSETS.menuLottery },
] as const;

type NavKey = (typeof NAV_ITEMS)[number]['key'];

const COPY: Record<MemberLocale, {
  changeLanguage: string;
  currentLanguage: string;
  login: string;
  register: string;
  navigation: string;
  nav: Record<NavKey, string>;
}> = {
  th: {
    changeLanguage: 'เปลี่ยนภาษา',
    currentLanguage: 'ภาษาไทย',
    login: 'เข้าสู่ระบบ',
    register: 'สมัครสมาชิก',
    navigation: 'เมนูหน้าสาธารณะ',
    nav: { home: 'หน้าหลัก', games: 'เกมทั้งหมด', guide: 'คู่มือ', contact: 'ติดต่อเรา', legal: 'นโยบาย' },
  },
  en: {
    changeLanguage: 'Change language',
    currentLanguage: 'English',
    login: 'Log in',
    register: 'Register',
    navigation: 'Public navigation',
    nav: { home: 'Home', games: 'Games', guide: 'Guide', contact: 'Contact', legal: 'Legal' },
  },
};

export function PublicPageShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const { typedSettings } = useSiteSettings();
  const { locale } = useMemberLocale();
  const copy = COPY[locale];
  const { website, branding } = typedSettings;
  const configuredLogoUrl = branding.logo_url?.trim();
  const logoUrl = configuredLogoUrl && !configuredLogoUrl.startsWith('/home-asset/')
    ? configuredLogoUrl
    : V47_ASSETS.headerLogo;
  const brandMark = branding.brand_mark || website.site_name.slice(0, 1).toUpperCase() || 'N';
  const flagUrl = locale === 'th'
    ? V47_ASSETS.headerFlag
    : '/assets/asset-pc/images/flags/en.svg';

  return (
    <>
      <header className="member-topbar global-member-topbar public-home-topbar" data-locale={locale}>
        <div className="member-topbar__inner public-home-desktop-bar">
          <a href="/" className="member-brand" aria-label={website.site_name || 'NOAH345'}>
            <span className="member-brand-mark">
              {logoUrl ? <img src={logoUrl} alt={website.site_name || 'NOAH345'} className="member-brand-logo" /> : brandMark}
            </span>
          </a>
          <button
            type="button"
            className="public-home-flag"
            data-language-trigger="true"
            aria-label={copy.changeLanguage}
            title={copy.changeLanguage}
          >
            <img src={flagUrl} alt={copy.currentLanguage} />
          </button>
          <a className="public-home-search" href="/browse/games" aria-label={copy.nav.games}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4.2-4.2" /></svg>
          </a>
          <span className="public-home-header-spacer" aria-hidden="true" />
          <div className="member-actions">
            <div className="member-guest-actions">
              <a className="member-guest-action member-guest-action--login" href="/?auth=login">{copy.login}</a>
              <a className="member-guest-action member-guest-action--register" href="/?auth=register">{copy.register}</a>
            </div>
          </div>
        </div>
        <nav className="member-desktop-nav member-desktop-nav--guest" aria-label={copy.navigation}>
          {NAV_ITEMS.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <a key={item.key} href={item.href} className={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>
                <span className="public-home-nav-icon-frame"><img src={item.icon} alt="" className="public-home-nav-icon" aria-hidden="true" /></span>
                <span>{copy.nav[item.key]}</span>
                {item.key === 'home' ? <span data-navigation-label-guard="true" aria-hidden="true" hidden /> : null}
              </a>
            );
          })}
        </nav>
      </header>

      <div className="public-game-shell public-page-shell">
        <div className="public-game-shell__content">{children}</div>
        <DesktopAllianceBand />
      </div>
      <MemberFooter settings={typedSettings} />
    </>
  );
}
