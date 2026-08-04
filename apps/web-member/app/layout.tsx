import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
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
import './member-mobile-source-theme.css';
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
import './member-home-promotion-popup.css';
import './member-home-activity-news-popup.css';
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
import './member-desktop-reference-source.css';
import './member-home-real-icons.css';
import './member-v47-dual-master.css';
import './member-v47-detail-pass.css';
import './member-v47-mobile-source.css';
import './member-v47-mobile-completion.css';
import './games/v47-mobile-game-pattern.css';
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
import './member-v47-tournament-image-only.css';
import './member-v47-footer-exact-source.css';
import './member-source-bundle-behavior.css';
import './member-auth-overlay.css';
import './member-source-highlight.css';
import './member-v47-tournament-exact-source.css';
import './member-source-feed-sections.css';
import './member-mobile-source-header.css';
import './member-public-game-shell.css';
import './member-public-lower-shell.css';
import './member-footer-secondary-border-fix.css';
import './member-home-sidebar-primary.css';
import './member-public-modal-viewport-contract.css';
import './member-v47-tournament-rank-badge-size-lock.css';
import './member-leaderboard-source-match-lock.css';
import './member-leaderboard-rank-number-lock.css';
import './member-casino-transparent-source-match.css';
import './member-source-game-transparent-surfaces.css';
import './member-popup-responsive-unified.css';
import './member-popup-responsive-current-runtime.css';
import './member-menu-source-final.css';
import './member-menu-income-source-final.css';
import './member-desktop-runtime-owner.css';
import './member-slot-filter-full-height.css';
import './member-modal-system.css';
import './member-mobile-home-bottom-owner.css';
import './member-viewport-ui-isolation.css';
import './member-mobile-highlight-tabs-source.css';
import './member-mobile-category-follow.css';
import './member-source-fonts.css';
import './member-motion-contract.css';
import './member-game-interaction-final.css';
import './member-desktop-motion-final.css';
import MemberChrome from './member-chrome';
import MemberActivityPredictionRuntime from './components/member-activity-prediction-runtime';
import MemberClientNavigationController from './components/member-client-navigation-controller';
import MemberDesktopMotionRuntime from './components/member-desktop-motion-runtime';
import MemberDragScrollController from './components/member-drag-scroll-controller';
import MemberFloatingContact from './components/member-floating-contact';
import MemberImageFallbackController from './components/member-image-fallback-controller';
import MemberLoadingScreen from './components/member-loading-screen';
import MobileLocalAssetRuntime from './components/mobile-local-asset-runtime';
import MemberNavigationAuthController from './components/member-navigation-auth-controller';
import MemberRenderStabilityController from './components/member-render-stability-controller';
import PublicDialogRuntimeController from './components/public-dialog-runtime-controller';
import PublicLiveNavigationController from './components/public-live-navigation-controller';
import PublicGameLoginController from './components/member-home/public-home-game-navigation-controller';
import PublicDesktopViewportBootstrapOwner from './components/public-desktop-viewport-bootstrap-owner';
import PublicMobileSourceHeaderOwner from './components/public-mobile-source-header-owner';
import SiteFaviconRuntime from './components/site-favicon-runtime';
import UsageGuideController from './components/member-home/usage-guide-controller';
import { MemberLocaleProvider } from './member-locale-provider';
import { MemberRuntimeProvider } from './member-runtime-provider';
import { MemberSessionProvider } from './member-session-provider';
import { SiteSettingsProvider } from './site-settings-provider';
import { loadPublicSiteSettings } from './site-settings';

const MEMBER_PREHYDRATION_SCRIPT = `(() => {
  const root = document.documentElement;
  let hasSession = false;
  try {
    hasSession = Boolean(
      window.localStorage.getItem('member_access_token')
      || window.localStorage.getItem('member_refresh_token')
    );
  } catch {}

  root.dataset.memberSessionHint = hasSession ? 'token' : 'guest';
  root.dataset.memberSessionReady = 'false';

  const width = Math.max(1, root.clientWidth || window.innerWidth || 1);
  const mobileOnly = width <= 900;

  if (mobileOnly) {
    root.dataset.memberViewportMode = 'mobile';
    root.dataset.memberViewportReady = 'true';
    root.dataset.memberDesktopScaled = 'false';
    return;
  }

  root.dataset.memberViewportMode = 'desktop';
  if (width < 1455) {
    root.dataset.memberViewportReady = 'false';
    root.dataset.memberDesktopScaled = 'true';
    root.style.setProperty('--member-desktop-pre-scale', String(width / 1455));
  } else {
    root.dataset.memberViewportReady = 'true';
    root.dataset.memberDesktopScaled = 'false';
  }
})();`;

const MEMBER_SOURCE_FONT_STYLESHEET = 'https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@100;200;300;400;500;600;700;800;900&family=Noto+Sans:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap';

export const metadata: Metadata = {
  title: {
    default: 'NOAH345',
    template: '%s | NOAH345',
  },
  description: 'เว็บพนันออนไลน์ที่ดีที่สุด พร้อมบริการลูกค้าตลอด 24 ชั่วโมง และมีเกมให้เลือกเล่นมากมาย',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const initialSettings = await loadPublicSiteSettings();

  return (
    <html lang="th" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={MEMBER_SOURCE_FONT_STYLESHEET} />
        <script dangerouslySetInnerHTML={{ __html: MEMBER_PREHYDRATION_SCRIPT }} />
      </head>
      <body>
        <MemberLocaleProvider>
          <SiteSettingsProvider initialSettings={initialSettings}>
            <SiteFaviconRuntime />
            <MemberSessionProvider>
              <MemberRuntimeProvider>
                <MemberNavigationAuthController />
                <PublicDesktopViewportBootstrapOwner />
                <MemberRenderStabilityController />
                <MemberClientNavigationController />
                <MemberDesktopMotionRuntime />
                <MemberImageFallbackController />
                <MobileLocalAssetRuntime />
                <MemberDragScrollController />
                <PublicLiveNavigationController />
                <PublicDialogRuntimeController />
                <PublicGameLoginController />
                <MemberActivityPredictionRuntime />
                <UsageGuideController />
                <PublicMobileSourceHeaderOwner />
                <div id="member-desktop-scale-shell">
                  <div id="member-desktop-scale-canvas">
                    <Suspense fallback={<MemberLoadingScreen />}>
                      <MemberChrome>{children}</MemberChrome>
                    </Suspense>
                  </div>
                </div>
                <MemberFloatingContact />
              </MemberRuntimeProvider>
            </MemberSessionProvider>
          </SiteSettingsProvider>
        </MemberLocaleProvider>
      </body>
    </html>
  );
}
