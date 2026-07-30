'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemberLocale } from '../member-locale-provider';
import { useSiteSettings } from '../site-settings-provider';
import { V47_ASSETS } from './member-home/v47-asset-map';

const STANDALONE_PUBLIC_PREFIXES = ['/clone-preview', '/login', '/register', '/maintenance', '/session-expired'];

export default function PublicMobileSourceHeader() {
  const pathname = usePathname() ?? '/';
  const { locale, toggleLocale } = useMemberLocale();
  const { typedSettings } = useSiteSettings();

  if (STANDALONE_PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return null;

  const configuredLogoUrl = typedSettings.branding.logo_url?.trim();
  const logoUrl = configuredLogoUrl && !configuredLogoUrl.startsWith('/home-asset/')
    ? configuredLogoUrl
    : V47_ASSETS.headerLogo;
  const flagUrl = locale === 'th'
    ? V47_ASSETS.headerFlag
    : '/assets/asset-pc/images/flags/en.svg';
  const languageLabel = locale === 'th' ? 'เปลี่ยนเป็นภาษาอังกฤษ' : 'Switch to Thai';
  const menuLabel = locale === 'th' ? 'เปิดเมนู' : 'Open menu';

  const openMobileMenu = () => {
    window.dispatchEvent(new CustomEvent('member-mobile-menu-open'));
  };

  return (
    <header className="public-mobile-source-header" data-locale={locale}>
      <div className="public-mobile-source-header__inner">
        <button
          type="button"
          className="public-mobile-source-header__menu"
          aria-label={menuLabel}
          aria-controls="member-mobile-menu-drawer"
          onClick={openMobileMenu}
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
          onClick={toggleLocale}
        >
          <img src={flagUrl} alt="" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
