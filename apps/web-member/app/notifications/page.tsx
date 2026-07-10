'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MemberButton, MemberCard, MemberEmptyState, MemberNotice } from '../components/member-ui';
import { memberApiFetch } from '../member-api';
import './member-notifications.css';

type NotificationType = 'finance' | 'security' | 'promotion' | 'system';
type NotificationFilter = 'all' | NotificationType;

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  createdAt: string;
  href?: string;
};

type NotificationResponse = {
  items?: NotificationItem[];
};

type NotificationState = {
  readIds: string[];
  archivedIds: string[];
};

type ViewItem = NotificationItem & { read: boolean };

const STORAGE_KEY = 'member_notifications_state_v2';
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
  const [state, setState] = useState<NotificationState>({ readIds: [], archivedIds: [] });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');
    try {
      const response = await memberApiFetch('/member/notifications');
      const payload = await response.json().catch(() => null) as NotificationResponse | { message?: string } | null;
      if (!response.ok) {
        setMessage(payload && 'message' in payload && typeof payload.message === 'string' ? payload.message : 'โหลดการแจ้งเตือนไม่สำเร็จ');
        return;
      }
      const nextItems = payload && 'items' in payload && Array.isArray(payload.items)
        ? payload.items.filter(isNotificationItem)
        : [];
      setItems(nextItems);
    } catch {
      setMessage('เชื่อมต่อระบบแจ้งเตือนไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      const parsed = stored ? JSON.parse(stored) : null;
      if (parsed && typeof parsed === 'object') {
        setState({
          readIds: Array.isArray(parsed.readIds) ? parsed.readIds.filter((value: unknown): value is string => typeof value === 'string') : [],
          archivedIds: Array.isArray(parsed.archivedIds) ? parsed.archivedIds.filter((value: unknown): value is string => typeof value === 'string') : [],
        });
      }
    } catch {
      setState({ readIds: [], archivedIds: [] });
    }
    void load();
  }, [load]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const viewItems = useMemo<ViewItem[]>(() => items
    .filter((item) => !state.archivedIds.includes(item.id))
    .map((item) => ({ ...item, read: state.readIds.includes(item.id) })), [items, state]);
  const unreadCount = useMemo(() => viewItems.filter((item) => !item.read).length, [viewItems]);
  const visibleItems = useMemo(() => filter === 'all' ? viewItems : viewItems.filter((item) => item.type === filter), [filter, viewItems]);

  function markAllRead() {
    setState((current) => ({ ...current, readIds: Array.from(new Set([...current.readIds, ...viewItems.map((item) => item.id)])) }));
  }

  function markRead(id: string) {
    setState((current) => ({ ...current, readIds: current.readIds.includes(id) ? current.readIds : [...current.readIds, id] }));
  }

  function archive(id: string) {
    setState((current) => ({ ...current, archivedIds: current.archivedIds.includes(id) ? current.archivedIds : [...current.archivedIds, id] }));
  }

  return <main className="member-feature-page member-notifications-page">
    <div className="member-feature-container">
      <header className="member-feature-header member-notifications-header">
        <div>
          <p>ศูนย์ข้อความ</p>
          <h1>การแจ้งเตือน</h1>
          <span>ติดตามรายการเงิน ความปลอดภัย และสถานะการช่วยเหลือจากข้อมูลจริงของบัญชี</span>
        </div>
        <div className="member-notification-header-actions">
          <MemberButton onClick={() => void load()} disabled={loading} tone="default">{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</MemberButton>
          <MemberButton onClick={markAllRead} disabled={loading || unreadCount === 0}>อ่านทั้งหมดแล้ว</MemberButton>
        </div>
      </header>

      {message && <MemberNotice tone="warning">{message}</MemberNotice>}

      <section className="member-notification-summary" aria-label="สรุปการแจ้งเตือน">
        <MemberCard><span>ยังไม่อ่าน</span><strong>{unreadCount}</strong></MemberCard>
        <MemberCard><span>ทั้งหมด</span><strong>{viewItems.length}</strong></MemberCard>
        <MemberCard><span>การเงิน</span><strong>{viewItems.filter((item) => item.type === 'finance').length}</strong></MemberCard>
      </section>

      <section className="member-notification-filters" aria-label="ตัวกรองการแจ้งเตือน">
        {filterOptions.map((option) => <button key={option.key} type="button" aria-pressed={filter === option.key} onClick={() => setFilter(option.key)}>{option.label}</button>)}
      </section>

      <MemberCard className="member-notification-list">
        {loading && items.length === 0
          ? <p role="status">กำลังโหลดการแจ้งเตือน...</p>
          : visibleItems.length === 0
            ? <MemberEmptyState title={viewItems.length === 0 ? 'ยังไม่มีการแจ้งเตือน' : 'ไม่พบการแจ้งเตือนในหมวดนี้'} description={viewItems.length === 0 ? 'เมื่อรายการเงิน ความปลอดภัย หรือ ticket มีความเคลื่อนไหว ระบบจะแสดงไว้ที่นี่' : 'ลองเลือกตัวกรองอื่นเพื่อดูข้อความที่มีอยู่'} />
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
    && ['finance', 'security', 'promotion', 'system'].includes(item.type ?? '');
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('th-TH');
}
