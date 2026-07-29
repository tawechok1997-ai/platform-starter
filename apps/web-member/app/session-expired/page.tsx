'use client';

import { useEffect } from 'react';
import { clearMemberSession } from '../member-api';
import { PublicPageShell } from '../components/public-page-shell';
import { useMemberLocale } from '../member-locale-provider';

const COPY = {
  th: { title: 'เซสชันหมดอายุ', description: 'ระบบล้างข้อมูลเข้าสู่ระบบเดิมแล้ว กดกลับหน้าหลักเพื่อใช้งานต่อ', action: 'กลับหน้าหลัก' },
  en: { title: 'Session expired', description: 'Your previous sign-in session was cleared. Return home to continue.', action: 'Back to home' },
} as const;

export default function SessionExpiredPage() {
  const { locale } = useMemberLocale();
  const copy = COPY[locale];

  useEffect(() => {
    clearMemberSession();
  }, []);

  return (
    <PublicPageShell>
      <main className="member-loading-screen" style={{ minHeight: '70dvh', display: 'grid', placeItems: 'center', padding: 24 }}>
        <section style={{ width: 'min(100%, 460px)', padding: 28, border: '1px solid rgba(255,255,255,.12)', borderRadius: 18, background: '#15121b', textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 10px', fontSize: 30 }}>{copy.title}</h1>
          <p style={{ margin: '0 0 20px', color: 'rgba(255,255,255,.68)' }}>{copy.description}</p>
          <a href="/" style={{ display: 'inline-flex', minHeight: 42, alignItems: 'center', justifyContent: 'center', padding: '0 24px', borderRadius: 10, background: '#a51bd4', color: '#fff', fontWeight: 800, textDecoration: 'none' }}>
            {copy.action}
          </a>
        </section>
      </main>
    </PublicPageShell>
  );
}
