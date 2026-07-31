'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useMemberLocale } from '../member-locale-provider';
import { useMemberRuntime } from '../member-runtime-provider';
import { useMemberSession } from '../member-session-provider';
import { useSiteSettings } from '../site-settings-provider';
import { MemberDrawer } from './member-modal-system';
import { openMemberSharedPopup } from './member-shared-popup-runtime';
import { V47_ASSETS } from './member-home/v47-asset-map';

const STANDALONE_PUBLIC_PREFIXES = ['/clone-preview', '/login', '/register', '/maintenance', '/session-expired'];

export default function PublicMobileSourceHeader() {
  const pathname = usePathname() ?? '/';
  const { locale } = useMemberLocale();
  const { typedSettings } = useSiteSettings();
  const runtime = useMemberRuntime();
  const { logout } = useMemberSession();
  const [menuOpen, setMenuOpen] = useState(false);

  if (STANDALONE_PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null;

  const configuredLogoUrl = typedSettings.branding.logo_mobile_url?.trim() || typedSettings.branding.logo_url?.trim();
  const logoUrl = configuredLogoUrl && !configuredLogoUrl.startsWith('/home-asset/')
    ? configuredLogoUrl
    : V47_ASSETS.headerLogo;
  const flagUrl = locale === 'th'
    ? V47_ASSETS.headerFlag
    : '/assets/asset-pc/images/flags/en.svg';
  const languageLabel = locale === 'th' ? 'เปลี่ยนภาษา' : 'Change language';
  const menuLabel = locale === 'th' ? 'เปิดเมนู' : 'Open menu';
  const closeLabel = locale === 'th' ? 'ปิดเมนู' : 'Close menu';
  const mobileNavigation = runtime.navigation.filter((item) => item.mobile);

  return (
    <>
      <header className="public-mobile-source-header" data-locale={locale}>
        <div className="public-mobile-source-header__inner">
          <button
            type="button"
            className="public-mobile-source-header__menu"
            aria-label={menuOpen ? closeLabel : menuLabel}
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
            aria-label={languageLabel}
            title={languageLabel}
            onClick={() => openMemberSharedPopup('language')}
          >
            <img src={flagUrl} alt="" aria-hidden="true" />
          </button>
        </div>
      </header>

      <MemberDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={locale === 'th' ? 'เมนูสมาชิก' : 'Member menu'}
        icon={runtime.icons.home}
        panelClassName="member-mobile-runtime-drawer"
        contentClassName="member-mobile-runtime-drawer__content"
      >
        <section className="member-mobile-runtime-summary" aria-label={locale === 'th' ? 'สรุปบัญชีสมาชิก' : 'Member summary'}>
          <strong>{runtime.summary.displayName}</strong>
          <span>
            {runtime.summary.isLoggedIn
              ? `${runtime.summary.walletCurrency} ${formatAmount(runtime.summary.walletAvailable)}`
              : (locale === 'th' ? 'ยังไม่ได้เข้าสู่ระบบ' : 'Not signed in')}
          </span>
          {runtime.summary.pendingCount > 0 ? (
            <small>{locale === 'th' ? `มีรายการรอดำเนินการ ${runtime.summary.pendingCount}` : `${runtime.summary.pendingCount} pending items`}</small>
          ) : null}
        </section>

        <nav className="member-mobile-runtime-navigation" aria-label={locale === 'th' ? 'เมนูหลัก' : 'Main navigation'}>
          {mobileNavigation.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className={active ? 'is-active' : ''}
                aria-current={active ? 'page' : undefined}
                onClick={() => setMenuOpen(false)}
              >
                <span><img src={item.icon} alt="" aria-hidden="true" /></span>
                <strong>{item.label}</strong>
                {item.badge ? <small>{item.badge}</small> : null}
              </Link>
            );
          })}
        </nav>

        <div className="member-mobile-runtime-actions">
          {runtime.features.deposit && runtime.summary.isLoggedIn ? <Link href="/deposit" onClick={() => setMenuOpen(false)}>{locale === 'th' ? 'ฝากเงิน' : 'Deposit'}</Link> : null}
          {runtime.features.withdraw && runtime.summary.isLoggedIn ? <Link href="/withdraw" onClick={() => setMenuOpen(false)}>{locale === 'th' ? 'ถอนเงิน' : 'Withdraw'}</Link> : null}
          {runtime.features.support ? <Link href="/support" onClick={() => setMenuOpen(false)}>{locale === 'th' ? 'ช่วยเหลือ' : 'Support'}</Link> : null}
          {runtime.summary.isLoggedIn ? (
            <button type="button" onClick={logout}>{locale === 'th' ? 'ออกจากระบบ' : 'Log out'}</button>
          ) : (
            <Link href="/?auth=login" onClick={() => setMenuOpen(false)}>{locale === 'th' ? 'เข้าสู่ระบบ' : 'Log in'}</Link>
          )}
        </div>
      </MemberDrawer>
    </>
  );
}

function formatAmount(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount)
    ? amount.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : '0.00';
}

function isActive(pathname: string, href: string) {
  try {
    const url = new URL(href, 'https://member.local');
    return url.pathname === '/' ? pathname === '/' : pathname.startsWith(url.pathname);
  } catch {
    return false;
  }
}
