'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import MemberFooter from '../member-footer';
import { useMemberSession } from '../member-session-provider';
import { useSiteSettings } from '../site-settings-provider';
import { V47_ASSETS } from './member-home/v47-asset-map';
import { formatMemberWalletBalance } from '../../src/features/wallet/member-wallet';

const PUBLIC_NAV = [
  { key: 'home', title: 'หน้าหลัก', href: '/', icon: V47_ASSETS.menuHome },
  { key: 'casino', title: 'คาสิโน', href: '/games?category=casino', icon: V47_ASSETS.menuCasino },
  { key: 'slot', title: 'สล็อต', href: '/games?category=slot', icon: V47_ASSETS.menuSlot },
  { key: 'fishing', title: 'ยิงปลา', href: '/games?category=fishing', icon: V47_ASSETS.menuFishing },
  { key: 'sport', title: 'กีฬา', href: '/games?category=sport', icon: V47_ASSETS.menuSport },
  { key: 'card', title: 'ไพ่', href: '/games?category=card', icon: V47_ASSETS.menuCard },
  { key: 'lottery', title: 'หวย', href: '/games?category=lottery', icon: V47_ASSETS.menuLottery },
  { key: 'live', title: 'ถ่ายทอดสด', href: '/#live', icon: V47_ASSETS.menuLive },
] as const;

export default function PublicBrowseShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? '/';
  const { typedSettings } = useSiteSettings();
  const { isLoggedIn, wallet, walletLoading, logout } = useMemberSession();

  if (pathname.startsWith('/games/session')) return <>{children}</>;

  const { website, branding, features } = typedSettings;
  const configuredLogoUrl = branding.logo_url?.trim();
  const logoUrl = configuredLogoUrl && !configuredLogoUrl.startsWith('/home-asset/')
    ? configuredLogoUrl
    : V47_ASSETS.headerLogo;
  const balance = formatMemberWalletBalance(wallet).replace(/^[A-Z]{3}\s+/, '');

  return (
    <>
      <header className="member-topbar global-member-topbar public-home-topbar">
        <div className="member-topbar__inner public-home-desktop-bar">
          <a href="/" className="member-brand" aria-label={website.site_name}>
            <span className="member-brand-mark"><img src={logoUrl} alt="NOAH345" className="member-brand-logo" /></span>
          </a>
          <button type="button" className="public-home-flag" aria-label="เปลี่ยนภาษา"><img src={V47_ASSETS.headerFlag} alt="ภาษาไทย" /></button>
          <a className="public-home-search" href="/games" aria-label="ค้นหาเกม"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4.2-4.2" /></svg></a>
          <a className="public-home-mission" href="/promotions"><img src={V47_ASSETS.headerMission} alt="" aria-hidden="true" /><span>ภารกิจ</span></a>
          <span className="public-home-header-spacer" aria-hidden="true" />
          <div className="member-actions">
            {isLoggedIn ? (
              <>
                <a className="member-guest-action member-guest-action--login" href="/games">เข้าเล่นเกม</a>
                <span className="member-header-wallet"><span className="member-header-wallet__amount">{walletLoading ? '…' : balance}</span></span>
                <button type="button" className="member-header-logout" onClick={logout}>ออกจากระบบ</button>
              </>
            ) : (
              <div className="member-guest-actions">
                {features.login_enabled && <a className="member-guest-action member-guest-action--login" href={`/login?next=${encodeURIComponent(pathname)}`}>เข้าสู่ระบบ</a>}
                {features.registration_enabled && <a className="member-guest-action member-guest-action--register" href="/register">สมัครสมาชิก</a>}
              </div>
            )}
          </div>
        </div>
        <nav className="member-desktop-nav member-desktop-nav--guest" aria-label="เมนูสาธารณะ">
          {PUBLIC_NAV.map((item) => {
            const active = item.href === '/' ? pathname === '/' : pathname.startsWith('/games') && item.key !== 'home';
            return <a key={item.key} href={item.href} className={active ? 'active' : ''}><span className="public-home-nav-icon-frame"><img src={item.icon} alt="" className="public-home-nav-icon" aria-hidden="true" /></span><span>{item.title}</span></a>;
          })}
        </nav>
      </header>
      {children}
      <MemberFooter settings={typedSettings} />
    </>
  );
}
