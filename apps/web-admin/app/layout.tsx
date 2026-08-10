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
import './admin-overlay-transitions.css';
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
import './admin-sidebar-profile-header.css';
import './admin-modern-command-center.css';
import './admin-modern-dashboard-layout.css';
import './admin-modern-modules.css';
import './admin-modern-token-bridge.css';
import './admin-modern-workflows.css';
import './admin-modern-auth.css';
import './admin-modern-normalization.css';
import './admin-modern-governance.css';
import './admin-modern-audit.css';
import './admin-modern-platform-ops.css';
import './admin-release-readiness.css';
import './admin-release-controls.css';
import './admin-shell-layout.css';
import './admin-shell-profile-popover.css';
import './admin-modernization-adoption.css';
import './admin-ux-overrides.css';
import './admin-full-viewport-layout.css';
import './admin-professional-authority.css';
import './admin-permanent-sidebar.css';
import './admin-static-sidebar-groups.css';
import './admin-sidebar-smart-accordion.css';
import './admin-data-page-layout.css';
import './admin-universal-full-width.css';
import './admin-appearance-foundation.css';
import './admin-workspace-runtime.css';
import './admin-content-insets.css';
import './admin-pr2-ui-closure.css';
import './admin-layout-integrity.css';
import './admin-theme-completeness.css';
import { AdminAccessRefreshRuntime } from './admin-access-refresh-runtime';
import { AdminMobileDrawerController } from './admin-mobile-drawer-controller';
import { AdminAppearanceRuntime } from './admin-appearance-runtime';
import { AdminLegacyThemeNormalizer } from './admin-legacy-theme-normalizer';
import { AdminWorkspaceRuntime } from './admin-workspace-runtime';
import { AdminShellAccessibilityRuntime } from './admin-shell-accessibility-runtime';

const appearanceBootstrap = `(() => {
  const storageKey = 'admin_appearance_preferences_v1';
  const fallback = { theme: 'dark', density: 'comfortable', contrast: 'normal', motion: 'system' };
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
    const preferences = {
      theme: ['light', 'dark', 'system'].includes(stored.theme) ? stored.theme : fallback.theme,
      density: ['comfortable', 'compact'].includes(stored.density) ? stored.density : fallback.density,
      contrast: ['normal', 'high'].includes(stored.contrast) ? stored.contrast : fallback.contrast,
      motion: ['system', 'reduced'].includes(stored.motion) ? stored.motion : fallback.motion,
    };
    const resolvedTheme = preferences.theme === 'system'
      ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : preferences.theme;
    const root = document.documentElement;
    root.dataset.adminTheme = resolvedTheme;
    root.dataset.adminThemePreference = preferences.theme;
    root.dataset.adminDensity = preferences.density;
    root.dataset.adminContrast = preferences.contrast;
    root.dataset.adminMotion = preferences.motion;
    root.style.colorScheme = resolvedTheme;
  } catch {
    document.documentElement.dataset.adminTheme = fallback.theme;
    document.documentElement.dataset.adminThemePreference = fallback.theme;
    document.documentElement.dataset.adminDensity = fallback.density;
    document.documentElement.dataset.adminContrast = fallback.contrast;
    document.documentElement.dataset.adminMotion = fallback.motion;
    document.documentElement.style.colorScheme = fallback.theme;
  }
})();`;

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
  colorScheme: 'dark light',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f3f6fb' },
    { media: '(prefers-color-scheme: dark)', color: '#070b12' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" dir="ltr" suppressHydrationWarning>
      <head>
        <script id="admin-appearance-bootstrap">{appearanceBootstrap}</script>
      </head>
      <body data-app-surface="admin">
        {children}
        <AdminAppearanceRuntime />
        <AdminLegacyThemeNormalizer />
        <AdminAccessRefreshRuntime />
        <AdminWorkspaceRuntime />
        <AdminShellAccessibilityRuntime />
        <AdminMobileDrawerController />
      </body>
    </html>
  );
}
