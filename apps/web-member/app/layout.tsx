import type { Metadata, Viewport } from 'next';
import './design-tokens.css';
import '../../../packages/design-tokens/colors.css';
import '../../../packages/design-tokens/shape-space-shadow.css';
import '../../../packages/design-tokens/type-motion-layout.css';
import '../../../packages/design-tokens/form-controls.css';
import '../../../packages/design-tokens/overlays.css';
import '../../../packages/design-tokens/data-display.css';
import '../../../packages/design-tokens/feedback.css';
import '../../../packages/design-tokens/responsive-layout.css';
import '../../../packages/design-tokens/accessibility.css';
import './member-ui.css';
import './member-home-sections.css';
import './member-home-responsive.css';
import './member-shell.css';
import './member-mobile.css';
import './member-desktop.css';
import './member-finance-responsive.css';
import './member-finance-pages.css';
import './member-finance-flow.css';
import './member-deposit-flow.css';
import './member-finance-form-contract.css';
import './member-bank-contract.css';
import './member-account-contract.css';
import './member-notification-contract.css';
import './member-responsive-contract.css';
import './member-withdraw-flow.css';
import './member-withdraw-contract.css';
import './member-finance-market.css';
import './member-games.css';
import './games/games.css';
import './games/lobby-enhancements.css';
import './games/provider-lobby.css';
import './games/game-detail-provider-theme.css';
import './games/hero-carousel.css';
import './guide/guide.css';
import './member-promotions.css';
import './public-status-page.css';
import './public-mobile.css';
import './public-desktop.css';
import './globals.css';
import './member-system.css';
import './member-home-market.css';
import './member-color-aliases.css';
import './member-final-contract.css';
import './member-source-home.css';
import './member-reference-theme.css';
import './member-reference-current.css';
import './member-production-desktop-fix.css';
import './member-desktop-home-scaffold.css';
import './member-desktop-home-final.css';
import './member-desktop-reference-source.css';
import './member-header-logout.css';
import './member-desktop-reference-polish.css';
import './member-home-real-icons.css';
import './member-v47-dual-master.css';
import './member-v47-detail-pass.css';
import './member-v47-mobile-source.css';
import './member-v47-mobile-completion.css';
import './games/v47-mobile-game-pattern.css';
import './member-v47-desktop-carousel.css';
import './member-v47-header-structure.css';
import './member-v47-quick-actions.css';
import './member-clone-interactions.css';
import './member-reference-assets.css';
import './member-reference-assets-complete.css';
import './browse/public-browse.css';
import './member-assets5-exact.css';
import './member-reference-v6-match.css';
import './member-reference-v6-footer.css';
import './member-assets6-icon-contract.css';
import './member-assets6-mobile-order.css';
import './member-assets6-visual-delta.css';
import './member-v47-responsive-final.css';
import './member-v47-asset-rescue.css';
import './member-assets7-reference-match.css';
import './member-assets7-production-fix.css';
import './member-assets7-runtime-fix.css';
import './member-v47-source-contract-final.css';
import './member-v47-source-contract-correction.css';
import './member-v47-complete-pass.css';
import './member-v47-runtime-final.css';
import './member-v47-final-patch.css';
import './member-v47-visual-acceptance.css';
import './member-v47-hero-mask-fix.css';
import './member-v47-promo-source-match.css';
import './member-v47-announcement-single.css';
import './member-v47-footer-full-width.css';
import './member-v47-provider-source-match.css';
import './member-v47-alliance-full-band.css';
import './member-v47-alliance-reference-image.css';
import './member-v47-alliance-two-row-fix.css';
import './member-v47-alliance-exact-source.css';
import './member-v47-tournament-image-only.css';
import './member-v47-footer-exact-source.css';
import './member-v47-sidebar-source-match.css';
import './member-v47-alliance-scroll-lock.css';
import './member-alliance-v2.css';
import './member-source-bundle-behavior.css';
import './member-v47-mission-color-lock.css';
import MemberChrome from './member-chrome';
import MemberAllianceBandRepair from './components/member-alliance-band-repair';
import MemberDragScrollController from './components/member-drag-scroll-controller';
import MemberHeroSwipeController from './components/member-hero-swipe-controller';
import { MemberSessionProvider } from './member-session-provider';
import { SiteSettingsProvider } from './site-settings-provider';

export const metadata: Metadata = {
  title: {
    default: 'NOAH345',
    template: '%s | NOAH345',
  },
  description: 'เว็บพนันออนไลน์ที่ดีที่สุด พร้อมบริการลูกค้าตลอด 24 ชั่วโมง และมีเกมให้เลือกเล่นมากมาย',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <SiteSettingsProvider>
          <MemberSessionProvider>
            <MemberAllianceBandRepair />
            <MemberHeroSwipeController />
            <MemberDragScrollController />
            <MemberChrome>{children}</MemberChrome>
          </MemberSessionProvider>
        </SiteSettingsProvider>
      </body>
    </html>
  );
}
