import type { Viewport } from 'next';
import './design-tokens.css';
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
import './member-withdraw-flow.css';
import './member-finance-market.css';
import './member-games.css';
import './games/games.css';
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
import MemberChrome from './member-chrome';
import { MemberSessionProvider } from './member-session-provider';
import { SiteSettingsProvider } from './site-settings-provider';

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
            <MemberChrome>{children}</MemberChrome>
          </MemberSessionProvider>
        </SiteSettingsProvider>
      </body>
    </html>
  );
}
