'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMemberSession } from '../../member-session-provider';
import { resolveLocalAssetOrSource } from '../../lib/local-asset-by-basename';
import MobileMemberEmptyState from './mobile-member-empty-state';
import styles from './mobile-member-activity-page.module.css';

export type MobileActivityContentItem = {
  id: string;
  title: string;
  image: string;
  href?: string;
  date?: string;
  disabled: boolean;
  disabledLabel?: string;
};

type MobileMemberActivityPageProps = {
  items: MobileActivityContentItem[];
  loading: boolean;
  error?: string;
  onBack: () => void;
};

const MEMBER_AUTH_OPEN_EVENT = 'member:auth-open';
const FALLBACK_ACTIVITY_IMAGE = '/assets/asset-pc/images/กิจกรรม.png';

export default function MobileMemberActivityPage({
  items,
  loading,
  error = '',
  onBack,
}: MobileMemberActivityPageProps) {
  const router = useRouter();
  const { ready, isLoggedIn } = useMemberSession();
  const activities = useMemo(() => items.map((item) => ({
    ...item,
    imageUrl: resolveLocalAssetOrSource(item.image, 'mobile') || item.image,
  })), [items]);

  const joinActivity = (activity: MobileActivityContentItem) => {
    if (activity.disabled || !activity.href) return;

    if (!ready || !isLoggedIn) {
      window.dispatchEvent(new CustomEvent(MEMBER_AUTH_OPEN_EVENT, {
        detail: { mode: 'login', next: activity.href },
      }));
      return;
    }

    if (activity.href.startsWith('/')) {
      router.push(activity.href);
      return;
    }
    window.location.assign(activity.href);
  };

  return (
    <main
      className={styles.page}
      data-mobile-member-page="activity"
      data-activity-owner="standalone"
      data-content-source="api"
      aria-busy={loading}
    >
      <header className={styles.header}>
        <button type="button" aria-label="ย้อนกลับ" onClick={onBack}><BackIcon /></button>
        <h1>กิจกรรม</h1>
        <span aria-hidden="true" />
      </header>

      <div className={styles.body}>
        <section className={styles.panel} aria-label="รายการกิจกรรม" aria-live="polite">
          {loading ? (
            <div className={styles.list} aria-label="กำลังโหลดกิจกรรม">
              {[0, 1, 2].map((index) => <span className={styles.skeletonCard} aria-hidden="true" key={index} />)}
            </div>
          ) : null}

          {!loading && error ? (
            <MobileMemberEmptyState label={error} />
          ) : null}

          {!loading && !error && activities.length === 0 ? (
            <MobileMemberEmptyState label="ยังไม่มีกิจกรรม" />
          ) : null}

          {!loading && !error && activities.length > 0 ? (
            <div className={styles.list}>
              {activities.map((activity, index) => (
                <article
                  className={`${styles.card} ${activity.disabled ? styles.cardDisabled : ''}`}
                  key={activity.id}
                  data-disabled={activity.disabled || undefined}
                >
                  <div className={styles.media}>
                    <img
                      src={activity.imageUrl || FALLBACK_ACTIVITY_IMAGE}
                      alt={activity.title}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      onError={(event) => recoverActivityImage(event.currentTarget, activity.image)}
                    />
                    {activity.disabled && activity.disabledLabel ? (
                      <span className={styles.unavailableOverlay}>
                        <span className={styles.unavailableLabel}>{activity.disabledLabel}</span>
                      </span>
                    ) : null}
                  </div>
                  <div className={styles.copy}>
                    <strong>{activity.title}</strong>
                    <span className={styles.date}>{activity.date ?? ''}</span>
                    <button
                      type="button"
                      disabled={activity.disabled || !activity.href}
                      onClick={() => joinActivity(activity)}
                    >
                      เข้าร่วม
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function recoverActivityImage(image: HTMLImageElement, sourceImageUrl: string) {
  const stage = image.dataset.activityImageFallback;
  if (!stage && sourceImageUrl && image.src !== sourceImageUrl) {
    image.dataset.activityImageFallback = 'source';
    image.src = sourceImageUrl;
    return;
  }
  image.dataset.activityImageFallback = 'generic';
  image.src = FALLBACK_ACTIVITY_IMAGE;
}

function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.825 13 13.425 18.6 12 20l-8-8 8-8 1.425 1.4L7.825 11H20v2H7.825Z" fill="currentColor" />
    </svg>
  );
}
