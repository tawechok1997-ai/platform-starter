'use client';

import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
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

export default function MemberChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isDesktopLayout, setIsDesktopLayout] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const wasMenuOpenRef = useRef(false);
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
    const media = window.matchMedia('(min-width: 1024px)');
    const syncLayout = () => setIsDesktopLayout(media.matches);
    syncLayout();
    media.addEventListener('change', syncLayout);
    return () => media.removeEventListener('change', syncLayout);
  }, []);

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
    return () => {
      document.body.style.overflow = bodyOverflow;
      document.documentElement.style.overflow = htmlOverflow;
    };
  }, [menuOpen]);

  useEffect(() => {
    const drawer = drawerRef.current;
    if (!drawer) return;
    if (isDesktopLayout || menuOpen) drawer.removeAttribute('inert');
    else drawer.setAttribute('inert', '');
  }, [isDesktopLayout, menuOpen]);

  useEffect(() => {
    if (!menuOpen || isDesktopLayout) return;
    drawerCloseRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isDesktopLayout, menuOpen]);

  useEffect(() => {
    if (!menuOpen && wasMenuOpenRef.current && !isDesktopLayout) menuButtonRef.current?.focus();
    wasMenuOpenRef.current = menuOpen;
  }, [isDesktopLayout, menuOpen]);

  if (isPublicRoute) return <>{children}</>;
  if (!ready || !isLoggedIn) return <main className="member-loading-screen"><div className="member-loading-card" role="status" aria-live="polite"><span className="member-loading-spinner" aria-hidden="true" />กำลังโหลด...</div></main>;

  const content = blockedRoute ? <FeatureDisabled label={blockedRoute.label} siteName={siteName} /> : children;

  return <>
    <header className="member-topbar global-member-topbar">
      <Link href="/" className="member-brand">
        <span className="member-brand-mark">{logoUrl ? <img src={logoUrl} alt="" className="member-brand-logo" /> : brandMark}</span>
        <span className="member-brand-copy"><strong>{siteName}</strong><small>{siteDescription}</small></span>
      </Link>
      <div className="member-actions"><button ref={menuButtonRef} type="button" className="member-menu-button" onClick={() => setMenuOpen(true)} aria-label="เปิดเมนู" aria-expanded={menuOpen} aria-controls="member-navigation-drawer">☰</button></div>
    </header>

    {menuOpen && <button type="button" className="member-menu-backdrop" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู" />}

    <aside ref={drawerRef} id="member-navigation-drawer" className={menuOpen ? 'member-drawer open' : 'member-drawer'} aria-hidden={!isDesktopLayout && !menuOpen ? true : undefined} aria-label="เมนูสมาชิก" role={!isDesktopLayout ? 'dialog' : undefined} aria-modal={!isDesktopLayout && menuOpen ? true : undefined}>
      <div className="member-drawer-head"><div><strong>{siteName}</strong><p>{siteDescription}</p></div><button ref={drawerCloseRef} type="button" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู">×</button></div>
      <nav className="member-drawer-nav">
        {visibleDrawer.map((item) => <Link key={item.key} href={item.href} onClick={() => setMenuOpen(false)} className={activeHref === item.href ? 'active' : ''} aria-current={activeHref === item.href ? 'page' : undefined}>
          <IconValue value={icons[item.iconKey] ?? defaultIconSettings[item.iconKey]} />
          <span className="member-drawer-copy"><strong>{item.title}</strong><small>{item.badge === 'pending' && pendingCount > 0 ? `${pendingCount} รายการรอตรวจสอบ` : item.description}</small></span>
          {item.badge === 'pending' && pendingCount > 0 && <em>{pendingCount}</em>}
        </Link>)}
      </nav>
      <button type="button" className="member-logout-button" onClick={logout}>ออกจากระบบ</button>
    </aside>

    {content}
    <MemberFooter settings={typedSettings} />

    <nav className="member-bottom-nav" aria-label="เมนูหลัก">
      {visibleBottomNav.map((item) => <Link key={item.key} href={item.href} className={activeHref === item.href ? 'active' : ''} aria-current={activeHref === item.href ? 'page' : undefined}>
        <span className="member-bottom-icon"><IconValue value={icons[item.iconKey] ?? defaultIconSettings[item.iconKey]} /></span>
        <span>{item.shortTitle ?? item.title}</span>
        {item.badge === 'pending' && pendingCount > 0 && <em>{pendingCount}</em>}
      </Link>)}
    </nav>
  </>;
}

function FeatureDisabled({ label, siteName }: { label: string; siteName: string }) {
  return <main className="member-feature-disabled"><MemberCard tone="brand" className="member-feature-disabled__card"><span className="member-feature-disabled__badge">ปิดใช้งานชั่วคราว</span><h1>{label}</h1><p>{siteName} ปิดฟีเจอร์นี้จากการตั้งค่าระบบ กรุณากลับหน้าแรกหรือรอประกาศเปิดใช้งานอีกครั้ง</p><MemberLinkButton href="/">กลับหน้าแรก</MemberLinkButton></MemberCard></main>;
}

function IconValue({ value }: { value: string }) {
  return isIconUrl(value) ? <img src={value} alt="" className="member-nav-icon-image" /> : <>{value}</>;
}
