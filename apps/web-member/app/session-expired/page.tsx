'use client';

import { useEffect, useState } from 'react';
import { PublicStatusPage } from '../components/public-status-page';
import { buildMemberLoginHrefFromExpiredSession } from '../../src/features/auth/session-navigation';

export default function SessionExpiredPage() {
  const [loginHref, setLoginHref] = useState('/login');
  useEffect(() => setLoginHref(buildMemberLoginHrefFromExpiredSession(window.location.search)), []);
  return (
    <PublicStatusPage
      eyebrow="Account security"
      title="เซสชันหมดอายุ"
      description="เพื่อความปลอดภัย กรุณาเข้าสู่ระบบใหม่ก่อนดำเนินการต่อ"
      primaryHref={loginHref}
      primaryLabel="เข้าสู่ระบบใหม่"
    >
      <p>รายการที่ยังไม่ได้ส่งอาจต้องกรอกใหม่ ระบบจะไม่ดำเนินธุรกรรมโดยอัตโนมัติหลังเซสชันหมดอายุ</p>
    </PublicStatusPage>
  );
}
