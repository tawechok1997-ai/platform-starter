'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import {
  AdminActionStrip,
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminCode,
  AdminConfirmDialog,
  AdminDataValue,
  AdminEmpty,
  AdminFilterBar,
  AdminGrid,
  AdminMetric,
  AdminMetricGrid,
  AdminNotice,
  AdminPage,
  AdminSkeleton,
  AdminStack,
} from '../_components/admin-ui';

type TicketMessage = { by: string; message: string; createdAt: string };
type Ticket = {
  id: string;
  subject: string;
  message: string;
  status: string;
  severity: string;
  category: string;
  refType?: string | null;
  refId?: string | null;
  assignedTo?: string | null;
  messages?: TicketMessage[];
  member?: { username?: string | null; phone?: string | null; email?: string | null };
  createdAt: string;
  updatedAt?: string;
};
type PendingStatusChange = { id: string; subject: string; nextStatus: string } | null;
type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger';

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
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [pendingStatusChange, setPendingStatusChange] = useState<PendingStatusChange>(null);

  useEffect(() => { void load(); }, [status, category]);

  const canReply = permissions.includes('*') || permissions.includes('support.reply');
  const canManage = permissions.includes('*') || permissions.includes('support.manage');
  const counts = useMemo(() => ({
    open: items.filter((item) => item.status === 'OPEN').length,
    reviewing: items.filter((item) => item.status === 'REVIEWING').length,
    resolved: items.filter((item) => item.status === 'RESOLVED').length,
    total: items.length,
  }), [items]);

  async function load() {
    setLoading(true);
    setMessage('');
    const params = new URLSearchParams();
    if (status !== 'ALL') params.set('status', status);
    if (category !== 'ALL') params.set('category', category);
    const [res, meRes] = await Promise.all([
      adminApiFetch(`/admin/support-tickets?${params.toString()}`),
      adminApiFetch('/admin/auth/me'),
    ]);
    const data = await res.json().catch(() => null);
    const meData = await meRes.json().catch(() => null);
    if (Array.isArray(meData?.permissions)) setPermissions(meData.permissions);
    setLoading(false);
    if (!res.ok) { setMessage(data?.message ?? 'โหลดเรื่องที่แจ้งไม่สำเร็จ'); return; }
    setItems(data.items ?? []);
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
    const res = await adminApiFetch(`/admin/support-tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus, note: nextStatus === 'RESOLVED' ? 'ปิดเรื่องจากหน้าช่วยเหลือ' : 'เปลี่ยนสถานะจากหน้าช่วยเหลือ' }),
    });
    const data = await res.json().catch(() => null);
    setBusyId('');
    setPendingStatusChange(null);
    if (!res.ok) { setMessage(data?.message ?? 'เปลี่ยนสถานะไม่สำเร็จ'); return; }
    setItems((current) => current.map((item) => item.id === id ? data.item : item));
    setMessage(`เปลี่ยนสถานะเป็น “${statusLabel(nextStatus)}” แล้ว`);
  }

  function requestStatusChange(ticket: Ticket, nextStatus: string) {
    if (!canManage) { setMessage('บัญชีนี้ไม่มีสิทธิ์เปลี่ยนสถานะ'); return; }
    setPendingStatusChange({ id: ticket.id, subject: ticket.subject, nextStatus });
  }

  function applyTemplate(id: string, text: string) {
    setReplyText((current) => ({ ...current, [id]: current[id]?.trim() ? `${current[id]}\n\n${text}` : text }));
  }

  return <AdminPage
    eyebrow="ช่วยเหลือสมาชิก"
    title="เรื่องที่สมาชิกแจ้ง"
    description="ตรวจปัญหา ตอบกลับ และติดตามเรื่องฝาก ถอน เกม หรือบัญชีจากหน้าเดียว"
    actions={<AdminButton disabled={loading} onClick={() => void load()}>รีเฟรช</AdminButton>}
  >
    {message && <AdminNotice tone={message.includes('ไม่สำเร็จ') || message.includes('ไม่มีสิทธิ์') ? 'danger' : 'neutral'}>{message}</AdminNotice>}

    <AdminMetricGrid>
      <AdminMetric tone={counts.open > 0 ? 'danger' : 'success'} title="รอตอบ" value={String(counts.open)} helper="ยังไม่มีผู้ดูแลรับเรื่อง" />
      <AdminMetric tone={counts.reviewing > 0 ? 'warning' : 'neutral'} title="กำลังดูแล" value={String(counts.reviewing)} />
      <AdminMetric tone="success" title="แก้แล้ว" value={String(counts.resolved)} />
      <AdminMetric title="ทั้งหมด" value={String(counts.total)} />
    </AdminMetricGrid>

    <AdminCard title="กรองเรื่องที่แจ้ง" description="เลือกสถานะและหมวดปัญหาเพื่อจำกัดรายการ">
      <AdminFilterBar resultText={`${items.length.toLocaleString('th-TH')} เรื่อง`}>
        <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="กรองตามสถานะ">
          <option value="ALL">ทุกสถานะ</option><option value="OPEN">รอตอบ</option><option value="REVIEWING">กำลังดูแล</option><option value="RESOLVED">แก้แล้ว</option><option value="DISMISSED">ปิดโดยไม่ดำเนินการ</option>
        </select>
        <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="กรองตามหมวด">
          <option value="ALL">ทุกหมวด</option><option value="deposit">ฝากเงิน</option><option value="withdraw">ถอนเงิน</option><option value="game">เกม</option><option value="account">บัญชี</option><option value="general">ทั่วไป</option>
        </select>
        {(status !== 'ALL' || category !== 'ALL') && <AdminButton size="compact" tone="ghost" onClick={() => { setStatus('ALL'); setCategory('ALL'); }}>ล้างตัวกรอง</AdminButton>}
      </AdminFilterBar>
    </AdminCard>

    <AdminCard title="ข้อความตอบกลับสำเร็จรูป" description="เลือกข้อความที่ใช้บ่อย แล้วแก้รายละเอียดก่อนส่ง">
      <div className="admin-support-template-list">{quickReplies.map((item) => <AdminBadge key={item.label}>{item.label}</AdminBadge>)}</div>
    </AdminCard>

    {loading && items.length === 0 && <AdminCard><AdminSkeleton lines={5} /></AdminCard>}

    <AdminGrid>
      {items.map((ticket) => <AdminCard
        key={ticket.id}
        title={ticket.subject}
        description={`${categoryLabel(ticket.category)} · ${new Date(ticket.createdAt).toLocaleString('th-TH')}`}
        tone={ticket.status === 'OPEN' ? 'danger' : ticket.status === 'REVIEWING' ? 'warning' : ticket.status === 'RESOLVED' ? 'success' : 'neutral'}
      >
        <AdminStack>
          <AdminDataValue label="สมาชิก">{ticket.member?.username ?? ticket.member?.phone ?? ticket.member?.email ?? '-'}</AdminDataValue>
          <AdminDataValue label="สถานะ"><span><AdminBadge tone={statusTone(ticket.status)}>{statusLabel(ticket.status)}</AdminBadge> <AdminBadge tone={severityTone(ticket.severity)}>{severityLabel(ticket.severity)}</AdminBadge></span></AdminDataValue>
          <AdminDataValue label="รายการอ้างอิง"><AdminCode {...(ticket.refId ? { title: ticket.refId } : {})}>{ticket.refType ?? '-'} {ticket.refId ?? ''}</AdminCode></AdminDataValue>

          <section className="admin-support-message-box">
            <strong>ข้อความจากสมาชิก</strong>
            <p>{ticket.message}</p>
            {(ticket.messages ?? []).slice(-4).map((entry, index) => <div key={`${entry.createdAt}-${index}`} className="admin-support-thread">
              <AdminBadge tone={entry.by === 'admin' ? 'success' : entry.by === 'member' ? 'warning' : 'neutral'}>{senderLabel(entry.by)}</AdminBadge>
              <span>{entry.message}</span>
              <small>{new Date(entry.createdAt).toLocaleString('th-TH')}</small>
            </div>)}
          </section>

          <div className="admin-support-template-actions">{quickReplies.map((item) => <button key={item.label} type="button" className="admin-support-template-button" onClick={() => applyTemplate(ticket.id, item.text)}>{item.label}</button>)}</div>
          {canReply && <textarea className="admin-support-reply" value={replyText[ticket.id] ?? ''} onChange={(event) => setReplyText((current) => ({ ...current, [ticket.id]: event.target.value }))} placeholder="พิมพ์คำตอบถึงสมาชิก" />}

          <AdminActionStrip>
            {canReply && <AdminButton disabled={busyId === ticket.id} onClick={() => void reply(ticket.id)}>ส่งคำตอบ</AdminButton>}
            {canManage && <>
              <AdminButton tone="secondary" disabled={busyId === ticket.id || ticket.status === 'REVIEWING'} onClick={() => requestStatusChange(ticket, 'REVIEWING')}>รับเรื่อง</AdminButton>
              <AdminButton tone="success" disabled={busyId === ticket.id || ticket.status === 'RESOLVED'} onClick={() => requestStatusChange(ticket, 'RESOLVED')}>แก้แล้ว</AdminButton>
              <AdminButton tone="danger" disabled={busyId === ticket.id || ticket.status === 'DISMISSED'} onClick={() => requestStatusChange(ticket, 'DISMISSED')}>ปิดเรื่อง</AdminButton>
            </>}
          </AdminActionStrip>
        </AdminStack>
      </AdminCard>)}
      {!loading && items.length === 0 && <AdminEmpty>ยังไม่มีเรื่องที่สมาชิกแจ้งตามเงื่อนไขนี้</AdminEmpty>}
    </AdminGrid>

    <AdminConfirmDialog
      open={Boolean(pendingStatusChange)}
      title="ยืนยันการเปลี่ยนสถานะ"
      description={pendingStatusChange ? `เปลี่ยนเรื่อง “${pendingStatusChange.subject}” เป็น “${statusLabel(pendingStatusChange.nextStatus)}” ใช่หรือไม่` : ''}
      confirmLabel="ยืนยัน"
      tone={pendingStatusChange?.nextStatus === 'DISMISSED' ? 'danger' : pendingStatusChange?.nextStatus === 'RESOLVED' ? 'success' : 'primary'}
      busy={Boolean(pendingStatusChange && busyId === pendingStatusChange.id)}
      onCancel={() => setPendingStatusChange(null)}
      onConfirm={() => { if (pendingStatusChange) void updateStatus(pendingStatusChange.id, pendingStatusChange.nextStatus); }}
    />
  </AdminPage>;
}

function statusTone(status: string): BadgeTone { if (status === 'RESOLVED') return 'success'; if (status === 'OPEN') return 'danger'; if (status === 'REVIEWING') return 'warning'; return 'neutral'; }
function severityTone(severity: string): BadgeTone { if (severity === 'CRITICAL' || severity === 'HIGH') return 'danger'; if (severity === 'MEDIUM') return 'warning'; return 'neutral'; }
function statusLabel(status: string) { const map: Record<string, string> = { OPEN: 'รอตอบ', REVIEWING: 'กำลังดูแล', RESOLVED: 'แก้แล้ว', DISMISSED: 'ปิดโดยไม่ดำเนินการ' }; return map[status] ?? status; }
function categoryLabel(category: string) { const map: Record<string, string> = { deposit: 'ฝากเงิน', withdraw: 'ถอนเงิน', game: 'เกม', account: 'บัญชี', general: 'ทั่วไป' }; return map[category] ?? category; }
function severityLabel(severity: string) { const map: Record<string, string> = { LOW: 'ทั่วไป', MEDIUM: 'ควรตรวจ', HIGH: 'เร่งด่วน', CRITICAL: 'วิกฤต' }; return map[severity] ?? severity; }
function senderLabel(sender: string) { const map: Record<string, string> = { admin: 'ผู้ดูแล', member: 'สมาชิก', system: 'ระบบ' }; return map[sender] ?? sender; }
