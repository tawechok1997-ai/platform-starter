'use client';

import { useEffect, useState } from 'react';
import MemberBottomNav from '../member-bottom-nav';
import { memberApiFetch } from '../member-api';

type Profile = { id: string; referralCode: string; displayName: string; status: string; downlineCount: number; payoutStatus: string; createdAt: string } | null;
type Downline = { id: string; member?: { username?: string | null; phone?: string | null; email?: string | null }; createdAt: string };
type Commission = { id: string; amount: number; currency: string; basis: string; status: string; payoutStatus: string; createdAt: string };

export default function MemberAffiliatePage() {
  const [profile, setProfile] = useState<Profile>(null);
  const [downlines, setDownlines] = useState<Downline[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [displayName, setDisplayName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [linkCode, setLinkCode] = useState('');
  const [message, setMessage] = useState('กำลังโหลดระบบตัวแทน...');
  const [busy, setBusy] = useState(false);
  useEffect(() => { load(); }, []);
  async function load() { const res = await memberApiFetch('/member/affiliate/profile'); const data = await res.json().catch(() => null); if (!res.ok) { setMessage(data?.message ?? 'โหลดระบบตัวแทนไม่สำเร็จ'); return; } setProfile(data.profile); setDownlines(data.downlines ?? []); setCommissions(data.commissions ?? []); setDisplayName(data.profile?.displayName ?? ''); setReferralCode(data.profile?.referralCode ?? ''); setMessage(''); }
  async function saveProfile() { setBusy(true); const res = await memberApiFetch('/member/affiliate/profile', { method: 'POST', body: JSON.stringify({ displayName, referralCode }) }); const data = await res.json().catch(() => null); setBusy(false); if (!res.ok) { setMessage(data?.message ?? 'บันทึกตัวแทนไม่สำเร็จ'); return; } setProfile(data.profile); setReferralCode(data.profile.referralCode); setMessage('บันทึกโปรไฟล์ตัวแทนแล้ว รอแอดมินตรวจสอบ'); }
  async function linkReferral() { if (!linkCode.trim()) { setMessage('กรุณาใส่ referral code'); return; } setBusy(true); const res = await memberApiFetch('/member/affiliate/link', { method: 'POST', body: JSON.stringify({ referralCode: linkCode }) }); const data = await res.json().catch(() => null); setBusy(false); if (!res.ok) { setMessage(data?.message ?? 'ผูก referral ไม่สำเร็จ'); return; } setMessage(`ผูก referral ${data.link.referralCode} แล้ว`); setLinkCode(''); }
  const referralUrl = profile?.referralCode ? `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${profile.referralCode}` : '';
  return <main style={pageStyle}><section style={heroStyle}><span style={eyebrowStyle}>Affiliate</span><h1 style={titleStyle}>ตัวแทน / แนะนำเพื่อน</h1><p style={mutedStyle}>สร้าง referral code ดูสมาชิกใต้สาย และดู commission ledger แบบยังไม่ payout จริง</p></section>{message && <div style={noticeStyle}>{message}</div>}<section style={cardStyle}><h2>โปรไฟล์ตัวแทน</h2><label style={fieldStyle}><span>ชื่อแสดง</span><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} style={inputStyle} placeholder="เช่น Team Kogawz" /></label><label style={fieldStyle}><span>Referral code</span><input value={referralCode} onChange={(event) => setReferralCode(event.target.value.toUpperCase())} style={inputStyle} placeholder="เว้นว่างเพื่อให้ระบบสร้าง" /></label><button type="button" disabled={busy} onClick={saveProfile} style={buttonStyle}>{busy ? 'กำลังบันทึก...' : profile ? 'อัปเดตโปรไฟล์' : 'สร้างโปรไฟล์ตัวแทน'}</button>{profile && <div style={claimBoxStyle}><strong>สถานะ: {statusLabel(profile.status)}</strong><span>Code: {profile.referralCode}</span><span>Downline: {profile.downlineCount} คน</span><span>{profile.payoutStatus}</span>{referralUrl && <code style={codeStyle}>{referralUrl}</code>}</div>}</section><section style={cardStyle}><h2>ผูก referral code</h2><p style={mutedStyle}>สำหรับบัญชีที่สมัครมาเอง สามารถผูกรหัสแนะนำได้ครั้งเดียว</p><label style={fieldStyle}><span>Referral code</span><input value={linkCode} onChange={(event) => setLinkCode(event.target.value.toUpperCase())} style={inputStyle} placeholder="ใส่รหัสตัวแทน" /></label><button type="button" disabled={busy} onClick={linkReferral} style={secondaryButtonStyle}>ผูกรหัสแนะนำ</button></section><section style={cardStyle}><h2>Commission Ledger</h2>{commissions.map((item) => <div key={item.id} style={rowStyle}><strong>{money(item.amount)} {item.currency}</strong><span>{statusLabel(item.status)} · {item.basis}</span><small>{item.payoutStatus}</small></div>)}{commissions.length === 0 && <div style={emptyStyle}>ยังไม่มี commission ledger</div>}</section><section style={cardStyle}><h2>สมาชิกใต้สาย</h2>{downlines.map((item) => <div key={item.id} style={rowStyle}><strong>{item.member?.username ?? item.member?.phone ?? item.member?.email ?? '-'}</strong><span>{new Date(item.createdAt).toLocaleString('th-TH')}</span></div>)}{downlines.length === 0 && <div style={emptyStyle}>ยังไม่มีสมาชิกใต้สาย</div>}</section><MemberBottomNav /></main>;
}
function statusLabel(status: string) { const map: Record<string, string> = { PENDING: 'รอตรวจ', REVIEWING: 'กำลังตรวจ', APPROVED: 'อนุมัติแล้ว', REJECTED: 'ไม่อนุมัติ' }; return map[status] ?? status; }
function money(value: number) { return `THB ${Number(value || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }
const pageStyle = { minHeight: '100dvh', background: 'linear-gradient(180deg,#080808,#111827)', color: '#fff', padding: '88px 16px 104px', display: 'grid', gap: 16 } as const;
const heroStyle = { border: '1px solid rgba(245,197,66,.22)', borderRadius: 26, padding: 18, background: 'radial-gradient(circle at top left, rgba(245,197,66,.22), transparent 34%), rgba(245,197,66,.08)', display: 'grid', gap: 8 } as const;
const eyebrowStyle = { color: '#facc15', fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase' as const, fontSize: 12 };
const titleStyle = { margin: 0, fontSize: 34, lineHeight: 1.05 } as const;
const mutedStyle = { margin: 0, color: '#cbd5e1', lineHeight: 1.55 } as const;
const noticeStyle = { padding: 14, borderRadius: 18, background: 'rgba(15,23,42,.78)', border: '1px solid rgba(148,163,184,.18)' } as const;
const cardStyle = { border: '1px solid rgba(245,197,66,.22)', borderRadius: 22, padding: 16, background: 'rgba(15,23,42,.82)', display: 'grid', gap: 12, minWidth: 0 } as const;
const fieldStyle = { display: 'grid', gap: 6, fontWeight: 850 } as const;
const inputStyle = { minHeight: 44, borderRadius: 14, border: '1px solid rgba(255,255,255,.14)', background: '#0b1220', color: '#fff', padding: '0 12px', minWidth: 0 } as const;
const buttonStyle = { minHeight: 44, borderRadius: 14, padding: '0 14px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#f5c542', color: '#111827', fontWeight: 950, textDecoration: 'none', border: 0 } as const;
const secondaryButtonStyle = { ...buttonStyle, background: 'rgba(255,255,255,.08)', color: '#fff', border: '1px solid rgba(255,255,255,.14)' } as const;
const claimBoxStyle = { border: '1px solid rgba(245,197,66,.22)', borderRadius: 14, padding: 12, background: 'rgba(245,197,66,.08)', display: 'grid', gap: 4 } as const;
const rowStyle = { border: '1px solid rgba(255,255,255,.10)', borderRadius: 14, padding: 12, display: 'grid', gap: 4, background: 'rgba(255,255,255,.04)' } as const;
const emptyStyle = { padding: 14, borderRadius: 14, background: 'rgba(255,255,255,.04)', color: '#94a3b8', textAlign: 'center' as const };
const codeStyle = { whiteSpace: 'pre-wrap' as const, wordBreak: 'break-all' as const, border: '1px solid rgba(255,255,255,.12)', borderRadius: 10, padding: 8, color: '#fde68a' };
