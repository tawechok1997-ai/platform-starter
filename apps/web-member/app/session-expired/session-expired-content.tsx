'use client';

import { useEffect } from 'react';
import { clearMemberSession } from '../member-api';
import { useMemberLocale } from '../member-locale-provider';

const COPY = {
  th: {
    eyebrow: 'ความปลอดภัยของบัญชี',
    title: 'เซสชันหมดอายุ',
    description: 'ระบบล้างข้อมูลเข้าสู่ระบบเดิมแล้ว กรุณากลับหน้าหลักและเข้าสู่ระบบอีกครั้ง',
    action: 'กลับหน้าหลัก',
  },
  en: {
    eyebrow: 'Account security',
    title: 'Session expired',
    description: 'Your previous sign-in session was cleared. Return home and sign in again.',
    action: 'Back to home',
  },
} as const;

export default function SessionExpiredContent() {
  const { locale } = useMemberLocale();
  const copy = COPY[locale];

  useEffect(() => {
    clearMemberSession();
  }, []);

  return (
    <main
      data-session-expired-content="true"
      style={{
        minHeight: 'clamp(520px, 70dvh, 760px)',
        display: 'grid',
        placeItems: 'center',
        padding: 'clamp(20px, 5vw, 48px)',
        color: '#fff',
        background: 'radial-gradient(circle at 50% 20%, rgba(151,0,189,.14), transparent 36%), #090a0f',
      }}
    >
      <section
        style={{
          width: 'min(100%, 460px)',
          padding: 'clamp(24px, 5vw, 36px)',
          border: '1px solid rgba(187,91,234,.34)',
          borderRadius: 18,
          background: 'linear-gradient(180deg, rgba(43,37,54,.98), rgba(21,18,27,.98))',
          boxShadow: '0 24px 80px rgba(0,0,0,.48)',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            minHeight: 28,
            padding: '0 12px',
            alignItems: 'center',
            border: '1px solid rgba(187,91,234,.32)',
            borderRadius: 999,
            color: '#e3b3f5',
            background: 'rgba(151,0,189,.12)',
            fontSize: 12,
            fontWeight: 800,
          }}
        >
          {copy.eyebrow}
        </span>
        <h1 style={{ margin: '18px 0 10px', fontSize: 'clamp(28px, 7vw, 38px)', lineHeight: 1.15 }}>
          {copy.title}
        </h1>
        <p style={{ margin: '0 0 24px', color: 'rgba(255,255,255,.7)', fontSize: 15, lineHeight: 1.7 }}>
          {copy.description}
        </p>
        <a
          href="/"
          style={{
            display: 'inline-flex',
            minWidth: 170,
            minHeight: 48,
            padding: '0 24px',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(255,255,255,.12)',
            borderRadius: 8,
            color: '#fff',
            background: 'linear-gradient(180deg, #a814d4, #72008f)',
            boxShadow: 'inset 0 1px rgba(255,255,255,.18), 0 12px 30px rgba(114,0,143,.28)',
            fontWeight: 800,
            textDecoration: 'none',
          }}
        >
          {copy.action}
        </a>
      </section>
    </main>
  );
}
