'use client';

import { useEffect, useMemo, useState } from 'react';
import { memberApiFetch, requestJson } from '../../member-api';
import { MemberButton, MemberCard, MemberEmptyState, MemberLinkButton, MemberNotice } from '../../components/member-ui';
import '../member-profile.css';

type SessionItem = { id: string; ipAddress?: string | null; userAgent?: string | null; deviceId?: string | null; createdAt: string; updatedAt: string; expiresAt: string; current: boolean };

export default function SessionsPage() {
  const [items, setItems] = useState<SessionItem[]>([]);
  const [notice, setNotice] = useState('กำลังโหลด session...');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const otherCount = useMemo(() => items.filter((item) => !item.current).length, [items]);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await requestJson<{ items: SessionItem[] }>('/member/auth/sessions');
      setItems(data.items ?? []);
      setNotice('');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'โหลด session ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  async function revoke(id: string) {
    if (!window.confirm('ต้องการให้อุปกรณ์นี้ออกจากระบบหรือไม่')) return;
    setBusyId(id);
    const response = await memberApiFetch(`/member/auth/sessions/${id}`, { method: 'DELETE' });
    const data = await response.json().catch(() => null);
    setBusyId('');
    if (!response.ok) { setNotice(data?.message ?? 'เพิกถอน session ไม่สำเร็จ'); return; }
    setItems((current) => current.filter((item) => item.id !== id));
    setNotice('ให้อุปกรณ์นั้นออกจากระบบแล้ว');
  }

  async function revokeOthers() {
    if (!window.confirm(`ต้องการให้อุปกรณ์อื่น ${otherCount} เครื่องออกจากระบบหรือไม่`)) return;
    setBusyId('others');
    const response = await memberApiFetch('/member/auth/sessions/others', { method: 'DELETE' });
    const data = await response.json().catch(() => null);
    setBusyId('');
    if (!response.ok) { setNotice(data?.message ?? 'ออกจากอุปกรณ์อื่นไม่สำเร็จ'); return; }
    setItems((current) => current.filter((item) => item.current));
    setNotice(`ให้อุปกรณ์อื่นออกจากระบบแล้ว ${Number(data?.revokedCount ?? otherCount)} session`);
  }

  return <main className="member-feature-page member-profile-page"><div className="member-feature-container">
    <header className="member-feature-header"><div><p>ความปลอดภัย</p><h1>อุปกรณ์ที่เข้าสู่ระบบ</h1><span>ตรวจสอบอุปกรณ์ IP และกิจกรรมล่าสุด</span></div><MemberLinkButton href="/profile" tone="default">กลับโปรไฟล์</MemberLinkButton></header>
    {notice && <MemberNotice tone={loading ? 'default' : 'warning'}>{notice}</MemberNotice>}
    <section className="member-profile-grid">
      <MemberCard className="member-profile-card"><div className="member-feature-section-heading"><div><p>Session</p><h2>อุปกรณ์ทั้งหมด</h2></div><MemberButton onClick={() => void revokeOthers()} disabled={loading || busyId !== '' || otherCount === 0} tone="danger">{busyId === 'others' ? 'กำลังออกจากระบบ...' : 'ออกจากอุปกรณ์อื่น'}</MemberButton></div>
        {!loading && items.length === 0 ? <MemberEmptyState title="ไม่พบ session ที่ใช้งานอยู่" description="ลองรีเฟรชข้อมูล หรือเข้าสู่ระบบใหม่หาก session หมดอายุ" actionHref="/profile/sessions" actionLabel="รีเฟรช" /> : <div className="member-session-list">{items.map((item) => <article key={item.id}><div><strong>{deviceLabel(item)}</strong><span>{item.current ? 'อุปกรณ์นี้' : 'อุปกรณ์อื่น'}</span></div><dl><div><dt>IP</dt><dd>{item.ipAddress ?? '-'}</dd></div><div><dt>เข้าสู่ระบบเมื่อ</dt><dd>{new Date(item.createdAt).toLocaleString('th-TH')}</dd></div><div><dt>หมดอายุ</dt><dd>{new Date(item.expiresAt).toLocaleString('th-TH')}</dd></div></dl>{!item.current && <button type="button" onClick={() => void revoke(item.id)} disabled={busyId !== ''}>{busyId === item.id ? 'กำลังเพิกถอน...' : 'เพิกถอน'}</button>}</article>)}</div>}
      </MemberCard>
    </section>
  </div></main>;
}

function deviceLabel(item: SessionItem) {
  if (item.deviceId && item.deviceId !== 'web-member') return item.deviceId;
  const agent = item.userAgent ?? '';
  if (/iphone|ipad/i.test(agent)) return 'iPhone / iPad';
  if (/android/i.test(agent)) return 'Android';
  if (/windows/i.test(agent)) return 'Windows';
  if (/macintosh|mac os/i.test(agent)) return 'Mac';
  return 'Web browser';
}
