'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminGrid, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type Ticket = { id: string; subject: string; message: string; status: string; severity: string; category: string; refType?: string | null; refId?: string | null; assignedTo?: string | null; messages?: Array<{ by: string; message: string; createdAt: string }>; member?: { username?: string | null; phone?: string | null; email?: string | null }; createdAt: string; updatedAt?: string };

const quickReplies = [
  { label: 'ขอหลักฐานเพิ่ม', text: 'รบกวนแนบสลิปหรือหลักฐานเพิ่มเติม พร้อมแจ้งวันเวลาและยอดเงินที่ทำรายการ เพื่อให้ทีมตรวจสอบได้เร็วขึ้นครับ' },
  { label: 'กำลังตรวจรายการฝาก', text: 'ทีมงานกำลังตรวจสอบรายการฝากให้ครับ เมื่อข้อมูลตรงกับรายการธนาคารแล้วจะอัปเดตยอดให้โดยเร็วที่สุด' },
  { label: 'กำลังตรวจรายการถอน', text: 'ทีมงานรับเรื่องถอนเงินแล้วครับ กำลังตรวจสอบบัญชีและสถานะรายการ หากมีข้อมูลเพิ่มเติมจะแจ้งกลับในรายการนี้' },
  { label: 'ข้อมูลบัญชีไม่ตรง', text: 'ข้อมูลบัญชีธนาคารยังไม่ตรงกับข้อมูลสมาชิก รบกวนตรวจสอบชื่อบัญชีและเลขบัญชีอีกครั้งครับ' },
  { label: 'ปิดเรื่อง', text: 'ดำเนินการเรียบร้อยแล้วครับ หากยังพบปัญหา สามารถตอบกลับในรายการนี้ได้เลย' },
];

