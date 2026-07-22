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
import './public-auth-shell.css';
import './public-auth-polish.css';
import './public-status-page.css';
import './public-mobile.css';
import './public-desktop.css';
import './globals.css';
import './member-system.css';
import './public-auth-market.css';
import './member-home-market.css';
import './member-lobby-theme.css';
import './member-color-aliases.css';
import './member-final-contract.css';
import './member-noah-reference-contract.css';
import './member-noah-source-theme.css';
import './member-source-home.css';
import './member-reference-icon-layout.css';
import './member-noah-fullpage.css';
import './member-noah-final-pass.css';
import './member-home-order-fix.css';
import './member-reference-assets-final.css';
import './member-category-uploaded-icons.css';
import './member-game-category-navigation.css';
import './member-promotion-frame-fix.css';
import './member-hero-carousel-controls.css';
import './member-category-handle-remove.css';
import './member-bottom-nav-balance.css';
import './member-category-rail-balance.css';
import './member-tournament-banner-restore.css';
import './member-header-compact-match.css';
import MemberChrome from './member-chrome';
import MemberHeroSwipeController from './components/member-hero-swipe-controller';
import { MemberSessionProvider } from './member-session-provider';
import { SiteSettingsProvider } from './site-settings-provider';

export const metadata: Metadata = {
  title: {
    default: 'Platform Starter',
    template: '%s | Platform Starter',
  },
  description: 'แพลตฟอร์มสมาชิก',
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
            <MemberHeroSwipeController />
            <MemberChrome>{children}</MemberChrome>
          </MemberSessionProvider>
        </SiteSettingsProvider>
      </body>
    </html>
  );
}
