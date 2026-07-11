import type { Viewport } from 'next';
import './admin-mobile.css';
import './admin-desktop.css';
import './admin-dashboard-responsive.css';
import './admin-operations-responsive.css';
import './globals.css';
import './admin-system.css';

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
