'use client';

import { useEffect } from 'react';
import { clearMemberSession } from '../member-api';

export default function SessionExpiredPage() {
  useEffect(() => {
    clearMemberSession();
  }, []);

  return (
    <main className="member-loading-screen" style={{ display: 'grid', placeItems: 'center', padding: 24 }}>
      <section style={{ width: 'min(100%, 460px)', padding: 28, border: '1px solid rgba(255,255,255,.12)', borderRadius: 18, background: '#15121b', textAlign: 'center' }}>
        <h1 style={{ margin: '0 0 10px', fontSize: 30 }}>เซสชันหมดอายุ</h1>
        <p style={{ margin: '0 0 20px', color: 'rgba(255,255,255,.68)' }}>ระบบล้างข้อมูลเข้าสู่ระบบเดิมแล้ว กดกลับหน้าหลักเพื่อใช้งานต่อ</p>
        <a href="/" style={{ display: 'inline-flex', minHeight: 42, alignItems: 'center', justifyContent: 'center', padding: '0 24px', borderRadius: 10, background: '#a51bd4', color: '#fff', fontWeight: 800, textDecoration: 'none' }}>
          กลับหน้าหลัก
        </a>
      </section>
    </main>
  );
}
