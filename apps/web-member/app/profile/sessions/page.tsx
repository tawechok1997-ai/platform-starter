'use client';

import { useMemo, useState } from 'react';
import { MemberButton, MemberCard, MemberEmptyState, MemberLinkButton, MemberNotice } from '../../components/member-ui';
import '../member-profile.css';

type SessionItem = { id: string; device: string; location: string; ip: string; lastActive: string; current: boolean };

export default function SessionsPage() {
  const [items, setItems] = useState<SessionItem[]>([]);
  const [notice, setNotice] = useState('');
  const otherCount = useMemo(() => items.filter((item) => !item.current).length, [items]);

  function revoke(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
    setNotice('เพิกถอน session ในหน้าจอแล้ว รอเชื่อม endpoint จริง');
  }

  function revokeOthers() {
    setItems((current) => current.filter((item) => item.current));
    setNotice('ล้าง session อื่นในหน้าจอแล้ว รอเชื่อม endpoint จริง');
  }

  return <main className="member-feature-page member-profile-page"><div className="member-feature-container">
    <header className="member-feature-header"><div><p>ความปลอดภัย</p><h1>อุปกรณ์ที่เข้าสู่ระบบ</h1><span>ตรวจสอบอุปกรณ์ IP และกิจกรรมล่าสุด</span></div><MemberLinkButton href="/profile" tone="default">กลับโปรไฟล์</MemberLinkButton></header>
    {notice && <MemberNotice tone="success">{notice}</MemberNotice>}
    <section className="member-profile-grid">
      <MemberCard className="member-profile-card"><div className="member-feature-section-heading"><div><p>Session</p><h2>อุปกรณ์ทั้งหมด</h2></div><MemberButton onClick={revokeOthers} disabled={otherCount === 0} tone="danger">ออกจากอุปกรณ์อื่น</MemberButton></div>
        {items.length === 0 ? <MemberEmptyState title="ยังไม่มีข้อมูล session" description="รายการอุปกรณ์จะปรากฏเมื่อเชื่อม API session management" /> : <div className="member-session-list">{items.map((item) => <article key={item.id}><div><strong>{item.device}</strong><span>{item.current ? 'อุปกรณ์นี้' : item.location}</span></div><dl><div><dt>IP</dt><dd>{item.ip}</dd></div><div><dt>ใช้งานล่าสุด</dt><dd>{item.lastActive}</dd></div></dl>{!item.current && <button type="button" onClick={() => revoke(item.id)}>เพิกถอน</button>}</article>)}</div>}
      </MemberCard>
    </section>
  </div></main>;
}
