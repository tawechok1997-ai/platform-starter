import type { ReactNode } from 'react';
import MobileMemberPopupRuntime from '../../components/mobile-home/mobile-member-popup-runtime';

export default function AvatarLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <MobileMemberPopupRuntime />
    </>
  );
}
