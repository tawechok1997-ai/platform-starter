import type { Metadata, Viewport } from 'next';
import '../../../packages/design-tokens/colors.css';
import '../../../packages/design-tokens/shape-space-shadow.css';
import '../../../packages/design-tokens/type-motion-layout.css';
import '../../../packages/design-tokens/form-controls.css';
import '../../../packages/design-tokens/overlays.css';
import '../../../packages/design-tokens/data-display.css';
import '../../../packages/design-tokens/feedback.css';
import '../../../packages/design-tokens/responsive-layout.css';
import '../../../packages/design-tokens/accessibility.css';
import '../../../packages/ui-core/src/styles.css';
import './admin-mobile.css';
import './admin-desktop.css';
import './admin-dashboard-responsive.css';
import './admin-operations-responsive.css';
import './globals.css';
import './admin-system.css';
import './admin-drawer-left.css';
import './admin-color-aliases.css';
import './admin-ui.css';
import './admin-enterprise-shell.css';
import './admin-topbar-profile.css';
import './admin-command-palette.css';
import './admin-profile.css';
import './admin-profile-edit.css';
import './admin-accounts.css';
import './admin-member-insights.css';
import './admin-data-table.css';
import './admin-bulk-action.css';
import './admin-shell-overlay-fix.css';
import './admin-confirm-dialog.css';
import './admin-professional-polish.css';
import './admin-language-system.css';
import './admin-chart-polish.css';
import './admin-module-cleanup.css';
import './admin-wallet-history.css';
import './admin-wallet-batch.css';
import './admin-wallet-insights.css';
import './admin-promotion-operations.css';
import './admin-risk-operations.css';
import './admin-reports-ux.css';
import './admin-mobile-audit-polish.css';
import './admin-button-contrast.css';
import './admin-ui-refactor-polish.css';
import './support-center.css';
import './admin-final-audit.css';
import './admin-app-states.css';
import './admin-mobile-drawer-fix.css';
import './admin-single-language-button.css';
import { AdminMobileDrawerController } from './admin-mobile-drawer-controller';

export const metadata: Metadata = {
  title: {
    default: 'Platform Admin',
    template: '%s | Platform Admin',
  },
  applicationName: 'Platform Admin',
  description: 'Secure operations workspace for platform administration.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  colorScheme: 'dark',
  themeColor: '#0b1020',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" dir="ltr">
      <body data-app-surface="admin">
        {children}
        <AdminMobileDrawerController />
      </body>
    </html>
  );
}