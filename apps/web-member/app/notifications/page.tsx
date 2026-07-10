'use client';

import { useEffect, useMemo, useState } from 'react';
import { MemberButton, MemberCard, MemberEmptyState } from '../components/member-ui';
import './member-notifications.css';

type NotificationType = 'finance' | 'security' | 'promotion' | 'system';
type NotificationFilter = 'all' | NotificationType;

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  createdAt: string;
  read: boolean;
  href?: string;
};

const STORAGE_KEY = 'member_notifications_cache_v1';
const filterOptions: Array<{ key: NotificationFilter; label: string }> = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'finance', label: 'การเงิน' },
  { key: 'security', label: 'ความปลอดภัย' },
  { key: 'promotion', label: 'โปรโมชั่น' },
  { key: 'system', label: 'ระบบ' },
];

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : [];
      setItems(Array.isArray(parsed) ? parsed.filter(isNotificationItem) : []);
    } catch {
      setItems([]);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items]);
  const visibleItems = useMemo(() => filter === 'all' ? items : items.filter((item) => item.type === filter), [filter, items]);

  function markAllRead() {
    setItems((current) => current.map((item) => ({ ...item, read: true })));
  }

  function markRead(id: string) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, read: true } : item));
  }

  function archive(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  return <main className="member-feature-page member-notifications-page">
    <div className="member-feature-container">
      <header className="member-feature-header member-notifications-header">
        <div>
          <p>ศูนย์ข้อความ</p>
          <h1>การแจ้งเตือน</h1>
          <span>ติดตามรายการเงิน ความปลอดภัย โปรโมชั่น และประกาศระบบ</span>
        </div>
        <MemberButton onClick={markAllRead} disabled={!ready || unreadCount === 0}>อ่านทั้งหมดแล้ว</MemberButton>
      </header>

      <section className="member-notification-summary" aria-label="สรุปการแจ้งเตือน">
        <MemberCard><span>ยังไม่อ่าน</span><strong>{unreadCount}</strong></MemberCard>
        <MemberCard><span>ทั้งหมด</span><strong>{items.length}</strong></MemberCard>
        <MemberCard><span>การเงิน</span><strong>{items.filter((item) => item.type === 'finance').length}</strong></MemberCard>
      </section>

      <section className="member-notification-filters" aria-label="ตัวกรองการแจ้งเตือน">
        {filterOptions.map((option) => <button key={option.key} type="button" aria-pressed={filter === option.key} onClick={() => setFilter(option.key)}>{option.label}</button>)}
      </section>

      <MemberCard className="member-notification-list">
        {!ready
          ? <p role="status">กำลังโหลดการแจ้งเตือน...</p>
          : visibleItems.length === 0
            ? <MemberEmptyState title={items.length === 0 ? 'ยังไม่มีการแจ้งเตือน' : 'ไม่พบการแจ้งเตือนในหมวดนี้'} description={items.length === 0 ? 'เมื่อมีรายการเงิน ข่าวสาร หรือเหตุการณ์ด้านความปลอดภัย ระบบจะแสดงไว้ที่นี่' : 'ลองเลือกตัวกรองอื่นเพื่อดูข้อความที่มีอยู่'} />
            : visibleItems.map((item) => <article key={item.id} className={item.read ? 'is-read' : 'is-unread'}>
              <div className={`member-notification-icon member-notification-icon--${item.type}`} aria-hidden="true">•</div>
              <div><strong>{item.title}</strong><p>{item.description}</p><time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time></div>
              <div className="member-notification-actions">
                {item.href && <a href={item.href}>เปิดดู</a>}
                {!item.read && <button type="button" onClick={() => markRead(item.id)}>อ่านแล้ว</button>}
                <button type="button" onClick={() => archive(item.id)}>เก็บถาวร</button>
              </div>
            </article>)}
      </MemberCard>
    </div>
  </main>;
}

function isNotificationItem(value: unknown): value is NotificationItem {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<NotificationItem>;
  return typeof item.id === 'string'
    && typeof item.title === 'string'
    && typeof item.description === 'string'
    && typeof item.createdAt === 'string'
    && typeof item.read === 'boolean'
    && ['finance', 'security', 'promotion', 'system'].includes(item.type ?? '');
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('th-TH');
}
