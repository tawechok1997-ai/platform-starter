'use client';

import { useEffect, useMemo, useState } from 'react';
import MemberBottomNav from '../member-bottom-nav';
import { memberApiFetch } from '../member-api';

type Ticket = { id: string; subject: string; message: string; status: string; severity: string; category: string; messages?: Array<{ by: string; message: string; createdAt: string }>; createdAt: string };

export default function MemberSupportPage() {
  const [items, setItems] = useState<Ticket[]>([]);
  const [category, setCategory] = useState('deposit');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('กำลังโหลด ticket...');
  const [busy, setBusy] = useState(false);
  useEffect(() => { load(); }, []);
  const openCount = useMemo(() => items.filter((item) => item.status === 'OPEN' || item.status === 'REVIEWING').length, [items]);
  async function load() { const res = await memberApiFetch('/member/support-tickets'); const data = await res.json().catch(() => null); if (!res.ok) { setNotice(data?.message ?? 'โหลด ticket ไม่สำเร็จ'); return; } setItems(data.items ?? []); setNotice(''); }
  async function createTicket() { if (!subject.trim() || !message.trim()) { setNotice('กรุณาใส่หัวข้อและรายละเอียด'); return; } setBusy(true); const res = await memberApiFetch('/member/support-tickets', { method: 'POST', body: JSON.stringify({ category, subject, message }) }); const data = await res.json().catch(() => null); setBusy(false); if (!res.ok) { setNotice(data?.message ?? 'สร้าง ticket ไม่สำเร็จ'); return; } setSubject(''); setMessage(''); setNotice('ส่งปัญหาแล้ว'); await load(); }
  async function reply(id: string) { const text = (replyText[id] ?? '').trim(); if (!text) { setNotice('กรุณาใส่ข้อความตอบกลับ'); return; } setBusy(true); const res = await memberApiFetch(`/member/support-tickets/${id}/reply`, { method: 'POST', body: JSON.stringify({ message: text }) }); const data = await res.json().catch(() => null); setBusy(false); if (!res.ok) { setNotice(data?.message ?? 'ตอบกลับไม่สำเร็จ'); return; } setReplyText((current) => ({ ...current, [id]: '' })); setItems((current) => current.map((item) => item.id === id ? data.item : item)); setNotice('ตอบกลับแล้ว'); }
  return <main style={pageStyle}><section style={heroStyle}><span style={eyebrowStyle}>Support</span><h1 style={titleStyle}>ช่วยเหลือ</h1><p style={mutedStyle}>แจ้งปัญหาฝาก ถอน เกม หรือบัญชี แล้วรอแอดมินตอบกลับ</p><strong>{openCount} เคสที่ยังเปิดอยู่</strong></section>{notice && <div style={noticeStyle}>{notice}</div>}<section style={cardStyle}><h2>แจ้งปัญหาใหม่</h2><select value={category} onChange={(event) => setCategory(event.target.value)} style={inputStyle}><option value="deposit">ฝาก</option><option value="withdraw">ถอนเงิน</option><option value="game">เกม</option><option value="account">บัญชี</option><option value="general">ทั่วไป</option></select><input value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="หัวข้อ" style={inputStyle} /><textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="รายละเอียดปัญหา" style={textareaStyle} /><button disabled={busy} onClick={createTicket} style={buttonStyle}>{busy ? 'กำลังส่ง...' : 'ส่งปัญหา'}</button></section><section style={listStyle}><h2>Ticket ของฉัน</h2>{items.map((item) => <article key={item.id} style={cardStyle}><div style={rowStyle}><div><strong>{item.subject}</strong><p style={mutedStyle}>{categoryLabel(item.category)} · {new Date(item.createdAt).toLocaleString('th-TH')}</p></div><span style={badgeStyle}>{statusLabel(item.status)}</span></div><p>{item.message}</p><div style={threadStyle}>{(item.messages ?? []).slice(-5).map((msg, index) => <div key={index} style={messageStyle}><strong>{msg.by === 'admin' ? 'แอดมิน' : msg.by === 'member' ? 'คุณ' : 'ระบบ'}</strong><span>{msg.message}</span><small>{new Date(msg.createdAt).toLocaleString('th-TH')}</small></div>)}</div><textarea value={replyText[item.id] ?? ''} onChange={(event) => setReplyText((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="ตอบกลับ" style={textareaStyle} /><button disabled={busy} onClick={() => reply(item.id)} style={secondaryButtonStyle}>ตอบกลับ</button></article>)}{items.length === 0 && <div style={emptyStyle}>ยังไม่มี ticket</div>}</section><MemberBottomNav /></main>;
}
function statusLabel(status: string) { const map: Record<string, string> = { OPEN: 'เปิดอยู่', REVIEWING: 'กำลังดูแล', RESOLVED: 'แก้แล้ว', DISMISSED: 'ปิดแล้ว' }; return map[status] ?? status; }
function categoryLabel(category: string) { const map: Record<string, string> = { deposit: 'ฝาก', withdraw: 'ถอนเงิน', game: 'เกม', account: 'บัญชี', general: 'ทั่วไป' }; return map[category] ?? category; }
const pageStyle = { minHeight: '100dvh', background: 'linear-gradient(180deg,#080808,#111827)', color: '#fff', padding: '88px 16px 104px', display: 'grid', gap: 16 } as const;
const heroStyle = { border: '1px solid rgba(245,197,66,.22)', borderRadius: 26, padding: 18, background: 'radial-gradient(circle at top left, rgba(245,197,66,.22), transparent 34%), rgba(245,197,66,.08)', display: 'grid', gap: 8 } as const;
const eyebrowStyle = { color: '#facc15', fontWeight: 900, letterSpacing: '.08em', textTransform: 'uppercase' as const, fontSize: 12 };
const titleStyle = { margin: 0, fontSize: 34, lineHeight: 1.05 } as const;
const mutedStyle = { margin: 0, color: '#cbd5e1', lineHeight: 1.55 } as const;
const noticeStyle = { padding: 14, borderRadius: 18, background: 'rgba(15,23,42,.78)', border: '1px solid rgba(148,163,184,.18)' } as const;
const cardStyle = { border: '1px solid rgba(148,163,184,.18)', borderRadius: 20, padding: 14, background: 'rgba(15,23,42,.82)', display: 'grid', gap: 10, minWidth: 0 } as const;
const listStyle = { display: 'grid', gap: 12 } as const;
const inputStyle = { minHeight: 44, borderRadius: 14, border: '1px solid rgba(255,255,255,.14)', background: 'rgba(2,6,23,.62)', color: '#fff', padding: '0 13px', outline: 'none' } as const;
const textareaStyle = { ...inputStyle, minHeight: 96, padding: 12, resize: 'vertical' as const };
const buttonStyle = { minHeight: 44, borderRadius: 14, border: 0, background: '#f5c542', color: '#111827', fontWeight: 950 } as const;
const secondaryButtonStyle = { ...buttonStyle, background: 'rgba(255,255,255,.08)', color: '#fff', border: '1px solid rgba(255,255,255,.14)' } as const;
const rowStyle = { display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' as const };
const badgeStyle = { borderRadius: 999, padding: '6px 10px', background: 'rgba(245,197,66,.14)', color: '#fde68a', fontWeight: 900, fontSize: 12 } as const;
const threadStyle = { display: 'grid', gap: 8 } as const;
const messageStyle = { border: '1px solid rgba(255,255,255,.10)', borderRadius: 14, padding: 10, display: 'grid', gap: 4, background: 'rgba(255,255,255,.04)' } as const;
const emptyStyle = { padding: 18, borderRadius: 18, background: 'rgba(15,23,42,.72)', color: '#94a3b8', textAlign: 'center' as const };
