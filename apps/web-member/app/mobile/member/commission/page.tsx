'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMemberRuntime } from '../../../member-runtime-provider';
import styles from '../source-page.module.css';

type Period = 'all' | 'today' | 'week' | 'month';

const PERIODS: Array<{ id: Period; label: string }> = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'today', label: 'วันนี้' },
  { id: 'week', label: 'สัปดาห์นี้' },
  { id: 'month', label: 'เดือนนี้' },
];

export default function MobileCommissionPage() {
  const router = useRouter();
  const { summary } = useMemberRuntime();
  const [period, setPeriod] = useState<Period>('all');
  const summaryData = summary as unknown as Record<string, unknown>;
  const commission = useMemo(() => money(summaryData.commissionBalance), [summaryData.commissionBalance]);

  return (
    <main className={styles.page} data-mobile-member-page="commission">
      <header className={styles.header}>
        <button type="button" aria-label="ย้อนกลับ" onClick={() => router.back()}><BackIcon /></button>
        <h1>รายได้คอมมิชชั่น</h1>
        <span aria-hidden="true" />
      </header>

      <div className={styles.body}>
        <div className={styles.periodTabs} role="tablist" aria-label="ช่วงเวลารายได้">
          {PERIODS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={period === item.id}
              data-active={period === item.id ? 'true' : 'false'}
              onClick={() => setPeriod(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>

        <section className={styles.summaryCard}>
          <div>
            <span>รายได้คอมมิชชั่นที่ถอนได้</span>
            <strong>{commission}</strong>
          </div>
          <button type="button" data-mobile-income-popup="commission">ถอนรายได้</button>
        </section>

        <div className={styles.sectionTitle}>รายละเอียดรายได้</div>
        <div className={styles.empty}>
          <EmptyIllustration />
          <strong>ยังไม่มีรายการในช่วงเวลานี้</strong>
        </div>
      </div>
    </main>
  );
}

function money(value: unknown) {
  const number = Number(value ?? 0);
  return (Number.isFinite(number) ? number : 0).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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
