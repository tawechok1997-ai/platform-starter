'use client';

import { useEffect } from 'react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin route error', {
      name: error.name,
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <main className="admin-app-state" role="main">
      <section className="admin-app-state__panel admin-app-state__panel--error" role="alert">
        <div className="admin-app-state__icon" aria-hidden="true">!</div>
        <div>
          <p className="admin-app-state__eyebrow">ADMIN WORKSPACE</p>
          <h1 className="admin-app-state__title">โหลดหน้านี้ไม่สำเร็จ</h1>
          <p className="admin-app-state__description">
            ข้อมูลของคุณยังไม่ถูกเปลี่ยนแปลง ลองโหลดส่วนนี้ใหม่ก่อน หากยังเกิดซ้ำให้บันทึกเวลาที่พบปัญหาเพื่อส่งต่อทีมดูแลระบบ
          </p>
          {error.digest ? (
            <p className="admin-app-state__reference">รหัสอ้างอิง: {error.digest}</p>
          ) : null}
          <div className="admin-app-state__actions">
            <button className="admin-app-state__primary" type="button" onClick={reset} autoFocus>
              ลองใหม่
            </button>
            <a className="admin-app-state__secondary" href="/dashboard">
              กลับแดชบอร์ด
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
