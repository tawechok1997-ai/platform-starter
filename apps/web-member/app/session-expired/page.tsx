'use client';

import { useEffect } from 'react';
import { clearMemberSession } from '../member-api';

export default function SessionExpiredPage() {
  useEffect(() => {
    clearMemberSession();
    window.location.replace('/');
  }, []);

  return <main className="member-loading-screen">กำลังกลับหน้าหลัก...</main>;
}
