import type { Viewport } from 'next';
import '../../../packages/design-tokens/colors.css';
import '../../../packages/design-tokens/shape-space-shadow.css';
import './admin-mobile.css';
import './admin-desktop.css';
import './admin-dashboard-responsive.css';
import './admin-operations-responsive.css';
import './globals.css';
import './admin-system.css';
import './admin-drawer-left.css';
import './admin-color-aliases.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
