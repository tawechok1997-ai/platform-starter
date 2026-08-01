'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { memberApiFetch } from '../../../member-api';
import { useMemberSession } from '../../../member-session-provider';
import styles from './mobile-tournament-page.module.css';

const MEMBER_AUTH_OPEN_EVENT = 'member:auth-open';
const TOURNAMENT_NEWS_EVENT = 'member:tournament-news-open';
const MOBILE_TOURNAMENT_ROUTE = '/mobile/member/tournament';

type TournamentTab = 'current' | 'ended';
type LoadState = 'idle' | 'loading' | 'ready' | 'error';

type TournamentItem = {
  id: string;
  name: string;
  status: string;
  startsAt: string;
  endsAt: string;
};

type TournamentPayload = {
  items?: unknown[];
};

export default function MobileTournamentPage() {
  const router = useRouter();
  const { ready, isLoggedIn } = useMemberSession();
  const [activeTab, setActiveTab] = useState<TournamentTab>('current');
  const [items, setItems] = useState<TournamentItem[]>([]);
  const [loadState, setLoadState] = useState<LoadState>('idle');

  useEffect(() => {
    if (!ready) return;

    if (!isLoggedIn) {
      window.dispatchEvent(new CustomEvent(MEMBER_AUTH_OPEN_EVENT, {
        detail: { mode: 'login', next: MOBILE_TOURNAMENT_ROUTE },
      }));
      return;
    }

    const controller = new AbortController();
    setLoadState('loading');

    void memberApiFetch('/games/tournaments', {
      cache: 'no-store',
      signal: controller.signal,
      suppressSessionExpiryRedirect: true,
    }).then(async (response) => {
      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent(MEMBER_AUTH_OPEN_EVENT, {
          detail: { mode: 'login', next: MOBILE_TOURNAMENT_ROUTE },
        }));
        return;
      }

      if (!response.ok) throw new Error(`tournaments: ${response.status}`);
      const payload = await response.json().catch(() => null) as TournamentPayload | null;
      if (!controller.signal.aborted) {
        setItems(normalizeTournaments(payload));
        setLoadState('ready');
      }
    }).catch(() => {
      if (!controller.signal.aborted) setLoadState('error');
    });

    return () => controller.abort();
  }, [isLoggedIn, ready]);

  const visibleItems = useMemo(() => items.filter((item) => (
    activeTab === 'ended' ? isEnded(item.status) : !isEnded(item.status)
  )), [activeTab, items]);

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/');
  };

  const emptyMessage = activeTab === 'current'
    ? 'ยังไม่มีรายการทัวร์นาเมนต์ในขณะนี้'
    : 'ยังไม่มีรายการทัวร์นาเมนต์ที่จบลงแล้ว';

  const statusMessage = !ready || !isLoggedIn || loadState === 'idle' || loadState === 'loading'
    ? 'กำลังโหลดข้อมูลทัวร์นาเมนต์...'
    : loadState === 'error'
      ? 'ไม่สามารถโหลดข้อมูลทัวร์นาเมนต์ได้'
      : emptyMessage;

  return (
    <main className={styles.page} data-mobile-member-page="tournament">
      <header className={styles.header}>
        <button type="button" aria-label="ย้อนกลับ" onClick={goBack}>
          <BackIcon />
        </button>
        <h1>ทัวร์นาเมนต์</h1>
        <button
          type="button"
          className={styles.newsButton}
          aria-label="ข่าวสารทัวร์นาเมนต์"
          onClick={() => window.dispatchEvent(new CustomEvent(TOURNAMENT_NEWS_EVENT))}
        >
          <TournamentNewsIcon />
        </button>
      </header>

      <div className={styles.body}>
        <div className={styles.tabWrap}>
          <div className={styles.tabs} role="tablist" aria-label="ประเภททัวร์นาเมนต์">
            <button
              type="button"
              role="tab"
              className={activeTab === 'current' ? styles.tabActive : styles.tab}
              aria-selected={activeTab === 'current'}
              onClick={() => setActiveTab('current')}
            >
              ทัวร์นาเมนต์ขณะนี้
            </button>
            <button
              type="button"
              role="tab"
              className={activeTab === 'ended' ? styles.tabActive : styles.tab}
              aria-selected={activeTab === 'ended'}
              onClick={() => setActiveTab('ended')}
            >
              ทัวร์นาเมนต์ที่จบลงแล้ว
            </button>
          </div>
        </div>

        <section className={styles.content} aria-live="polite" aria-busy={loadState === 'loading'}>
          {loadState === 'ready' && isLoggedIn && visibleItems.length > 0 ? (
            <div className={styles.list}>
              {visibleItems.map((item) => (
                <article className={styles.card} key={item.id} id={`tournament-${item.id}`}>
                  <strong>{item.name}</strong>
                  <span>{displayStatus(item.status)}</span>
                  {item.startsAt || item.endsAt ? (
                    <small>{formatTournamentRange(item.startsAt, item.endsAt)}</small>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className={styles.state} role="status">{statusMessage}</div>
          )}
        </section>
      </div>
    </main>
  );
}

function normalizeTournaments(payload: TournamentPayload | null): TournamentItem[] {
  if (!Array.isArray(payload?.items)) return [];

  return payload.items.flatMap((value, index) => {
    const item = record(value);
    const name = text(item.name, text(item.title, ''));
    if (!name) return [];

    return [{
      id: text(item.id, `tournament-${index + 1}`),
      name,
      status: text(item.status, 'ACTIVE'),
      startsAt: text(item.startsAt, text(item.startDate, '')),
      endsAt: text(item.endsAt, text(item.endDate, '')),
    }];
  });
}

function isEnded(status: string) {
  return ['ENDED', 'FINISHED', 'COMPLETED', 'CLOSED'].includes(status.trim().toUpperCase());
}

function displayStatus(status: string) {
  const value = status.trim().toUpperCase();
  if (value === 'ACTIVE') return 'กำลังแข่งขัน';
  if (value === 'SCHEDULED') return 'เร็ว ๆ นี้';
  if (isEnded(value)) return 'สิ้นสุดแล้ว';
  return status || 'กำลังแข่งขัน';
}

function formatTournamentRange(startsAt: string, endsAt: string) {
  const start = formatDateTime(startsAt);
  const end = formatDateTime(endsAt);
  if (start && end) return `${start} - ${end}`;
  return start || end;
}

function formatDateTime(value: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function text(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function BackIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.825 13 13.425 18.6 12 20l-8-8 8-8 1.425 1.4L7.825 11H20v2H7.825Z" fill="currentColor" />
    </svg>
  );
}

function TournamentNewsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 7.5h10.5M5 12h8M5 16.5h6" stroke="#dba3f4" strokeWidth="1.6" strokeLinecap="round" />
      <path d="m15.5 8 3-2v12l-3-2V8Z" fill="#3b9bc0" stroke="#dba3f4" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M7 6 5.5 4.5M10 5V3" stroke="#3b9bc0" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
