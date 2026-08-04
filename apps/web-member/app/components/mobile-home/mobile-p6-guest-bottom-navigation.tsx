'use client';

import { useMemberLocale } from '../../member-locale-provider';
import { useMemberRuntime } from '../../member-runtime-provider';

const CONTACT_URL = 'https://lin.ee/UYkP0OC';

export default function MobileP6GuestBottomNavigation() {
  const { locale } = useMemberLocale();
  const { summary } = useMemberRuntime();

  if (summary.isLoggedIn) return null;

  const labels = locale === 'th'
    ? { menu: 'เมนู', deposit: 'ฝาก', withdraw: 'ถอน', contact: 'ติดต่อ' }
    : { menu: 'Menu', deposit: 'Deposit', withdraw: 'Withdraw', contact: 'Contact' };

  const openDrawer = () => {
    document
      .querySelector<HTMLButtonElement>('button[aria-controls="mobile-home-drawer"]')
      ?.click();
  };
  const openLogin = () => window.location.assign('/?auth=login');
  const openContact = () => window.open(CONTACT_URL, '_blank', 'noopener,noreferrer');

  return (
    <>
      <nav
        className="mobile-p6-guest-nav"
        data-ui-owner="mobile-navigation"
        data-mobile-member-bottom-navigation="true"
        data-mobile-bottom-navigation-mode="guest"
        aria-label={locale === 'th' ? 'เมนูด้านล่าง' : 'Bottom navigation'}
      >
        <div className="mobile-p6-guest-nav__inner">
          <button type="button" onClick={openDrawer} aria-label={labels.menu}>
            <span className="mobile-p6-guest-nav__glyph mobile-p6-guest-nav__menu" aria-hidden="true">
              <i /><i /><i />
            </span>
            <span>{labels.menu}</span>
          </button>
          <button type="button" onClick={openLogin} aria-label={labels.deposit}>
            <span className="mobile-p6-guest-nav__glyph" aria-hidden="true">
              <img src="/assets/reference-brand/menu/deposit.png" alt="" />
            </span>
            <span>{labels.deposit}</span>
          </button>
          <button type="button" onClick={openLogin} aria-label={labels.withdraw}>
            <span className="mobile-p6-guest-nav__glyph" aria-hidden="true">
              <img src="/assets/reference-brand/menu/withdraw.png" alt="" />
            </span>
            <span>{labels.withdraw}</span>
          </button>
          <button type="button" onClick={openContact} aria-label={labels.contact}>
            <span className="mobile-p6-guest-nav__glyph mobile-p6-guest-nav__contact" aria-hidden="true">
              <img src="/assets/asset-pc/images/line.png" alt="" />
            </span>
            <span>{labels.contact}</span>
          </button>
        </div>
      </nav>

      <style jsx global>{`
        @media (max-width: 900px) {
          .mobile-p6-guest-nav {
            position: fixed !important;
            right: auto !important;
            bottom: 0 !important;
            left: 50% !important;
            z-index: 190 !important;
            width: min(100%, 640px) !important;
            height: calc(60px + env(safe-area-inset-bottom, 0px)) !important;
            margin: 0 !important;
            padding: 0 8px env(safe-area-inset-bottom, 0px) !important;
            transform: translateX(-50%) !important;
            border-top: 1px solid rgb(255 255 255 / 10%) !important;
            background:
              radial-gradient(circle at 50% -30%, rgb(142 54 181 / 52%), transparent 58%),
              linear-gradient(180deg, rgb(55 48 72 / 98%), rgb(29 25 40 / 99%)) !important;
            box-shadow: 0 -10px 28px rgb(0 0 0 / 35%) !important;
            backdrop-filter: blur(14px);
          }

          .mobile-p6-guest-nav__inner {
            display: grid !important;
            width: 100% !important;
            height: 60px !important;
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
            align-items: stretch !important;
            pointer-events: auto !important;
          }

          .mobile-p6-guest-nav__inner > button {
            display: flex !important;
            min-width: 44px !important;
            min-height: 60px !important;
            padding: 4px 2px 3px !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            gap: 2px !important;
            border: 0 !important;
            border-radius: 10px !important;
            color: rgb(255 255 255 / 84%) !important;
            background: transparent !important;
            font: inherit !important;
            font-size: 11px !important;
            line-height: 1.15 !important;
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }

          .mobile-p6-guest-nav__inner > button:active {
            background: rgb(255 255 255 / 7%) !important;
          }

          .mobile-p6-guest-nav__glyph {
            display: grid !important;
            width: 28px !important;
            height: 28px !important;
            place-items: center !important;
          }

          .mobile-p6-guest-nav__glyph img {
            display: block !important;
            width: 26px !important;
            height: 26px !important;
            object-fit: contain !important;
          }

          .mobile-p6-guest-nav__menu {
            align-content: center !important;
            gap: 4px !important;
          }

          .mobile-p6-guest-nav__menu i {
            display: block !important;
            width: 22px !important;
            height: 2px !important;
            border-radius: 99px !important;
            background: currentColor !important;
          }

          .mobile-p6-guest-nav__contact img {
            border-radius: 7px !important;
          }

          .mobile-p6-guest-nav__inner > button:focus-visible {
            outline: 2px solid #d98cff !important;
            outline-offset: -3px !important;
          }
        }
      `}</style>
    </>
  );
}
