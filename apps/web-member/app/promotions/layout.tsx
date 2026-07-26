import type { ReactNode } from 'react';
import PublicBrowseShell from '../components/public-browse-shell';

export default function PromotionsLayout({ children }: { children: ReactNode }) {
  return <PublicBrowseShell>{children}</PublicBrowseShell>;
}
