import type { ReactNode } from 'react';
import MobileMemberPopupRuntime from '../components/mobile-home/mobile-member-popup-runtime';

export default function MobileLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <MobileMemberPopupRuntime />
    </>
  );
}
