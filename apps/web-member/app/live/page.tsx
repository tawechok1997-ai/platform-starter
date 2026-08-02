'use client';

import Link from 'next/link';
import { LIVE_SERVICE_COPY, LIVE_SERVICE_STATUS } from '../lib/live-service-status';
import { useMemberLocale } from '../member-locale-provider';
import styles from './live-maintenance.module.css';

export default function LiveMaintenancePage() {
  const { locale } = useMemberLocale();
  const copy = LIVE_SERVICE_COPY[locale];

  return (
    <main
      className={styles.page}
      data-live-maintenance
      data-live-service-status={LIVE_SERVICE_STATUS.mode}
    >
      <section className={styles.card} role="status" aria-live="polite">
        <img
          className={styles.logo}
          src="/assets/asset-pc/images/live/logo_live.webp"
          alt="Live"
        />

        <span className={styles.icon} aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none">
            <path d="M17 8h14M24 8v7M11 18h26a5 5 0 0 1 5 5v14a5 5 0 0 1-5 5H11a5 5 0 0 1-5-5V23a5 5 0 0 1 5-5Z" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
            <path d="m20 25 9 5-9 5V25Z" fill="currentColor" />
            <path d="M10 12 5 7M38 12l5-5" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
        </span>

        <span className={styles.badge}>
          <i className={styles.dot} aria-hidden="true" />
          {copy.badge}
        </span>
        <h1 className={styles.title}>{copy.title}</h1>
        <p className={styles.description}>{copy.description}</p>

        <div className={styles.actions}>
          <Link className={styles.primary} href="/">{copy.home}</Link>
          <Link className={styles.secondary} href="/browse/games?category=sport">{copy.sport}</Link>
        </div>
      </section>
    </main>
  );
}
