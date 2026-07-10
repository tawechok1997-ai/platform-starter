'use client';

import { useEffect } from 'react';

export default function Page() {
  useEffect(() => {
    const token = window.localStorage.getItem('admin_access_token');
    window.location.replace(token ? '/dashboard' : '/login');
  }, []);

  return <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: '#080808', color: '#fff' }}>กำลังตรวจสอบสิทธิ์...</main>;
}
