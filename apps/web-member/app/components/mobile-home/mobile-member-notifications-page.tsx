'use client';

import { useMemo, useState } from 'react';
import MobileMemberEmptyState from './mobile-member-empty-state';
import styles from './mobile-member-notifications-page.module.css';

type Props = {
  payload: unknown;
  loading: boolean;
  error: string;
  onBack: () => void;
  onRefresh: () => void;
};

type UnknownRecord = Record<string, unknown>;
type Tab = 'all' | 'privilege' | 'message';

type NotificationItem = {
  id: string;
  tab: Exclude<Tab, 'all'>;
  title: string;
  message: string;
  createdAt: string;
  unread: boolean;
};

const TABS: ReadonlyArray<{ id: Tab; label: string }> = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'privilege', label: 'สิทธิพิเศษ' },
  { id: 'message', label: 'ข้อความ' },
];

export default function MobileMemberNotificationsPage({ payload, loading, error, onBack, onRefresh }: Props) {
  const [tab, setTab] = useState<Tab>('all');
  const items = useMemo(() => normalizeNotifications(payload), [payload]);
  const filtered = useMemo(
    () => tab === 'all' ? items : items.filter((item) => item.tab === tab),
    [items, tab],
  );

  return (
    <main className={styles.page} data-mobile-member-page="notifications">
      <header className={styles.header}>
        <button type="button" aria-label="ย้อนกลับ" onClick={onBack}><BackIcon /></button>
        <h1>การแจ้งเตือน</h1>
      </header>

      <nav className={styles.tabs} aria-label="ประเภทการแจ้งเตือน">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={tab === item.id ? styles.activeTab : ''}
            aria-pressed={tab === item.id}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <section className={styles.content} aria-busy={loading}>
        {loading ? <LoadingState /> : null}
        {!loading && error ? <ErrorState message={error} onRetry={onRefresh} /> : null}
        {!loading && !error && filtered.length === 0 ? (
          <MobileMemberEmptyState className={styles.emptyState} label="ไม่มีข้อความใหม่" />
        ) : null}
        {!loading && !error && filtered.length > 0 ? (
          <div className={styles.list}>
            {filtered.map((item) => {
              const date = parseDate(item.createdAt);
              return (
                <article className={styles.card} key={item.id} data-unread={item.unread ? 'true' : 'false'}>
                  <span className={styles.icon} aria-hidden="true">
                    {item.tab === 'privilege' ? <GiftIcon /> : <MessageIcon />}
                  </span>
                  <div className={styles.copy}>
                    <div className={styles.cardHeader}>
                      <strong>{item.title}</strong>
                      <time dateTime={item.createdAt}>{date}</time>
                    </div>
                    <p>{item.message}</p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function normalizeNotifications(payload: unknown): NotificationItem[] {
  return arrayFromPayload(payload).map((value, index) => {
    const item = asRecord(value) ?? {};
    const rawType = firstString(item.type, item.category, item.kind, item.channel, '').toUpperCase();
    const tab = rawType.includes('PROMO')
      || rawType.includes('BONUS')
      || rawType.includes('PRIVILEGE')
      || rawType.includes('REWARD')
      ? 'privilege'
      : 'message';
    return {
      id: firstString(item.id, item.notificationId, String(index)),
      tab,
      title: firstString(item.title, item.subject, item.name, tab === 'privilege' ? 'สิทธิพิเศษ' : 'ข้อความแจ้งเตือน'),
      message: stripHtml(firstString(item.message, item.body, item.description, item.content, '')),
      createdAt: firstString(item.createdAt, item.publishedAt, item.updatedAt, ''),
      unread: item.readAt == null && item.isRead !== true && item.read !== true,
    };
  });
}

function arrayFromPayload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  const root = asRecord(payload);
  const data = asRecord(root?.data) ?? root;
  for (const key of ['items', 'notifications', 'results', 'data']) {
    const value = data?.[key];
    if (Array.isArray(value)) return value;
  }
  return [];
}

function parseDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('th-TH', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className={styles.errorState}><span>{message}</span><button type="button" onClick={onRetry}>ลองใหม่</button></div>;
}

function LoadingState() {
  return <div className={styles.loadingState}><span />กำลังโหลดข้อมูล...</div>;
}

function BackIcon() {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M7.825 13 13.425 18.6 12 20 4 12l8-8 1.425 1.4L7.825 11H20v2H7.825Z" fill="currentColor" /></svg>;
}

function GiftIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 10h14v10H5V10ZM4 6h16v4H4V6Zm8 0v14M9.5 6C8.1 6 7 5.1 7 4s.9-2 2-2c1.5 0 2.6 1.6 3 4H9.5Zm5 0c1.4 0 2.5-.9 2.5-2s-.9-2-2-2c-1.5 0-2.6 1.6-3 4h2.5Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>;
}

function MessageIcon() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5.5h16v11H9l-5 4v-15Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /><path d="M8 9h8M8 12.5h5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /></svg>;
}

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : null;
}

function firstString(...values: unknown[]) {
  for (const value of values) if (typeof value === 'string' && value.trim()) return value.trim();
  return '';
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
