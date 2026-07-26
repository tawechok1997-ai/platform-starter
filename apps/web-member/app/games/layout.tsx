import type { ReactNode } from 'react';
import PublicBrowseShell from '../components/public-browse-shell';

export default function GamesLayout({ children }: { children: ReactNode }) {
  return <PublicBrowseShell>{children}</PublicBrowseShell>;
}
