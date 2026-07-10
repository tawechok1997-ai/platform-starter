'use client';

import { ReactNode, useEffect } from 'react';

export default function MemberProtectedLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    const token = window.localStorage.getItem('member_access_token');
    if (!token) window.location.href = '/login';
  }, []);

  return <>{children}</>;
}
