'use client';

import { usePathname } from 'next/navigation';
import MemberBodySkeleton from './components/member-body-skeleton';
import MemberLoadingScreen from './components/member-loading-screen';
import SessionExpiredContent from './session-expired/session-expired-content';

export default function Loading() {
  const pathname = usePathname() ?? '';

  if (pathname.startsWith('/session-expired')) {
    return <SessionExpiredContent />;
  }

  if (
    pathname.startsWith('/browse/games')
    || pathname.startsWith('/games')
    || pathname.startsWith('/search')
  ) {
    return <MemberBodySkeleton />;
  }

  return <MemberLoadingScreen />;
}
