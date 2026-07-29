'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMemberLocale } from '../../member-locale-provider';
import styles from './tournament-page.module.css';

type TournamentTab = 'current' | 'finished';

const FINISHED_TOURNAMENTS = [
  'No1. Tournament Football Royale ครั้งที่ 2',
  'No1. Tournament Football Classic ครั้งที่ 2',
  'No1. Tournament Football Royale ครั้งที่ 1',
  'No1. Tournament Football Classic ครั้งที่ 1',
] as const;

const COPY = {
  th: {
    back: 'ย้อนกลับ',
    current: 'ทัวร์นาเมนต์ขณะนี้',
    finished: 'ทัวร์นาเมนต์ที่จบลงแล้ว',
    empty: 'ยังไม่มีรายการทัวร์นาเมนต์ในขณะนี้',
    ended: 'สิ้นสุดแล้ว',
    news: 'ข่าวสารทัวร์นาเมนต์',
    tabs: 'สถานะทัวร์นาเมนต์',
  },
  en: {
    back: 'Back',
    current: 'Current tournaments',
    finished: 'Finished tournaments',
    empty: 'There are no active tournaments right now.',
    ended: 'Finished',
    news: 'Tournament news',
    tabs: 'Tournament status',
  },
} as const;

export default function TournamentPage() {
  const router = useRouter();
  const { locale } = useMemberLocale();
  const copy = COPY[locale];
  const [tab, setTab] = useState<TournamentTab>('current');

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/');
  };

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <div className={styles.toolbar}>
          <button type="button" className={styles.backButton} onClick={goBack}>
            <span className={styles.backIcon} aria-hidden="true">
              <svg viewBox="0 0 23 24"><path d="M0 8.5C0 4.08172 3.58172.5 8 .5h7c4.4183 0 8 3.58172 8 8v7c0 4.4183-3.5817 8-8 8H8c-4.41828 0-8-3.5817-8-8v-7Z" /><path d="M13.6542 17.1545a.75.75 0 0 1-1.06 0l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 1 1 1.06 1.06l-3.719 3.72 3.719 3.72a.75.75 0 0 1 0 1.06Z" /></svg>
            </span>
            <span>{copy.back}</span>
          </button>

          <div className={styles.controls}>
            <div className={styles.tabs} role="tablist" aria-label={copy.tabs}>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'current'}
                className={tab === 'current' ? styles.activeTab : styles.tab}
                onClick={() => setTab('current')}
              >
                {copy.current}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'finished'}
                className={tab === 'finished' ? styles.activeTab : styles.tab}
                onClick={() => setTab('finished')}
              >
                {copy.finished}
              </button>
            </div>

            <Link href="/browse/promotions?view=activity" className={styles.newsButton} aria-label={copy.news} title={copy.news}>
              <svg viewBox="0 0 40 40" aria-hidden="true">
                <rect x="7" y="7" width="26" height="26" rx="7" />
                <path d="M13 15h14M13 20h14M13 25h8" />
                <circle cx="27" cy="25" r="2" />
              </svg>
            </Link>
          </div>
        </div>

        {tab === 'current' ? (
          <section className={styles.emptyState} role="tabpanel">
            <strong>{copy.empty}</strong>
          </section>
        ) : (
          <section className={styles.finishedGrid} role="tabpanel" aria-label={copy.finished}>
            {FINISHED_TOURNAMENTS.map((title, index) => (
              <article key={title} className={styles.tournamentCard}>
                <span className={styles.cardIndex}>{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <strong>{title}</strong>
                  <small>{copy.ended}</small>
                </div>
                <span className={styles.finishedBadge}>{copy.ended}</span>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
