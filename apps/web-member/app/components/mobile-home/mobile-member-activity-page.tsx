'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useMemberSession } from '../../member-session-provider';
import {
  extractAssetBasename,
  resolveLocalAssetByBasename,
} from '../../lib/local-asset-by-basename';
import styles from './mobile-member-activity-page.module.css';

export type MobileActivityContentItem = {
  id: string;
  title: string;
  image: string;
  href: string;
};

type MobileMemberActivityPageProps = {
  items: MobileActivityContentItem[];
  loading: boolean;
  onBack: () => void;
};

type SourceActivity = {
  id: string;
  title: string;
  date: string;
  sourceImageUrl: string;
};

const MEMBER_AUTH_OPEN_EVENT = 'member:auth-open';
const MEMBER_ACTIVITY_JOIN_EVENT = 'member:activity-join';
const ACTIVITY_ROUTE = '/mobile/member/activity';
const FALLBACK_ACTIVITY_IMAGE = '/assets/asset-pc/images/กิจกรรม.png';

const SOURCE_ACTIVITIES: readonly SourceActivity[] = [
  {
    id: 'daily-mission',
    title: 'ภารกิจ',
    date: '',
    sourceImageUrl: 'https://cdn.zabbet.com/event/predict/1785515180099-ffe2dd0b-23d8-41c3-964e-25368bc2188d.jpeg',
  },
  {
    id: 'lottery-prediction',
    title: 'ทายผลหวย',
    date: '2026-08-01',
    sourceImageUrl: 'https://cdn.zabbet.com/event/predict/1784904726144-c10c3ca6-cf70-41d3-a763-aa33c8917b2d.jpeg',
  },
  {
    id: 'turnover-reward',
    title: 'ทำยอด Turn รับรางวัลจุใจ',
    date: '',
    sourceImageUrl: 'https://cdn.zabbet.com/event/predict/1719130004352-5323a6c4-0ad4-4cda-8475-dd0f5701b61b.png',
  },
] as const;

export default function MobileMemberActivityPage({
  items,
  loading,
  onBack,
}: MobileMemberActivityPageProps) {
  const router = useRouter();
  const { ready, isLoggedIn } = useMemberSession();
  const activities = useMemo(() => buildSourceActivities(items), [items]);

  const joinActivity = (activity: ReturnType<typeof buildSourceActivities>[number]) => {
    if (!ready || !isLoggedIn) {
      window.dispatchEvent(new CustomEvent(MEMBER_AUTH_OPEN_EVENT, {
        detail: { mode: 'login', next: ACTIVITY_ROUTE },
      }));
      return;
    }

    if (activity.href.startsWith('/') && activity.href !== ACTIVITY_ROUTE) {
      router.push(activity.href);
      return;
    }

    window.dispatchEvent(new CustomEvent(MEMBER_ACTIVITY_JOIN_EVENT, {
      detail: { id: activity.id, title: activity.title },
    }));
  };

  return (
    <main
      className={styles.page}
      data-mobile-member-page="activity"
      aria-busy={loading}
    >
      <header className={styles.header}>
        <button type="button" aria-label="ย้อนกลับ" onClick={onBack}>
          <BackIcon />
        </button>
        <h1>กิจกรรม</h1>
      </header>

      <div className={styles.body}>
        <section className={styles.panel} aria-label="รายการกิจกรรม">
          <div className={styles.list}>
            {activities.map((activity, index) => (
              <article className={styles.card} key={activity.id}>
                <div className={styles.media}>
                  <img
                    src={activity.imageUrl}
                    alt={activity.title}
                    loading={index === 0 ? 'eager' : 'lazy'}
                    onError={(event) => recoverActivityImage(event.currentTarget, activity.sourceImageUrl)}
                  />
                </div>

                <div className={styles.copy}>
                  <strong>{activity.title}</strong>
                  <span>{activity.date}</span>
                  <button type="button" onClick={() => joinActivity(activity)}>
                    เข้าร่วม
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function buildSourceActivities(items: MobileActivityContentItem[]) {
  const byBasename = new Map<string, MobileActivityContentItem>();
  const byTitle = new Map<string, MobileActivityContentItem>();

  for (const item of items) {
    const basename = extractAssetBasename(item.image).toLowerCase();
    if (basename) byBasename.set(basename, item);
    byTitle.set(normalizeTitle(item.title), item);
  }

  return SOURCE_ACTIVITIES.map((source) => {
    const basename = extractAssetBasename(source.sourceImageUrl).toLowerCase();
    const matched = byBasename.get(basename) ?? byTitle.get(normalizeTitle(source.title));
    const localImage = resolveLocalAssetByBasename(source.sourceImageUrl, 'pc')
      || resolveLocalAssetByBasename(source.sourceImageUrl, 'mobile');

    return {
      ...source,
      imageUrl: localImage || source.sourceImageUrl,
      href: matched?.href || ACTIVITY_ROUTE,
    };
  });
}

function recoverActivityImage(image: HTMLImageElement, sourceImageUrl: string) {
  const stage = image.dataset.activityImageFallback;

  if (!stage) {
    image.dataset.activityImageFallback = 'cdn';
    image.src = sourceImageUrl;
    return;
  }

  if (stage === 'cdn') {
    image.dataset.activityImageFallback = 'generic';
    image.src = FALLBACK_ACTIVITY_IMAGE;
  }
}

function normalizeTitle(value: string) {
  return value.replace(/\s+/g, ' ').trim().toLowerCase();
}

function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.825 13 13.425 18.6 12 20l-8-8 8-8 1.425 1.4L7.825 11H20v2H7.825Z" fill="currentColor" />
    </svg>
  );
}
