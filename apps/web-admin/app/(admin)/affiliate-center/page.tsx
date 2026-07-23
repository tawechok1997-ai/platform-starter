'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminEmpty, AdminGrid, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type Downline = { id: string; member?: { username?: string | null; phone?: string | null; email?: string | null }; createdAt: string; children?: Downline[]; downlines?: Downline[] };
type Agent = { id: string; referralCode: string; displayName: string; status: string; rawStatus: string; commissionRate: number; payoutEnabled: boolean; payoutStatus: string; adminNote?: string; downlineCount: number; downlines?: Downline[]; member?: { username?: string | null; phone?: string | null; email?: string | null }; createdAt: string };
type PendingReview = { id: string; next: 'APPROVED' | 'REJECTED'; label: string; adminNote: string } | null;

export default function AffiliateCenterPage() {
  const [items, setItems] = useState<Agent[]>([]);
  const [status, setStatus] = useState('ALL');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('กำลังโหลดตัวแทน...');
  const [busyId, setBusyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingReview, setPendingReview] = useState<PendingReview>(null);

  useEffect(() => { void load(); }, [status]);

  const stats = useMemo(() => ({
    pending: items.filter((item) => item.status === 'PENDING').length,
    approved: items.filter((item) => item.status === 'APPROVED').length,
    rejected: items.filter((item) => item.status === 'REJECTED').length,
    downlines: items.reduce((sum, item) => sum + Number(item.downlineCount || 0), 0),
  }), [items]);
  const duplicateCodes = useMemo(() => new Set(items.map((item) => item.referralCode).filter((code, index, all) => Boolean(code) && all.indexOf(code) !== index)), [items]);

  async function load() {
    setLoading(true); setMessage('กำลังโหลดตัวแทน...');
    try {
      const params = new URLSearchParams(); if (status !== 'ALL') params.set('status', status);
      const res = await adminApiFetch(`/admin/affiliates?${params.toString()}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error('load-failed');
      setItems(Array.isArray(data?.items) ? data.items : []); setMessage('');
    } catch { setMessage('โหลดตัวแทนไม่สำเร็จ กรุณาลองใหม่'); }
    finally { setLoading(false); }
  }

  function requestReview(item: Agent, next: 'APPROVED' | 'REJECTED') {
    const adminNote = (notes[item.id] ?? '').trim();
    if (next === 'REJECTED' && !adminNote) { setMessage('กรุณาใส่เหตุผลก่อนปฏิเสธ'); return; }
    if (next === 'APPROVED' && duplicateCodes.has(item.referralCode)) { setMessage('อนุมัติไม่ได้ เพราะ referral code ซ้ำ'); return; }
    setPendingReview({ id: item.id, next, label: item.displayName || item.referralCode, adminNote });
  }

  async function confirmReview() {
    if (!pendingReview || busyId) return;
    const { id, next, adminNote } = pendingReview;
    setBusyId(id); setMessage('กำลังบันทึกผลตรวจ...');
    try {
      const res = await adminApiFetch(`/admin/affiliates/${id}/review`, { method: 'PATCH', body: JSON.stringify({ status: next, adminNote }) });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.profile) throw new Error('review-failed');
      setItems((current) => current.map((item) => item.id === id ? data.profile : item));
      setNotes((current) => ({ ...current, [id]: '' }));
      setMessage(next === 'APPROVED' ? 'อนุมัติตัวแทนแล้ว ยังไม่เปิด commission payout' : 'ปฏิเสธตัวแทนแล้ว');
      setPendingReview(null);
    } catch { setMessage('บันทึกผลตรวจตัวแทนไม่สำเร็จ กรุณาลองใหม่'); }
    finally { setBusyId(''); }
  }

  return <AdminPage eyebrow="Growth" title="Affiliate / Agent" description="จัดการตัวแทน referral และ downline หลายระดับ โดยยังไม่คำนวณหรือจ่าย commission จริง" actions={<AdminButton disabled={loading || Boolean(busyId)} onClick={() => void load()}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton>}>
    {message && <AdminNotice tone={message.includes('ไม่สำเร็จ') || message.includes('ไม่ได้') || message.includes('กรุณา') ? 'danger' : 'neutral'}>{message}</AdminNotice>}
    <AdminMetricGrid><AdminMetric tone={stats.pending > 0 ? 'warning' : 'success'} title="รอตรวจ" value={String(stats.pending)} /><AdminMetric tone="success" title="อนุมัติ" value={String(stats.approved)} /><AdminMetric tone="danger" title="ปฏิเสธ" value={String(stats.rejected)} /><AdminMetric tone="warning" title="Downline" value={String(stats.downlines)} helper="ยังไม่คิด commission" /></AdminMetricGrid>
    <AdminToolbar><select value={status} disabled={loading || Boolean(busyId)} onChange={(event) => setStatus(event.target.value)} style={selectStyle}><option value="ALL">ทุกสถานะ</option><option value="OPEN">รอตรวจ</option><option value="REVIEWING">กำลังตรวจ</option><option value="RESOLVED">อนุมัติ</option><option value="DISMISSED">ปฏิเสธ</option></select></AdminToolbar>
    {duplicateCodes.size > 0 && <AdminNotice tone="danger">พบ referral code ซ้ำ {Array.from(duplicateCodes).join(', ')} — ระงับการอนุมัติไว้แล้ว</AdminNotice>}
    <AdminGrid>{items.map((item) => { const decisionClosed = item.status === 'APPROVED' || item.status === 'REJECTED'; return <AdminCard key={item.id} title={item.displayName || item.referralCode} description={`${memberLabel(item)} · ${new Date(item.createdAt).toLocaleString('th-TH')}`} tone={item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'warning'}><AdminStack><AdminRow><strong>Referral code</strong><span>{item.referralCode}</span></AdminRow>{duplicateCodes.has(item.referralCode) && <AdminBadge tone="danger">Referral ซ้ำ — ต้องตรวจสอบ</AdminBadge>}<AdminRow><strong>สถานะ</strong><AdminBadge tone={statusTone(item.status)}>{statusLabel(item.status)}</AdminBadge></AdminRow><AdminRow><strong>Downline</strong><span>{item.downlineCount} คน</span></AdminRow>{item.downlines?.length ? <section style={downlineStyle}><strong>Downline tree</strong>{item.downlines.map((downline) => <DownlineNode key={downline.id} item={downline} depth={0} />)}</section> : <AdminRow><strong>Downline tree</strong><span>ยังไม่มีสมาชิกใต้สาย</span></AdminRow>}<AdminRow><strong>Commission rule</strong><span>{item.commissionRate}% · {item.payoutStatus}</span></AdminRow>{item.adminNote && <AdminRow><strong>หมายเหตุ</strong><span>{item.adminNote}</span></AdminRow>}<textarea disabled={decisionClosed || Boolean(busyId)} value={notes[item.id] ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="หมายเหตุแอดมิน หรือเหตุผลเมื่อปฏิเสธ" style={textareaStyle} /><div style={actionRowStyle}><AdminButton disabled={decisionClosed || Boolean(busyId) || duplicateCodes.has(item.referralCode)} tone="secondary" onClick={() => requestReview(item, 'APPROVED')}>อนุมัติ</AdminButton><AdminButton disabled={decisionClosed || Boolean(busyId)} tone="danger" onClick={() => requestReview(item, 'REJECTED')}>ปฏิเสธ</AdminButton></div></AdminStack></AdminCard>; })}{!loading && items.length === 0 && <AdminEmpty>ยังไม่มีตัวแทน</AdminEmpty>}</AdminGrid>
    <AdminCard title="Guard ก่อนเงินจริง" tone="danger"><AdminStack><AdminRow><strong>Commission ledger</strong><AdminBadge tone="danger">ยังไม่เปิด</AdminBadge></AdminRow><AdminRow><strong>Auto payout</strong><AdminBadge tone="danger">ปิด</AdminBadge></AdminRow><AdminRow><strong>Duplicate referral</strong><AdminBadge tone={duplicateCodes.size > 0 ? 'danger' : 'success'}>{duplicateCodes.size > 0 ? 'พบรายการต้องตรวจสอบ' : 'ไม่พบรหัสซ้ำในผลลัพธ์ปัจจุบัน'}</AdminBadge></AdminRow></AdminStack></AdminCard>
    <AdminConfirmDialog open={Boolean(pendingReview)} title={pendingReview?.next === 'APPROVED' ? 'ยืนยันอนุมัติตัวแทน' : 'ยืนยันปฏิเสธตัวแทน'} description={pendingReview ? `${pendingReview.label}${pendingReview.next === 'REJECTED' ? ` · เหตุผล: ${pendingReview.adminNote}` : ' · Commission payout ยังปิดอยู่'}` : ''} confirmLabel={pendingReview?.next === 'APPROVED' ? 'ยืนยันอนุมัติ' : 'ยืนยันปฏิเสธ'} tone={pendingReview?.next === 'APPROVED' ? 'success' : 'danger'} busy={Boolean(busyId)} onCancel={() => { if (!busyId) setPendingReview(null); }} onConfirm={() => void confirmReview()} />
  </AdminPage>;
}

function DownlineNode({ item, depth }: { item: Downline; depth: number }) { const children = item.children ?? item.downlines ?? []; return <div style={{ ...downlineNodeStyle, marginLeft: Math.min(depth, 5) * 16 }}><span>{depth === 0 ? '└' : '↳'} {memberLabel(item)} <small>· {new Date(item.createdAt).toLocaleDateString('th-TH')}</small></span>{children.map((child) => <DownlineNode key={child.id} item={child} depth={depth + 1} />)}</div>; }
function memberLabel(item: { member?: { username?: string | null; phone?: string | null; email?: string | null } }) { return item.member?.username ?? item.member?.phone ?? item.member?.email ?? 'สมาชิกที่ตรวจสอบแล้ว'; }
function statusTone(status: string) { if (status === 'APPROVED') return 'success'; if (status === 'REJECTED') return 'danger'; if (status === 'REVIEWING') return 'warning'; return 'neutral'; }
function statusLabel(status: string) { const map: Record<string, string> = { PENDING: 'รอตรวจ', REVIEWING: 'กำลังตรวจ', APPROVED: 'อนุมัติ', REJECTED: 'ปฏิเสธ' }; return map[status] ?? status; }
const selectStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 180 } as const;
const textareaStyle = { minHeight: 88, borderRadius: 14, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: 12, resize: 'vertical' as const, minWidth: 0 };
const actionRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const downlineStyle = { display: 'grid', gap: 6, padding: 10, borderRadius: 12, background: 'rgba(148,163,184,.08)', fontSize: 13 } as const;
const downlineNodeStyle = { display: 'grid', gap: 5, padding: '3px 0', color: '#e2e8f0' } as const;
