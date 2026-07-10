'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminGrid, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type Agent = { id: string; referralCode: string; displayName: string; status: string; rawStatus: string; commissionRate: number; payoutEnabled: boolean; payoutStatus: string; adminNote?: string; downlineCount: number; member?: { username?: string | null; phone?: string | null; email?: string | null }; createdAt: string };

export default function AffiliateCenterPage() {
  const [items, setItems] = useState<Agent[]>([]);
  const [status, setStatus] = useState('ALL');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('กำลังโหลดตัวแทน...');
  const [busyId, setBusyId] = useState('');
  useEffect(() => { load(); }, [status]);
  const stats = useMemo(() => ({ pending: items.filter((item) => item.status === 'PENDING').length, approved: items.filter((item) => item.status === 'APPROVED').length, rejected: items.filter((item) => item.status === 'REJECTED').length, downlines: items.reduce((sum, item) => sum + Number(item.downlineCount || 0), 0) }), [items]);
  async function load() { setMessage('กำลังโหลดตัวแทน...'); const params = new URLSearchParams(); if (status !== 'ALL') params.set('status', status); const res = await adminApiFetch(`/admin/affiliates?${params.toString()}`); const data = await res.json().catch(() => null); if (!res.ok) { setMessage(data?.message ?? 'โหลดตัวแทนไม่สำเร็จ'); return; } setItems(data.items ?? []); setMessage(''); }
  async function review(id: string, next: 'APPROVED' | 'REJECTED') { const adminNote = (notes[id] ?? '').trim(); if (next === 'REJECTED' && !adminNote) { setMessage('กรุณาใส่เหตุผลก่อนปฏิเสธ'); return; } setBusyId(id); const res = await adminApiFetch(`/admin/affiliates/${id}/review`, { method: 'PATCH', body: JSON.stringify({ status: next, adminNote }) }); const data = await res.json().catch(() => null); setBusyId(''); if (!res.ok) { setMessage(data?.message ?? 'ตรวจตัวแทนไม่สำเร็จ'); return; } setItems((current) => current.map((item) => item.id === id ? data.profile : item)); setMessage(next === 'APPROVED' ? 'อนุมัติตัวแทนแล้ว ยังไม่เปิด commission payout' : 'ปฏิเสธตัวแทนแล้ว'); }
  return <AdminPage eyebrow="Growth" title="Affiliate / Agent" description="จัดการตัวแทน referral และ downline ระดับแรก ยังไม่คำนวณหรือจ่าย commission จริง" actions={<AdminButton onClick={load}>รีเฟรช</AdminButton>}>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminMetricGrid><AdminMetric tone={stats.pending > 0 ? 'warning' : 'success'} title="รอตรวจ" value={String(stats.pending)} /><AdminMetric tone="success" title="อนุมัติ" value={String(stats.approved)} /><AdminMetric tone="danger" title="ปฏิเสธ" value={String(stats.rejected)} /><AdminMetric tone="warning" title="Downline" value={String(stats.downlines)} helper="ยังไม่คิด commission" /></AdminMetricGrid>
    <AdminToolbar><select value={status} onChange={(event) => setStatus(event.target.value)} style={selectStyle}><option value="ALL">ทุกสถานะ</option><option value="OPEN">รอตรวจ</option><option value="REVIEWING">กำลังตรวจ</option><option value="RESOLVED">อนุมัติ</option><option value="DISMISSED">ปฏิเสธ</option></select></AdminToolbar>
    <AdminGrid>{items.map((item) => <AdminCard key={item.id} title={item.displayName || item.referralCode} description={`${memberLabel(item)} · ${new Date(item.createdAt).toLocaleString('th-TH')}`} tone={item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'warning'}><AdminStack><AdminRow><strong>Referral code</strong><span>{item.referralCode}</span></AdminRow><AdminRow><strong>สถานะ</strong><AdminBadge tone={statusTone(item.status)}>{statusLabel(item.status)}</AdminBadge></AdminRow><AdminRow><strong>Downline</strong><span>{item.downlineCount} คน</span></AdminRow><AdminRow><strong>Commission</strong><span>{item.commissionRate}% · {item.payoutStatus}</span></AdminRow>{item.adminNote && <AdminRow><strong>หมายเหตุ</strong><span>{item.adminNote}</span></AdminRow>}<textarea value={notes[item.id] ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="หมายเหตุแอดมิน" style={textareaStyle} /><div style={actionRowStyle}><AdminButton disabled={busyId === item.id} tone="secondary" onClick={() => review(item.id, 'APPROVED')}>อนุมัติ</AdminButton><AdminButton disabled={busyId === item.id} tone="danger" onClick={() => review(item.id, 'REJECTED')}>ปฏิเสธ</AdminButton></div></AdminStack></AdminCard>)}{items.length === 0 && <AdminEmpty>ยังไม่มีตัวแทน</AdminEmpty>}</AdminGrid>
    <AdminCard title="Guard ก่อนเงินจริง" tone="danger"><AdminStack><AdminRow><strong>Commission ledger</strong><AdminBadge tone="danger">ยังไม่เปิด</AdminBadge></AdminRow><AdminRow><strong>Auto payout</strong><AdminBadge tone="danger">ปิด</AdminBadge></AdminRow><AdminRow><strong>Duplicate referral</strong><AdminBadge tone="success">กันแล้วระดับแรก</AdminBadge></AdminRow></AdminStack></AdminCard>
  </AdminPage>;
}
function memberLabel(item: Agent) { return item.member?.username ?? item.member?.phone ?? item.member?.email ?? '-'; }
function statusTone(status: string) { if (status === 'APPROVED') return 'success'; if (status === 'REJECTED') return 'danger'; if (status === 'REVIEWING') return 'warning'; return 'neutral'; }
function statusLabel(status: string) { const map: Record<string, string> = { PENDING: 'รอตรวจ', REVIEWING: 'กำลังตรวจ', APPROVED: 'อนุมัติ', REJECTED: 'ปฏิเสธ' }; return map[status] ?? status; }
const selectStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 180 } as const;
const textareaStyle = { minHeight: 88, borderRadius: 14, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: 12, resize: 'vertical' as const, minWidth: 0 };
const actionRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
