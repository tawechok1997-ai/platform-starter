'use client';

import { useEffect, useMemo, useState } from 'react';
import { requestJson } from '../../member-api';
import { MemberButton, MemberCard, MemberEmptyState, MemberLinkButton, MemberNotice } from '../../components/member-ui';
import '../member-profile.css';

type LoginItem = { id: string; success: boolean; ipAddress?: string | null; userAgent?: string | null; reason?: string | null; createdAt: string };
type SecurityResponse = { accountStatus: string; activeSessions: number; passwordUpdatedAt: string; lastLoginAt?: string | null; failedLoginCount: number; recentLogins: LoginItem[]; twoFactorEnabled: boolean };

export default function SecurityPage() {
  const [data, setData] = useState<SecurityResponse | null>(null);
  const [notice, setNotice] = useState('กำลังโหลดข้อมูลความปลอดภัย...');
  const [loading, setLoading] = useState(true);
  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    try {
      setData(await requestJson<SecurityResponse>('/member/auth/security'));
      setNotice('');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'โหลดข้อมูลความปลอดภัยไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  }

  const suspicious = useMemo(() => data?.recentLogins.filter((item) => !item.success) ?? [], [data]);
  const items = [
    { label: 'การยืนยันสองขั้นตอน', value: data?.twoFactorEnabled ? 'เปิดใช้งานแล้ว' : 'ยังไม่เปิดใช้งาน', tone: data?.twoFactorEnabled ? 'success' : 'warning' },
    { label: 'รหัสผ่านล่าสุด', value: data ? new Date(data.passwordUpdatedAt).toLocaleString('th-TH') : '-', tone: 'default' },
    { label: 'การเข้าสู่ระบบล้มเหลว', value: `${data?.failedLoginCount ?? 0} ครั้งล่าสุด`, tone: suspicious.length > 0 ? 'warning' : 'success' },
    { label: 'สถานะบัญชี', value: data?.accountStatus ?? '-', tone: data?.accountStatus === 'ACTIVE' ? 'success' : 'warning' },
    { label: 'Session ที่ใช้งาน', value: String(data?.activeSessions ?? 0), tone: 'default' },
  ];

  return <main className="member-feature-page member-profile-page"><div className="member-feature-container">
    <header className="member-feature-header"><div><p>ความปลอดภัย</p><h1>ศูนย์ความปลอดภัย</h1><span>ดูสถานะบัญชี เหตุการณ์เสี่ยง และการป้องกันเพิ่มเติม</span></div><div className="member-profile-header-actions"><MemberButton onClick={() => void load()} disabled={loading} tone="default">{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</MemberButton><MemberLinkButton href="/profile" tone="default">กลับโปรไฟล์</MemberLinkButton></div></header>
    {notice && <MemberNotice tone={loading ? 'default' : 'warning'}><strong>{notice}</strong>{!loading && <MemberButton tone="default" onClick={() => void load()}>ลองใหม่</MemberButton>}</MemberNotice>}
    {!loading && !data && notice && <MemberEmptyState title="ยังโหลดศูนย์ความปลอดภัยไม่ได้" description="กรุณาลองใหม่ หรือแจ้งทีมช่วยเหลือหากยังเห็นข้อความนี้" actionHref="/support" actionLabel="ติดต่อทีมช่วยเหลือ" />}
    <section className="member-security-grid">
      {items.map((item) => <MemberCard key={item.label} className="member-security-card"><span>{item.label}</span><strong>{item.value}</strong><small data-tone={item.tone}>{item.tone === 'warning' ? 'ควรตรวจสอบ' : item.tone === 'success' ? 'ปกติ' : 'ข้อมูลระบบ'}</small></MemberCard>)}
    </section>
    <MemberCard className="member-profile-card"><div className="member-feature-section-heading"><div><p>Login history</p><h2>การเข้าสู่ระบบล่าสุด</h2></div></div>{data?.recentLogins.length ? <div className="member-session-list">{data.recentLogins.map((item) => <article key={item.id}><div><strong>{item.success ? 'เข้าสู่ระบบสำเร็จ' : 'เข้าสู่ระบบไม่สำเร็จ'}</strong><span>{new Date(item.createdAt).toLocaleString('th-TH')}</span></div><dl><div><dt>IP</dt><dd>{item.ipAddress ?? '-'}</dd></div><div><dt>เหตุผล</dt><dd>{item.reason ?? '-'}</dd></div></dl></article>)}</div> : !loading && <p>ยังไม่มีประวัติการเข้าสู่ระบบ</p>}</MemberCard>
    <section className="member-profile-actions" aria-label="ทางลัดความปลอดภัย">
      <a href="/profile/password"><strong>เปลี่ยนรหัสผ่าน</strong><span>อัปเดตรหัสผ่านเมื่อสงสัยว่าบัญชีไม่ปลอดภัย</span></a>
      <a href="/profile/sessions"><strong>จัดการ session</strong><span>ตรวจสอบและเพิกถอนอุปกรณ์ที่ไม่รู้จัก</span></a>
      <a href="/support"><strong>ติดต่อทีมช่วยเหลือ</strong><span>แจ้งเหตุผิดปกติหรือขอให้ช่วยตรวจสอบบัญชี</span></a>
    </section>
  </div></main>;
}
