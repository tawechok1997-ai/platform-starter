'use client';

import { usePathname } from 'next/navigation';
import MemberBodySkeleton from './components/member-body-skeleton';
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

  return (
    <main
      className="member-loading-screen"
      role="status"
      aria-live="polite"
      aria-label="กำลังโหลดเนื้อหา"
    >
      <span
        aria-hidden="true"
        style={{
          width: 42,
          height: 42,
          border: '4px solid rgba(255,255,255,.12)',
          borderTopColor: '#a814d4',
          borderRadius: '50%',
          animation: 'memberLoadingSpin .8s linear infinite',
        }}
      />
      <style>{'@keyframes memberLoadingSpin{to{transform:rotate(360deg)}}'}</style>
    </main>
  );
}
