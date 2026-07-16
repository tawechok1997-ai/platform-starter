'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { MemberButton, MemberCard, MemberEmptyState, MemberNotice } from '../components/member-ui';
import { MemberIcon } from '../components/member-icon';
import { memberApiFetch } from '../member-api';
import './member-notifications.css';

type NotificationType = 'finance' | 'security' | 'promotion' | 'system';
type NotificationFilter = 'all' | NotificationType;
type NotificationCategories = Record<NotificationType, boolean>;
type NotificationChannels = { email: boolean; sms: boolean; push: boolean };
type NotificationPreferences = { categories: NotificationCategories; channels: NotificationChannels };

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  createdAt: string;
  href?: string;
  isRead?: boolean;
};

type NotificationResponse = {
  items?: NotificationItem[];
  preferences?: NotificationPreferences;
};

const DEFAULT_PREFERENCES: NotificationPreferences = {
  categories: { finance: true, security: true, promotion: true, system: true },
  channels: { email: true, sms: false, push: true },
};

const filterOptions: Array<{ key: NotificationFilter; label: string }> = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'finance', label: 'การเงิน' },
  { key: 'security', label: 'ความปลอดภัย' },
  { key: 'promotion', label: 'โปรโมชั่น' },
  { key: 'system', label: 'ระบบ' },
];

const categoryLabels: Record<NotificationType, string> = {
  finance: 'รายการเงิน',
  security: 'ความปลอดภัย',
  promotion: 'โปรโมชั่น',
  system: 'ระบบและบริการ',
};

