'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminEmpty, AdminGrid, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminSkeleton, AdminStack, AdminToolbar } from '../_components/admin-ui';

type Agent = { id: string; referralCode: string; displayName: string; status: string; commissionRate?: number; member?: { username?: string | null; phone?: string | null; email?: string | null } };
type Commission = { id: string; agentProfileId: string; referralCode: string; amount: number; currency: string; basis: string; basisAmount?: number; ratePercent?: number; capAmount?: number | null; calculatedAmount?: number; manualOverride?: boolean; note?: string; status: string; payoutStatus: string; member?: { username?: string | null; phone?: string | null; email?: string | null }; createdAt: string };
type Preview = { amount: number; currency: string; rule: { basis: string; basisAmount: number; ratePercent: number; capAmount?: number | null }; downlineCount: number; payoutStatus: string } | null;
type PendingAction = { kind: 'create' } | { kind: 'review'; id: string; next: 'APPROVED' | 'REJECTED' } | null;

export default function CommissionLedgersPage() {
  const [items, setItems] = useState<Commission[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [status, setStatus] = useState('ALL');
  const [agentProfileId, setAgentProfileId] = useState('');
  const [amount, setAmount] = useState('');
  const [basisAmount, setBasisAmount] = useState('');
  const [ratePercent, setRatePercent] = useState('5');
  const [capAmount, setCapAmount] = useState('');
  const [basis, setBasis] = useState('manual_basis');
  const [note, setNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [preview, setPreview] = useState<Preview>(null);
  const [message, setMessage] = useState('กำลังโหลด commission...');
  const [busyId, setBusyId] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, [status]);

  const stats = useMemo(() => ({
    pending: items.filter((item) => item.status === 'PENDING').length,
    approved: items.filter((item) => item.status === 'APPROVED').length,
    rejected: items.filter((item) => item.status === 'REJECTED').length,
    total: items.reduce((sum, item) => sum + Number(item.amount || 0), 0),
  }), [items]);

  async function load() {
    setLoading(true);
    setMessage('กำลังโหลด commission...');
    try {
      const params = new URLSearchParams();
      if (status !== 'ALL') params.set('status', status);
      const [commissionRes, agentRes] = await Promise.all([
        adminApiFetch(`/admin/commission-ledgers?${params.toString()}`),
        adminApiFetch('/admin/affiliates?status=RESOLVED'),
      ]);
      const commissionData = await commissionRes.json().catch(() => null);
      const agentData = await agentRes.json().catch(() => null);
      if (!commissionRes.ok) throw new Error('โหลด commission ไม่สำเร็จ');
      setItems(commissionData?.items ?? []);
      if (agentRes.ok) setAgents(agentData?.items ?? []);
      setMessage('');
    } catch {
      setItems([]);
      setMessage('โหลด commission ไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  async function calculate() {
    if (!agentProfileId || Number(basisAmount) <= 0) { setMessage('กรุณาเลือกตัวแทนและใส่ basis amount'); return; }
    setBusyId('preview');
    try {
      const res = await adminApiFetch('/admin/commission-ledgers/preview', { method: 'POST', body: JSON.stringify(payload(false)) });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error('คำนวณ commission ไม่สำเร็จ');
      setPreview(data);
      setAmount(String(data?.amount ?? ''));
      setMessage('คำนวณ commission แล้ว ยังไม่สร้าง ledger');
    } catch {
      setMessage('คำนวณ commission ไม่สำเร็จ กรุณาตรวจข้อมูลแล้วลองใหม่');
    } finally {
      setBusyId('');
    }
  }

  function requestCreate() {
    if (!agentProfileId || Number(basisAmount) <= 0) { setMessage('กรุณาเลือกตัวแทนและใส่ basis amount'); return; }
    if (!preview) { setMessage('กรุณากด Preview และตรวจสูตรก่อนสร้าง Ledger'); return; }
    setMessage('');
    setPendingAction({ kind: 'create' });
  }

  function requestReview(item: Commission, next: 'APPROVED' | 'REJECTED') {
    if (item.status === 'APPROVED' || item.status === 'REJECTED') { setMessage('รายการนี้ปิดการตรวจแล้ว'); return; }
    if (next === 'REJECTED' && !rejectReason.trim()) { setMessage('กรุณาใส่เหตุผลที่ปฏิเสธก่อนยืนยัน'); return; }
    setMessage('');
    setPendingAction({ kind: 'review', id: item.id, next });
  }

  async function create() {
    if (!agentProfileId || Number(basisAmount) <= 0) { setMessage('กรุณาเลือกตัวแทนและใส่ basis amount'); return; }
    setBusyId('create');
    try {
      const res = await adminApiFetch('/admin/commission-ledgers', { method: 'POST', body: JSON.stringify(payload(true)) });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error('สร้าง commission ไม่สำเร็จ');
      setItems((current) => [data.item, ...current]);
      setAmount(''); setBasisAmount(''); setCapAmount(''); setNote(''); setPreview(null);
      setMessage('สร้าง commission แล้ว ยังไม่ payout จริง');
    } catch {
      setMessage('สร้าง commission ไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setBusyId('');
      setPendingAction(null);
    }
  }

  function payload(includeAmount: boolean) {
    return { agentProfileId, basis, basisAmount: Number(basisAmount), ratePercent: Number(ratePercent || 0), capAmount: capAmount ? Number(capAmount) : undefined, amount: includeAmount && amount ? Number(amount) : undefined, note };
  }

  async function review(id: string, next: 'APPROVED' | 'REJECTED') {
    if (next === 'REJECTED' && !rejectReason.trim()) { setMessage('กรุณาใส่เหตุผลที่ปฏิเสธ'); return; }
    setBusyId(id);
    try {
      const res = await adminApiFetch(`/admin/commission-ledgers/${id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next, adminNote: next === 'REJECTED' ? rejectReason.trim() : 'อนุมัติจากหน้า Commission' }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error('ตรวจ commission ไม่สำเร็จ');
      setItems((current) => current.map((item) => item.id === id ? data.item : item));
      setRejectReason('');
      setMessage(next === 'APPROVED' ? 'อนุมัติ commission แล้ว แต่ payout ยังปิดอยู่' : 'ปฏิเสธ commission แล้ว');
    } catch {
      setMessage('ตรวจ commission ไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setBusyId('');
      setPendingAction(null);
    }
  }

  const confirmTitle = pendingAction?.kind === 'create' ? 'ยืนยันสร้าง Commission Ledger' : pendingAction?.kind === 'review' && pendingAction.next === 'REJECTED' ? 'ยืนยันปฏิเสธ Commission' : 'ยืนยันอนุมัติ Commission';
  const confirmDescription = pendingAction?.kind === 'create' ? 'รายการจะเข้าสู่คิวตรวจและยังไม่จ่ายเงินจริง' : pendingAction?.kind === 'review' && pendingAction.next === 'REJECTED' ? 'ต้องระบุเหตุผลเพื่อบันทึกใน audit trail' : 'อนุมัติรายการนี้โดยยังไม่ payout จริง';

  return <AdminPage eyebrow="Affiliate Ops" title="Commission Ledger" description="คำนวณและตรวจ commission แบบ ledger review เท่านั้น ยังไม่จ่ายเงินจริงเข้า wallet" actions={<AdminButton disabled={loading || Boolean(busyId)} onClick={() => void load()}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton>}>
    {message && <AdminNotice tone={message.includes('ไม่สำเร็จ') || message.includes('กรุณา') || message.includes('ปิดการตรวจ') ? 'danger' : 'neutral'}>{message}</AdminNotice>}
    <AdminMetricGrid><AdminMetric tone="warning" title="รอตรวจ" value={String(stats.pending)} /><AdminMetric tone="success" title="อนุมัติ" value={String(stats.approved)} /><AdminMetric tone="danger" title="ปฏิเสธ" value={String(stats.rejected)} /><AdminMetric tone="warning" title="ยอดรวม" value={money(stats.total)} /></AdminMetricGrid>
    <AdminCard title="คำนวณ / สร้าง Commission" tone="warning"><AdminStack><div style={formGridStyle}><select aria-label="เลือกตัวแทน" disabled={loading || Boolean(busyId)} value={agentProfileId} onChange={(event) => setAgentProfileId(event.target.value)} style={inputStyle}><option value="">เลือกตัวแทนที่อนุมัติแล้ว</option>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.displayName} · {agent.referralCode}</option>)}</select><input aria-label="Basis amount" disabled={loading || Boolean(busyId)} type="number" value={basisAmount} onChange={(event) => setBasisAmount(event.target.value)} placeholder="Basis amount เช่น ยอดฝากใต้สาย" style={inputStyle} /><input aria-label="Commission rate percent" disabled={loading || Boolean(busyId)} type="number" value={ratePercent} onChange={(event) => setRatePercent(event.target.value)} placeholder="Rate %" style={inputStyle} /><input aria-label="Commission cap amount" disabled={loading || Boolean(busyId)} type="number" value={capAmount} onChange={(event) => setCapAmount(event.target.value)} placeholder="Cap amount ไม่บังคับ" style={inputStyle} /><input aria-label="Commission basis" disabled={loading || Boolean(busyId)} value={basis} onChange={(event) => setBasis(event.target.value)} placeholder="basis" style={inputStyle} /><input aria-label="Final commission amount" disabled={loading || Boolean(busyId)} type="number" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="ยอด final override ได้" style={inputStyle} /><input aria-label="Commission note" disabled={loading || Boolean(busyId)} value={note} onChange={(event) => setNote(event.target.value)} placeholder="หมายเหตุ" style={inputStyle} /></div>{preview && <section style={previewStyle}><AdminRow><strong>Preview amount</strong><span>{money(preview.amount)} {preview.currency}</span></AdminRow><AdminRow><strong>สูตร</strong><span>{money(preview.rule.basisAmount)} × {preview.rule.ratePercent}% {preview.rule.capAmount ? `cap ${money(preview.rule.capAmount)}` : ''}</span></AdminRow><AdminRow><strong>Downline</strong><span>{preview.downlineCount} คน</span></AdminRow><AdminRow><strong>Payout</strong><span>{preview.payoutStatus}</span></AdminRow></section>}<div style={actionRowStyle}><AdminButton disabled={Boolean(busyId)} tone="secondary" onClick={() => void calculate()}>{busyId === 'preview' ? 'กำลังคำนวณ...' : 'Preview'}</AdminButton><AdminButton disabled={Boolean(busyId)} onClick={requestCreate}>สร้าง Ledger</AdminButton></div></AdminStack></AdminCard>
    <AdminToolbar><select aria-label="กรอง Commission ตามสถานะ" disabled={loading || Boolean(busyId)} value={status} onChange={(event) => setStatus(event.target.value)} style={inputStyle}><option value="ALL">ทุกสถานะ</option><option value="OPEN">รอตรวจ</option><option value="REVIEWING">กำลังตรวจ</option><option value="RESOLVED">อนุมัติ</option><option value="DISMISSED">ปฏิเสธ</option></select><input aria-label="เหตุผลที่ปฏิเสธ Commission" disabled={loading || Boolean(busyId)} value={rejectReason} onChange={(event) => setRejectReason(event.target.value)} placeholder="เหตุผลที่ปฏิเสธ (บังคับเมื่อ Reject)" style={inputStyle} /></AdminToolbar>
    {loading && items.length === 0 ? <AdminSkeleton lines={6} /> : <AdminGrid>{items.map((item) => <AdminCard key={item.id} title={`${item.referralCode} · ${money(item.amount)}`} description={`${memberLabel(item)} · ${new Date(item.createdAt).toLocaleString('th-TH')}`} tone={item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'warning'}><AdminStack><AdminRow><strong>สถานะ</strong><AdminBadge tone={statusTone(item.status)}>{statusLabel(item.status)}</AdminBadge></AdminRow><AdminRow><strong>Basis</strong><span>{item.basis}</span></AdminRow><AdminRow><strong>สูตร</strong><span>{money(item.basisAmount ?? 0)} × {item.ratePercent ?? 0}% {item.capAmount ? `cap ${money(item.capAmount)}` : ''}</span></AdminRow><AdminRow><strong>Calculated</strong><span>{money(item.calculatedAmount ?? item.amount)} {item.manualOverride ? '· override' : ''}</span></AdminRow><AdminRow><strong>Payout</strong><span>{item.payoutStatus}</span></AdminRow>{item.note && <AdminRow><strong>หมายเหตุ</strong><span>{item.note}</span></AdminRow>}<div style={actionRowStyle}><AdminButton disabled={Boolean(busyId)} tone="secondary" onClick={() => requestReview(item, 'APPROVED')}>อนุมัติ</AdminButton><AdminButton disabled={Boolean(busyId)} tone="danger" onClick={() => requestReview(item, 'REJECTED')}>ปฏิเสธ</AdminButton></div></AdminStack></AdminCard>)}{!loading && items.length === 0 && <AdminEmpty>ยังไม่มี commission ledger</AdminEmpty>}</AdminGrid>}
    <AdminConfirmDialog open={Boolean(pendingAction)} title={confirmTitle} description={confirmDescription} confirmLabel="ยืนยัน" tone={pendingAction?.kind === 'review' && pendingAction.next === 'REJECTED' ? 'danger' : 'primary'} busy={Boolean(busyId)} onCancel={() => { if (!busyId) setPendingAction(null); }} onConfirm={() => { if (pendingAction?.kind === 'create') void create(); else if (pendingAction?.kind === 'review') void review(pendingAction.id, pendingAction.next); }} />
  </AdminPage>;
}

function memberLabel(item: Commission) { return item.member?.username ?? item.member?.phone ?? item.member?.email ?? '-'; }
function statusTone(status: string) { if (status === 'APPROVED') return 'success'; if (status === 'REJECTED') return 'danger'; if (status === 'REVIEWING') return 'warning'; return 'neutral'; }
function statusLabel(status: string) { const map: Record<string, string> = { PENDING: 'รอตรวจ', REVIEWING: 'กำลังตรวจ', APPROVED: 'อนุมัติ', REJECTED: 'ปฏิเสธ' }; return map[status] ?? status; }
function money(value: number) { const next = Number(value); return `THB ${(Number.isFinite(next) ? next : 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }
const inputStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 0 } as const;
const formGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: 10 } as const;
const actionRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const previewStyle = { border: '1px solid rgba(245,197,66,.24)', borderRadius: 16, padding: 12, background: 'rgba(245,197,66,.08)', display: 'grid', gap: 8 } as const;