'use client';

import { useRouter } from 'next/navigation';
import MobileMemberEmptyState from './mobile-member-empty-state';
import styles from './mobile-member-bonus-page.module.css';

export default function MobileMemberNewsPage() {
  const router = useRouter();

  return (
    <main className={styles.page} data-mobile-member-page="news">
      <header className={styles.header}>
        <button type="button" aria-label="ย้อนกลับ" onClick={() => router.back()}>
          <BackIcon />
        </button>
        <h1>ข่าวสาร</h1>
        <span aria-hidden="true" />
      </header>

      <section className={styles.body}>
        <MobileMemberEmptyState className={styles.empty} label="ไม่มีข้อความใหม่" />
      </section>
    </main>
  );
}

function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.825 13 13.425 18.6 12 20l-8-8 8-8 1.425 1.4L7.825 11H20v2H7.825Z" fill="currentColor" />
    </svg>
  );
}
