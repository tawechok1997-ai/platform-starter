'use client';

import { useEffect } from 'react';

export default function Page() {
  useEffect(() => {
    window.location.replace('/dashboard');
  }, []);

  return <main style={{ minHeight: '100dvh', display: 'grid', placeItems: 'center', background: '#080808', color: '#fff' }}>กำลังตรวจสอบสิทธิ์...</main>;
}
