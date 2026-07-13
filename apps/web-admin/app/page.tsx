'use client';

import { useEffect } from 'react';

export default function Page() {
  useEffect(() => {
    const refreshToken = window.localStorage.getItem('admin_refresh_token');
    window.location.replace(refreshToken ? '/dashboard' : '/login');
  }, []);

  return <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: '#080808', color: '#fff' }}>กำลังตรวจสอบสิทธิ์...</main>;
}
