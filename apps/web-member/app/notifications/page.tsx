'use client';

import { useMemo, useState } from 'react';
import { MemberButton, MemberCard, MemberEmptyState } from '../components/member-ui';
import './member-notifications.css';

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  type: 'finance' | 'security' | 'promotion' | 'system';
  createdAt: string;
  read: boolean;
};

const seedItems: NotificationItem[] = [];

export default function NotificationsPage() {
  const [items, setItems] = useState(seedItems);
  const unreadCount = useMemo(() => items.filter((item) => !item.read).length, [items]);

  function markAllRead() {
    setItems((current) => current.map((item) => ({ ...item, read: true })));
  }

  return <main className="member-feature-page member-notifications-page">
    <div className="member-feature-container">
      <header className="member-feature-header member-notifications-header">
        <div>
          <p>ศูนย์ข้อความ</p>
          <h1>การแจ้งเตือน</h1>
          <span>ติดตามรายการเงิน ความปลอดภัย โปรโมชั่น และประกาศระบบ</span>
        </div>
        <MemberButton onClick={markAllRead} disabled={unreadCount === 0}>อ่านทั้งหมดแล้ว</MemberButton>
      </header>

      <section className="member-notification-summary" aria-label="สรุปการแจ้งเตือน">
        <MemberCard><span>ยังไม่อ่าน</span><strong>{unreadCount}</strong></MemberCard>
        <MemberCard><span>ทั้งหมด</span><strong>{items.length}</strong></MemberCard>
        <MemberCard><span>การเงิน</span><strong>{items.filter((item) => item.type === 'finance').length}</strong></MemberCard>
      </section>

      <section className="member-notification-filters" aria-label="ตัวกรองการแจ้งเตือน">
        {['ทั้งหมด', 'การเงิน', 'ความปลอดภัย', 'โปรโมชั่น', 'ระบบ'].map((label, index) => <button key={label} type="button" aria-pressed={index === 0}>{label}</button>)}
      </section>

      <MemberCard className="member-notification-list">
        {items.length === 0
          ? <MemberEmptyState title="ยังไม่มีการแจ้งเตือน" description="เมื่อมีรายการเงิน ข่าวสาร หรือเหตุการณ์ด้านความปลอดภัย ระบบจะแสดงไว้ที่นี่" />
          : items.map((item) => <article key={item.id} className={item.read ? 'is-read' : 'is-unread'}>
            <div className={`member-notification-icon member-notification-icon--${item.type}`} aria-hidden="true">•</div>
            <div><strong>{item.title}</strong><p>{item.description}</p><time dateTime={item.createdAt}>{item.createdAt}</time></div>
            {!item.read && <button type="button" onClick={() => setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, read: true } : entry))}>ทำเครื่องหมายว่าอ่านแล้ว</button>}
          </article>)}
      </MemberCard>
    </div>
  </main>;
}
