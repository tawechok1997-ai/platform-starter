'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { memberApiFetch } from '../../../member-api';
import styles from '../source-page.module.css';

type BonusItem = {
  id: string;
  title: string;
  status: string;
  progress: number;
  required: number;
};

export default function MobileSpecialBonusPage() {
  const router = useRouter();
  const [items, setItems] = useState<BonusItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    memberApiFetch('/member/bonus-ledgers').then(async (response) => {
      const payload = await response.json().catch(() => null);
      if (!response.ok || cancelled) return;
      const source = Array.isArray(payload?.items) ? payload.items : [];
      setItems(source.map((value: unknown, index: number) => normalizeBonus(value, index)));
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return (
    <main className={styles.page} data-mobile-member-page="bonus">
      <header className={styles.header}>
        <button type="button" aria-label="ย้อนกลับ" onClick={() => router.back()}><BackIcon /></button>
        <h1>โบนัสพิเศษ</h1>
        <span aria-hidden="true" />
      </header>

      <div className={styles.body}>
        {loading ? <div className={styles.state}>กำลังโหลดข้อมูล...</div> : null}
        {!loading && items.length === 0 ? (
          <div className={styles.empty}>
            <EmptyIllustration />
            <strong>ไม่มีข้อความใหม่</strong>
          </div>
        ) : null}
        {items.length > 0 ? (
          <div className={styles.list}>
            {items.map((item) => (
              <article key={item.id} className={styles.bonusCard}>
                <span aria-hidden="true">✦</span>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.status}</span>
                  <small>ยอดทำเทิร์น {money(item.progress)} / {money(item.required)}</small>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}

function normalizeBonus(value: unknown, index: number): BonusItem {
  const item = value && typeof value === 'object' ? value as Record<string, unknown> : {};
  return {
    id: stringValue(item.id) || String(index),
    title: stringValue(item.title) || stringValue(item.name) || `โบนัส ${index + 1}`,
    status: stringValue(item.status) || 'กำลังใช้งาน',
    progress: numberValue(item.turnoverProgress),
    required: numberValue(item.turnoverRequired),
  };
}

function stringValue(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

function numberValue(value: unknown) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function money(value: number) {
  return value.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function BackIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7.825 13 13.425 18.6 12 20l-8-8 8-8 1.425 1.4L7.825 11H20v2H7.825Z" fill="currentColor" /></svg>;
}

function EmptyIllustration() {
  return (
    <svg viewBox="0 0 116 81" fill="none" aria-hidden="true">
      <path d="M87.431 36.608H23.215V72.73a8.027 8.027 0 0 0 8.027 8.027h48.162a8.027 8.027 0 0 0 8.027-8.027V36.608Z" fill="#e0b1f1" />
      <rect x="47.898" y="46.667" width="14.737" height="4.912" rx="2.456" fill="#a800cb" />
      <path d="M7.754 17.313a8.027 8.027 0 0 0-5.676 9.831l2.077 7.754a8.027 8.027 0 0 0 9.831 5.676l56.86-15.236a8.027 8.027 0 0 0 5.675-9.831l-2.077-7.753a8.027 8.027 0 0 0-9.831-5.676L7.753 17.313Z" fill="#a800cb" />
      <path d="M68.773 35s19.65-5.526 16.58-11.667c-1.665-3.33-6.44-3.1-9.211-.614-3.193 2.864-3.062 10.438 1.228 10.438 3.07 0 10.439.614 15.966-2.456 8.655-4.809 10.439-8.597 12.895-14.123" stroke="#e0b1f1" strokeWidth="1.228" strokeLinecap="round" strokeDasharray="2.46 2.46" />
    </svg>
  );
}
