'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
import { usePathname } from 'next/navigation';
import type { MemberFeatureFlags } from './site-settings';
import { defaultIconSettings, isIconUrl } from './site-settings';
import { activeNavigationHref, navigationFor } from './member-navigation';
import { disabledMemberRoute, isPublicMemberRoute, routeRuleFor } from './member-routes';
import MemberFooter from './member-footer';
import { useSiteSettings } from './site-settings-provider';
import { useMemberSession } from './member-session-provider';
import { usePendingCount } from './hooks/use-pending-count';
import { MemberCard, MemberLinkButton } from './components/member-ui';
import { CloseIcon, MemberIcon, MenuIcon } from './components/member-icon';

export default function MemberChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { typedSettings } = useSiteSettings();
  const { ready, isLoggedIn, logout } = useMemberSession();
  const { website, branding, icons, features: typedFeatures } = typedSettings;

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

  const isPublicRoute = isPublicMemberRoute(pathname);
  const currentRule = routeRuleFor(pathname);
  const blockedRoute = disabledMemberRoute(pathname, features);
  const activeHref = useMemo(() => activeNavigationHref(pathname), [pathname]);
  const visibleBottomNav = navigationFor('bottom', features);
  const visibleDrawer = navigationFor('drawer', features);
  const { pendingCount } = usePendingCount(isLoggedIn && !isPublicRoute);

  const siteName = website.site_name;
  const siteDescription = website.site_description;
  const logoUrl = branding.logo_url ?? '';
  const brandMark = branding.brand_mark || siteName.slice(0, 1).toUpperCase() || 'P';

  useEffect(() => {
    document.documentElement.style.setProperty('--color-brand', branding.primary_color);
  }, [branding.primary_color]);

  useEffect(() => {
    if (!ready) return;
    if (currentRule?.authRedirectHome && isLoggedIn) {
      window.location.replace('/');
      return;
    }
    if (!isPublicRoute && !isLoggedIn) {
      const next = encodeURIComponent(`${pathname}${window.location.search}`);
      window.location.replace(`/login?next=${next}`);
    }
  }, [ready, isLoggedIn, isPublicRoute, pathname, currentRule?.authRedirectHome]);

  useEffect(() => {
    if (!menuOpen) return;
    const bodyOverflow = document.body.style.overflow;
    const htmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = htmlOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [menuOpen]);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  if (isPublicRoute) return <>{children}</>;
  if (!ready || !isLoggedIn) return <main className="member-loading-screen">กำลังโหลด...</main>;

  const content = blockedRoute ? <FeatureDisabled label={blockedRoute.label} siteName={siteName} /> : children;

  return <>
    <header className="member-topbar global-member-topbar"><div className="member-topbar__inner">
      <a href="/" className="member-brand"><span className="member-brand-mark">{logoUrl ? <img src={logoUrl} alt="" className="member-brand-logo" /> : brandMark}</span><span className="member-brand-copy"><strong>{siteName}</strong><small>{siteDescription}</small></span></a>
      <nav className="member-desktop-nav" aria-label="เมนูหลักเดสก์ท็อป">{visibleBottomNav.map((item) => <a key={item.key} href={item.href} className={activeHref === item.href ? 'active' : ''} aria-current={activeHref === item.href ? 'page' : undefined}><IconValue iconKey={item.iconKey} value={icons[item.iconKey] ?? defaultIconSettings[item.iconKey]} /><span>{item.shortTitle ?? item.title}</span>{item.badge === 'pending' && pendingCount > 0 && <em>{pendingCount}</em>}</a>)}</nav>
      <div className="member-actions"><a href="/notifications" className="member-header-icon" aria-label="แจ้งเตือน"><MemberIcon name="notification" />{pendingCount > 0 && <em>{pendingCount}</em>}</a><button type="button" className="member-menu-button" onClick={() => setMenuOpen(true)} aria-label="เปิดเมนูเพิ่มเติม" aria-expanded={menuOpen}><MenuIcon /></button></div>
    </div></header>

    {menuOpen && <button type="button" className="member-menu-backdrop" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู" />}

    <aside className={menuOpen ? 'member-drawer open' : 'member-drawer'} aria-hidden={!menuOpen}>
      <div className="member-drawer-head"><div><strong>{siteName}</strong><p>{siteDescription}</p></div><button type="button" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู"><CloseIcon /></button></div>
      <nav className="member-drawer-nav">
        {visibleDrawer.map((item) => <a key={item.key} href={item.href} onClick={() => setMenuOpen(false)} className={activeHref === item.href ? 'active' : ''}>
          <IconValue iconKey={item.iconKey} value={icons[item.iconKey] ?? defaultIconSettings[item.iconKey]} />
          <span className="member-drawer-copy"><strong>{item.title}</strong><small>{item.badge === 'pending' && pendingCount > 0 ? `${pendingCount} รายการรอตรวจสอบ` : item.description}</small></span>
          {item.badge === 'pending' && pendingCount > 0 && <em>{pendingCount}</em>}
        </a>)}
      </nav>
      <button type="button" className="member-logout-button" onClick={logout}>ออกจากระบบ</button>
    </aside>

    {content}
    <MemberFooter settings={typedSettings} />

    <nav className="member-bottom-nav" aria-label="เมนูหลัก">
      {visibleBottomNav.map((item) => <a key={item.key} href={item.href} className={activeHref === item.href ? 'active' : ''} aria-current={activeHref === item.href ? 'page' : undefined}>
        <span className="member-bottom-icon"><IconValue iconKey={item.iconKey} value={icons[item.iconKey] ?? defaultIconSettings[item.iconKey]} /></span>
        <span>{item.shortTitle ?? item.title}</span>
        {item.badge === 'pending' && pendingCount > 0 && <em>{pendingCount}</em>}
      </a>)}
    </nav>
  </>;
}

function FeatureDisabled({ label, siteName }: { label: string; siteName: string }) {
  return <main className="member-feature-disabled"><MemberCard tone="brand" className="member-feature-disabled__card"><span className="member-feature-disabled__badge">ปิดใช้งานชั่วคราว</span><h1>{label}</h1><p>{siteName} ปิดฟีเจอร์นี้จากการตั้งค่าระบบ กรุณากลับหน้าแรกหรือรอประกาศเปิดใช้งานอีกครั้ง</p><MemberLinkButton href="/">กลับหน้าแรก</MemberLinkButton></MemberCard></main>;
}

function IconValue({ iconKey, value }: { iconKey: keyof typeof defaultIconSettings; value: string }) {
  if (isIconUrl(value)) return <img src={value} alt="" className="member-nav-icon-image" />;
  if (value !== defaultIconSettings[iconKey]) return <span className="member-custom-icon" aria-hidden="true">{value}</span>;
  return <MemberIcon name={iconKey} />;
}
