import type { ReactNode } from 'react';
import MobileMemberPopupRuntime from '../components/mobile-home/mobile-member-popup-runtime';

export default function SearchLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <MobileMemberPopupRuntime />
    </>
  );
}
