'use client';

import { usePathname } from 'next/navigation';
import MemberLoadingScreen from './components/member-loading-screen';
import SessionExpiredContent from './session-expired/session-expired-content';

export default function Loading() {
  const pathname = usePathname() ?? '';

  if (pathname.startsWith('/session-expired')) {
    return <SessionExpiredContent />;
  }

  return <MemberLoadingScreen />;
}
