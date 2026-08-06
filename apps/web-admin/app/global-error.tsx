'use client';

import { useEffect, useState } from 'react';
import { createAdminIncidentId, readAdminLocale } from '../src/features/admin-reliability/admin-data-contracts';

export default function AdminGlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [incidentId] = useState(() => error.digest || createAdminIncidentId('GLOBAL'));
  const [locale] = useState(() => readAdminLocale());
  const copy = locale === 'en' ? EN_COPY : TH_COPY;

  useEffect(() => {
    console.error('Admin global error boundary', {
      incidentId,
      name: error.name,
      digest: error.digest,
    });
  }, [error.digest, error.name, incidentId]);

  return (
    <html lang={locale === 'en' ? 'en' : 'th'}>
      <body>
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
                <button className="admin-app-state__secondary" type="button" onClick={() => window.location.assign('/dashboard')}>{copy.dashboard}</button>
                <button className="admin-app-state__secondary" type="button" onClick={() => window.location.reload()}>{copy.reload}</button>
              </div>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}

const TH_COPY = {
  title: 'ระบบผู้ดูแลเกิดข้อผิดพลาด',
  description: 'ระบบหยุดส่วนที่มีปัญหาไว้เพื่อป้องกันข้อมูลเสียหาย ลองเปิดใหม่อีกครั้งและใช้รหัสอ้างอิงเมื่อติดต่อทีมดูแลระบบ',
  reference: 'รหัสอ้างอิง',
  retry: 'ลองเปิดส่วนนี้ใหม่',
  dashboard: 'กลับแดชบอร์ด',
  reload: 'โหลดทั้งระบบใหม่',
} as const;

const EN_COPY = {
  title: 'The admin workspace encountered an error',
  description: 'The failing area was stopped to protect your data. Retry it and include the reference code when contacting the operations team.',
  reference: 'Reference',
  retry: 'Retry this area',
  dashboard: 'Back to dashboard',
  reload: 'Reload the workspace',
} as const;
