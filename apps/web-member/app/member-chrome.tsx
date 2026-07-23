'use client';

import { ReactNode, useEffect, useMemo, useState } from 'react';
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
import { formatMemberWalletBalance } from '../src/features/wallet/member-wallet';

export default function MemberChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { typedSettings } = useSiteSettings();
  const { ready, isLoggedIn, wallet, walletLoading, logout } = useMemberSession();
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

  const isPublicRoute = isPublicMemberRoute(pathname);
  const currentRule = routeRuleFor(pathname);
  const blockedRoute = disabledMemberRoute(pathname, features);
  const activeHref = useMemo(() => activeNavigationHref(pathname), [pathname]);
  const visibleBottomNav = navigationFor('bottom', features);
  const visibleDrawer = navigationFor('drawer', features);
  const gameCategoryNavigation = createGameCategoryNavigationConfig(typedSettings);
  const { pendingCount } = usePendingCount(isLoggedIn && !isPublicRoute);

  const siteName = website.site_name;
  const siteDescription = website.site_description;
  const logoUrl = branding.logo_url || '/images/member-lobby/noah345-reference/0010_ba66cd74-2429-42dd-858e-aaae9fb3b688_48d3df600e.png';
  const brandMark = branding.brand_mark || siteName.slice(0, 1).toUpperCase() || 'P';
  const formattedWalletBalance = formatMemberWalletBalance(wallet);
  const compactWalletBalance = formattedWalletBalance.replace(/^[A-Z]{3}\s+/, '');

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
  }, [pathname]);

  if (isPublicRoute) return <>{children}</>;
  if (!ready || !isLoggedIn) return <main className="member-loading-screen">กำลังโหลด...</main>;

  const content = blockedRoute ? <FeatureDisabled label={blockedRoute.label} siteName={siteName} /> : children;

  return (
    <>
      <header className="member-topbar global-member-topbar">
        <div className="member-topbar__inner">
          <div className="member-header-tools">
            <button type="button" className="member-header-tool" onClick={() => setMenuOpen(true)} aria-label="เปิดเมนู">
              <MenuIcon />
            </button>
            <a className="member-header-tool" href="/games" aria-label="ค้นหาเกม">⌕</a>
          </div>
          <a href="/" className="member-brand">
            <span className="member-brand-mark">
              {logoUrl ? <img src={logoUrl} alt="" className="member-brand-logo" /> : brandMark}
            </span>
            <span className="member-brand-copy">
              <strong>{siteName}</strong>
              <small>{siteDescription}</small>
            </span>
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
          </div>
        </div>
      </header>

      {theme.show_game_categories && (
        <MemberCategoryRail
          pathname={pathname}
          features={features}
          config={gameCategoryNavigation}
          baseIcons={icons}
        />
      )}

      {menuOpen && <button type="button" className="member-menu-backdrop ui-overlay" onClick={() => setMenuOpen(false)} aria-label="ปิดเมนู" />}

      <aside className={menuOpen ? 'member-drawer ui-drawer open' : 'member-drawer ui-drawer'} role="dialog" aria-modal="true" aria-label="เมนูสมาชิก" aria-hidden={!menuOpen} tabIndex={-1}>
        <div className="member-drawer-head ui-overlay-surface__header">
          <div><strong>{siteName}</strong><p>{siteDescription}</p></div>
          <div className="member-drawer-head__actions">
            {pathname !== '/' && (
              <button type="button" className="member-drawer-back-button" onClick={() => { setMenuOpen(false); if (window.history.length > 1) router.back(); else router.push('/'); }}>
                ← ย้อนกลับ
              </button>
            )}
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