export default function SupportCenterPage() {
  const [items, setItems] = useState<Ticket[]>([]);
  const [status, setStatus] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [message, setMessage] = useState('กำลังโหลดเรื่องที่แจ้ง...');
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  useEffect(() => { void load(); }, [status, category]);
  const canReply = permissions.includes('*') || permissions.includes('support.reply');
  const canManage = permissions.includes('*') || permissions.includes('support.manage');
  const counts = useMemo(() => ({ open: items.filter((item) => item.status === 'OPEN').length, reviewing: items.filter((item) => item.status === 'REVIEWING').length, resolved: items.filter((item) => item.status === 'RESOLVED').length, total: items.length }), [items]);

  async function load() {
    setMessage('กำลังโหลดเรื่องที่แจ้ง...');
    const params = new URLSearchParams();
    if (status !== 'ALL') params.set('status', status);
    if (category !== 'ALL') params.set('category', category);
    const [res, meRes] = await Promise.all([adminApiFetch(`/admin/support-tickets?${params.toString()}`), adminApiFetch('/admin/auth/me')]);
    const data = await res.json().catch(() => null);
    const meData = await meRes.json().catch(() => null);
    if (Array.isArray(meData?.permissions)) setPermissions(meData.permissions);
    if (!res.ok) { setMessage(data?.message ?? 'โหลดเรื่องที่แจ้งไม่สำเร็จ'); return; }
    setItems(data.items ?? []);
    setMessage('');
  }

  async function reply(id: string) {
    if (!canReply) { setMessage('บัญชีนี้ไม่มีสิทธิ์ตอบกลับ'); return; }
    const text = (replyText[id] ?? '').trim();
    if (!text) { setMessage('กรุณาใส่ข้อความตอบกลับ'); return; }
    setBusyId(id);
    const res = await adminApiFetch(`/admin/support-tickets/${id}/reply`, { method: 'POST', body: JSON.stringify({ message: text }) });
    const data = await res.json().catch(() => null);
    setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'ตอบกลับไม่สำเร็จ'); return; }
    setReplyText((current) => ({ ...current, [id]: '' }));
    setItems((current) => current.map((item) => item.id === id ? data.item : item));
    setMessage('ส่งคำตอบแล้ว');
  }

  async function updateStatus(id: string, nextStatus: string) {
    if (!canManage) { setMessage('บัญชีนี้ไม่มีสิทธิ์เปลี่ยนสถานะ'); return; }
    setBusyId(id);
    const res = await adminApiFetch(`/admin/support-tickets/${id}`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus, note: nextStatus === 'RESOLVED' ? 'ปิดเรื่องจากหน้าช่วยเหลือ' : 'เปลี่ยนสถานะจากหน้าช่วยเหลือ' }) });
    const data = await res.json().catch(() => null);
    setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'เปลี่ยนสถานะไม่สำเร็จ'); return; }
    setItems((current) => current.map((item) => item.id === id ? data.item : item));
    setMessage(`เปลี่ยนสถานะเป็น “${statusLabel(nextStatus)}” แล้ว`);
  }

  function applyTemplate(id: string, text: string) { setReplyText((current) => ({ ...current, [id]: current[id]?.trim() ? `${current[id]}\n\n${text}` : text })); }

  return <AdminPage eyebrow="ช่วยเหลือสมาชิก" title="เรื่องที่สมาชิกแจ้ง" description="ตรวจปัญหา ตอบกลับ และติดตามเรื่องฝาก ถอน เกม หรือบัญชีจากหน้าเดียว" actions={<AdminButton onClick={() => void load()}>รีเฟรช</AdminButton>}>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminMetricGrid><AdminMetric tone={counts.open > 0 ? 'danger' : 'success'} title="รอตอบ" value={String(counts.open)} helper="ยังไม่มีผู้ดูแลรับเรื่อง" /><AdminMetric tone={counts.reviewing > 0 ? 'warning' : 'neutral'} title="กำลังดูแล" value={String(counts.reviewing)} /><AdminMetric tone="success" title="แก้แล้ว" value={String(counts.resolved)} /><AdminMetric title="ทั้งหมด" value={String(counts.total)} /></AdminMetricGrid>
    <AdminToolbar><select value={status} onChange={(event) => setStatus(event.target.value)} style={selectStyle}><option value="ALL">ทุกสถานะ</option><option value="OPEN">รอตอบ</option><option value="REVIEWING">กำลังดูแล</option><option value="RESOLVED">แก้แล้ว</option><option value="DISMISSED">ปิดโดยไม่ดำเนินการ</option></select><select value={category} onChange={(event) => setCategory(event.target.value)} style={selectStyle}><option value="ALL">ทุกหมวด</option><option value="deposit">ฝากเงิน</option><option value="withdraw">ถอนเงิน</option><option value="game">เกม</option><option value="account">บัญชี</option><option value="general">ทั่วไป</option></select></AdminToolbar>
    <AdminCard title="ข้อความตอบกลับสำเร็จรูป" description="เลือกใช้ข้อความที่ตอบบ่อย แล้วแก้รายละเอียดก่อนส่ง"><div style={templateGridStyle}>{quickReplies.map((item) => <AdminBadge key={item.label} tone="neutral">{item.label}</AdminBadge>)}</div></AdminCard>
    <AdminGrid>{items.map((ticket) => <AdminCard key={ticket.id} title={ticket.subject} description={`${categoryLabel(ticket.category)} · ${new Date(ticket.createdAt).toLocaleString('th-TH')}`} tone={ticket.status === 'OPEN' ? 'danger' : ticket.status === 'REVIEWING' ? 'warning' : ticket.status === 'RESOLVED' ? 'success' : 'neutral'}><AdminStack><AdminRow><strong>สมาชิก</strong><span>{ticket.member?.username ?? ticket.member?.phone ?? ticket.member?.email ?? '-'}</span></AdminRow><AdminRow><strong>สถานะ</strong><span><AdminBadge tone={statusTone(ticket.status)}>{statusLabel(ticket.status)}</AdminBadge> <AdminBadge tone={severityTone(ticket.severity)}>{severityLabel(ticket.severity)}</AdminBadge></span></AdminRow><AdminRow><strong>รายการอ้างอิง</strong><span>{ticket.refType ?? '-'} {ticket.refId ?? ''}</span></AdminRow><section style={messageBoxStyle}><strong>ข้อความจากสมาชิก</strong><p>{ticket.message}</p>{(ticket.messages ?? []).slice(-4).map((item, index) => <div key={index} style={threadStyle}><AdminBadge tone={item.by === 'admin' ? 'success' : item.by === 'member' ? 'warning' : 'neutral'}>{senderLabel(item.by)}</AdminBadge><span>{item.message}</span><small>{new Date(item.createdAt).toLocaleString('th-TH')}</small></div>)}</section><div style={templateGridStyle}>{quickReplies.map((item) => <button key={item.label} type="button" style={templateButtonStyle} onClick={() => applyTemplate(ticket.id, item.text)}>{item.label}</button>)}</div>{canReply && <textarea value={replyText[ticket.id] ?? ''} onChange={(event) => setReplyText((current) => ({ ...current, [ticket.id]: event.target.value }))} placeholder="พิมพ์คำตอบถึงสมาชิก" style={textareaStyle} />}<div style={actionRowStyle}>{canReply && <AdminButton disabled={busyId === ticket.id} onClick={() => void reply(ticket.id)}>ส่งคำตอบ</AdminButton>}{canManage && <><AdminButton tone="secondary" disabled={busyId === ticket.id} onClick={() => void updateStatus(ticket.id, 'REVIEWING')}>รับเรื่อง</AdminButton><AdminButton tone="success" disabled={busyId === ticket.id} onClick={() => void updateStatus(ticket.id, 'RESOLVED')}>ทำเครื่องหมายว่าแก้แล้ว</AdminButton><AdminButton tone="danger" disabled={busyId === ticket.id} onClick={() => void updateStatus(ticket.id, 'DISMISSED')}>ปิดโดยไม่ดำเนินการ</AdminButton></>}</div></AdminStack></AdminCard>)}{items.length === 0 && <AdminEmpty>ยังไม่มีเรื่องที่สมาชิกแจ้ง</AdminEmpty>}</AdminGrid>
  </AdminPage>;
}
function statusTone(status: string) { if (status === 'RESOLVED') return 'success'; if (status === 'OPEN') return 'danger'; if (status === 'REVIEWING') return 'warning'; return 'neutral'; }
function severityTone(severity: string) { if (severity === 'CRITICAL' || severity === 'HIGH') return 'danger'; if (severity === 'MEDIUM') return 'warning'; return 'neutral'; }
function statusLabel(status: string) { const map: Record<string, string> = { OPEN: 'รอตอบ', REVIEWING: 'กำลังดูแล', RESOLVED: 'แก้แล้ว', DISMISSED: 'ปิดโดยไม่ดำเนินการ' }; return map[status] ?? status; }
function categoryLabel(category: string) { const map: Record<string, string> = { deposit: 'ฝากเงิน', withdraw: 'ถอนเงิน', game: 'เกม', account: 'บัญชี', general: 'ทั่วไป' }; return map[category] ?? category; }
function severityLabel(severity: string) { const map: Record<string, string> = { LOW: 'ทั่วไป', MEDIUM: 'ควรตรวจ', HIGH: 'เร่งด่วน', CRITICAL: 'วิกฤต' }; return map[severity] ?? severity; }
function senderLabel(sender: string) { const map: Record<string, string> = { admin: 'ผู้ดูแล', member: 'สมาชิก', system: 'ระบบ' }; return map[sender] ?? sender; }
const selectStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 180 } as const;
const textareaStyle = { minHeight: 92, borderRadius: 14, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: 12, resize: 'vertical' as const, minWidth: 0 };
const messageBoxStyle = { border: '1px solid rgba(148,163,184,.16)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,.04)', display: 'grid', gap: 8 } as const;
const threadStyle = { display: 'grid', gap: 4, borderTop: '1px solid rgba(148,163,184,.12)', paddingTop: 8 } as const;
const actionRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const templateGridStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const templateButtonStyle = { border: '1px solid rgba(148,163,184,.22)', borderRadius: 999, background: 'rgba(148,163,184,.08)', color: '#dbeafe', padding: '8px 11px', fontWeight: 850, cursor: 'pointer' } as const;