const channelLabels: Record<keyof NotificationChannels, { title: string; description: string }> = {
  email: { title: 'อีเมล', description: 'รับข้อความสำคัญทางอีเมลที่ยืนยันไว้' },
  sms: { title: 'SMS', description: 'รับข้อความสั้นสำหรับเหตุการณ์เร่งด่วน' },
  push: { title: 'Push', description: 'รับการแจ้งเตือนบนอุปกรณ์และเบราว์เซอร์' },
};

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [savingPreferences, setSavingPreferences] = useState(false);
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
      if (payload && 'preferences' in payload && isPreferences(payload.preferences)) {
        setPreferences(payload.preferences);
      }
    } catch {
      setMessage('เชื่อมต่อระบบแจ้งเตือนไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const unreadCount = useMemo(() => items.filter((item) => !item.isRead).length, [items]);
  const visibleItems = useMemo(() => filter === 'all' ? items : items.filter((item) => item.type === filter), [filter, items]);

  async function markAllRead() {
    const previous = items;
    setItems((current) => current.map((item) => ({ ...item, isRead: true })));
    try {
      const response = await memberApiFetch('/member/notifications/read-all', { method: 'PATCH' });
      if (!response.ok) throw new Error('mark-all-read failed');
    } catch {
      setItems(previous);
      setMessage('บันทึกสถานะอ่านทั้งหมดไม่สำเร็จ');
    }
  }

  async function markRead(id: string) {
    const previous = items;
    setItems((current) => current.map((item) => item.id === id ? { ...item, isRead: true } : item));
    try {
      const response = await memberApiFetch(`/member/notifications/${encodeURIComponent(id)}/read`, { method: 'PATCH' });
      if (!response.ok) throw new Error('mark-read failed');
    } catch {
      setItems(previous);
      setMessage('บันทึกสถานะอ่านไม่สำเร็จ');
    }
  }

  async function archive(id: string) {
    const previous = items;
    setItems((current) => current.filter((item) => item.id !== id));
    try {
      const response = await memberApiFetch(`/member/notifications/${encodeURIComponent(id)}/archive`, { method: 'PATCH' });
      if (!response.ok) throw new Error('archive failed');
    } catch {
      setItems(previous);
      setMessage('เก็บการแจ้งเตือนไม่สำเร็จ');
    }
  }

  async function updatePreference(key: NotificationType | keyof NotificationChannels, value: boolean) {
    const previous = preferences;
    const isCategory = key in preferences.categories;
    const next: NotificationPreferences = isCategory
      ? { ...preferences, categories: { ...preferences.categories, [key]: value } }
      : { ...preferences, channels: { ...preferences.channels, [key]: value } };
    setPreferences(next);
    setSavingPreferences(true);
    setMessage('');
    try {
      const response = await memberApiFetch('/member/notifications/preferences', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ [key]: value }),
      });
      const payload = await response.json().catch(() => null) as { preferences?: NotificationPreferences; message?: string } | null;
      if (!response.ok) throw new Error(payload?.message ?? 'save preference failed');
      if (payload?.preferences && isPreferences(payload.preferences)) setPreferences(payload.preferences);
      if (isCategory) await load();
    } catch {
      setPreferences(previous);
      setMessage('บันทึกการตั้งค่าแจ้งเตือนไม่สำเร็จ');
    } finally {
      setSavingPreferences(false);
    }
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
          <MemberButton onClick={() => void markAllRead()} disabled={loading || unreadCount === 0}>อ่านทั้งหมดแล้ว</MemberButton>
        </div>
      </header>

      {message && <MemberNotice tone="warning"><span role="status">{message}</span></MemberNotice>}

      <section className="member-notification-summary" aria-label="สรุปการแจ้งเตือน">
        <MemberCard><span>ยังไม่อ่าน</span><strong>{unreadCount}</strong></MemberCard>
        <MemberCard><span>ทั้งหมด</span><strong>{items.length}</strong></MemberCard>
        <MemberCard><span>การเงิน</span><strong>{items.filter((item) => item.type === 'finance').length}</strong></MemberCard>
      </section>

      <MemberCard className="member-notification-preferences">
        <div className="member-notification-preference-heading">
          <div><span>การตั้งค่า</span><h2>เลือกสิ่งที่ต้องการรับ</h2></div>
          {savingPreferences && <small role="status">กำลังบันทึก...</small>}
        </div>
        <div className="member-notification-preference-grid">
          <fieldset>
            <legend>หมวดการแจ้งเตือน</legend>
            {(Object.keys(categoryLabels) as NotificationType[]).map((key) => <PreferenceToggle
              key={key}
              title={categoryLabels[key]}
              checked={preferences.categories[key]}
              disabled={savingPreferences}
              onChange={(checked) => void updatePreference(key, checked)}
            />)}
          </fieldset>
          <fieldset>
            <legend>ช่องทาง</legend>
            {(Object.keys(channelLabels) as Array<keyof NotificationChannels>).map((key) => <PreferenceToggle
              key={key}
              title={channelLabels[key].title}
              description={channelLabels[key].description}
              checked={preferences.channels[key]}
              disabled={savingPreferences}
              onChange={(checked) => void updatePreference(key, checked)}
            />)}
          </fieldset>
        </div>
      </MemberCard>

      <section className="member-notification-filters" aria-label="ตัวกรองการแจ้งเตือน">
        {filterOptions.map((option) => <button key={option.key} type="button" aria-pressed={filter === option.key} onClick={() => setFilter(option.key)}>{option.label}</button>)}
      </section>

      <MemberCard className="member-notification-list">
        {loading && items.length === 0
          ? <p role="status" aria-live="polite">กำลังโหลดการแจ้งเตือน...</p>
          : visibleItems.length === 0
            ? <MemberEmptyState title={items.length === 0 ? 'ยังไม่มีการแจ้งเตือน' : 'ไม่พบการแจ้งเตือนในหมวดนี้'} description={items.length === 0 ? 'เมื่อรายการเงิน ความปลอดภัย หรือ ticket มีความเคลื่อนไหว ระบบจะแสดงไว้ที่นี่' : 'ลองเลือกตัวกรองอื่นเพื่อดูข้อความที่มีอยู่'} />
            : visibleItems.map((item) => {
              const titleId = `notification-${item.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
              return <article key={item.id} className={item.isRead ? 'is-read' : 'is-unread'} aria-labelledby={titleId}>
                <div className={`member-notification-icon member-notification-icon--${item.type}`} aria-hidden="true"><MemberIcon name={notificationIconByType[item.type]} /></div>
                <div><strong id={titleId}>{item.title}</strong><p>{item.description}</p><time dateTime={item.createdAt}>{formatDate(item.createdAt)}</time></div>
                <div className="member-notification-actions" aria-label={`การทำงานสำหรับ ${item.title}`}>
                  {item.href && <a href={item.href} aria-label={`เปิดดู ${item.title}`}>เปิดดู</a>}
                  {!item.isRead && <button type="button" onClick={() => void markRead(item.id)} aria-label={`ทำเครื่องหมายว่าอ่านแล้ว: ${item.title}`}>อ่านแล้ว</button>}
                  <button type="button" onClick={() => void archive(item.id)} aria-label={`เก็บถาวร: ${item.title}`}>เก็บถาวร</button>
                </div>
              </article>;
            })}
      </MemberCard>
    </div>
  </main>;
}

const notificationIconByType: Record<NotificationType, 'wallet' | 'profile' | 'promotion' | 'notification'> = {
  finance: 'wallet',
  security: 'profile',
  promotion: 'promotion',
  system: 'notification',
};

function PreferenceToggle({ title, description, checked, disabled, onChange }: {
  title: string;
  description?: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  return <label className="member-notification-toggle">
    <span><strong>{title}</strong>{description && <small>{description}</small>}</span>
    <input type="checkbox" checked={checked} disabled={disabled} onChange={(event) => onChange(event.target.checked)} />
    <i aria-hidden="true" />
  </label>;
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

function isPreferences(value: unknown): value is NotificationPreferences {
  if (!value || typeof value !== 'object') return false;
  const preference = value as Partial<NotificationPreferences>;
  return Boolean(preference.categories && preference.channels)
    && ['finance', 'security', 'promotion', 'system'].every((key) => typeof preference.categories?.[key as NotificationType] === 'boolean')
    && ['email', 'sms', 'push'].every((key) => typeof preference.channels?.[key as keyof NotificationChannels] === 'boolean');
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('th-TH');
}
