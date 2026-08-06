'use client';

import { useEffect, useState } from 'react';
import { createAdminIncidentId, readAdminLocale } from '../src/features/admin-reliability/admin-data-contracts';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [incidentId] = useState(() => error.digest || createAdminIncidentId('ROUTE'));
  const [locale] = useState(() => readAdminLocale());
  const copy = locale === 'en' ? EN_COPY : TH_COPY;

  useEffect(() => {
    console.error('Admin route error boundary', {
      incidentId,
      name: error.name,
      digest: error.digest,
    });
  }, [error.digest, error.name, incidentId]);

  return (
    <main className="admin-app-state" role="main">
      <section className="admin-app-state__panel admin-app-state__panel--error" role="alert">
        <div className="admin-app-state__icon" aria-hidden="true">!</div>
        <div>
          <p className="admin-app-state__eyebrow">ADMIN WORKSPACE</p>
          <h1 className="admin-app-state__title">{copy.title}</h1>
          <p className="admin-app-state__description">{copy.description}</p>
          <p className="admin-app-state__reference">{copy.reference}: {incidentId}</p>
          <div className="admin-app-state__actions">
            <button className="admin-app-state__primary" type="button" onClick={reset} autoFocus>{copy.retry}</button>
            <a className="admin-app-state__secondary" href="/dashboard">{copy.dashboard}</a>
          </div>
        </div>
      </section>
    </main>
  );
}

const TH_COPY = {
  title: 'โหลดหน้านี้ไม่สำเร็จ',
  description: 'ข้อมูลของคุณยังไม่ถูกเปลี่ยนแปลง ลองโหลดส่วนนี้ใหม่ก่อน หากยังเกิดซ้ำให้ส่งรหัสอ้างอิงแก่ทีมดูแลระบบ',
  reference: 'รหัสอ้างอิง',
  retry: 'ลองใหม่',
  dashboard: 'กลับแดชบอร์ด',
} as const;

const EN_COPY = {
  title: 'This page could not be loaded',
  description: 'Your data was not changed. Retry this area and include the reference code if the problem continues.',
  reference: 'Reference',
  retry: 'Retry',
  dashboard: 'Back to dashboard',
} as const;
