'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminDrawer, AdminEmpty, AdminGrid, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type LinkedTopup = { id: string; amount: number; currency: string; status: string; method?: string | null; referenceCode?: string | null; createdAt?: string; reviewedAt?: string | null };
type Claim = { id: string; campaignId: string; topupId?: string | null; linkedTopup?: LinkedTopup | null; depositAmount?: number; campaign?: { title?: string; bonusType?: string; bonusValue?: number; minDeposit?: number; maxBonus?: number; turnoverMultiplier?: number }; status: string; rawStatus: string; memberNote?: string; adminNote?: string; settlement?: { enabled?: boolean; reason?: string }; events?: Array<{ by: string; action: string; message?: string; createdAt: string }>; member?: { username?: string | null; phone?: string | null; email?: string | null }; createdAt: string; resolvedAt?: string | null };
type PendingReview = { id: string; next: 'APPROVED' | 'REJECTED' } | null;

export default function PromotionClaimsPage() {
  const [items, setItems] = useState<Claim[]>([]);
  const [status, setStatus] = useState('ALL');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('กำลังโหลดคำขอรับโปรโมชัน...');
  const [busyId, setBusyId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [pendingReview, setPendingReview] = useState<PendingReview>(null);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  useEffect(() => { void load(); }, [status]);

  const counts = useMemo(() => ({
    pending: items.filter((item) => item.status === 'PENDING').length,
    reviewing: items.filter((item) => item.status === 'REVIEWING').length,
    approved: items.filter((item) => item.status === 'APPROVED').length,
    rejected: items.filter((item) => item.status === 'REJECTED').length,
  }), [items]);

  async function load() {
    setIsLoading(true);
    setMessage('กำลังโหลดคำขอรับโปรโมชัน...');
    try {
      const params = new URLSearchParams();
      if (status !== 'ALL') params.set('status', status);
      const res = await adminApiFetch(`/admin/promotion-claims?${params.toString()}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) { setMessage(data?.message ?? 'โหลดคำขอรับโปรโมชันไม่สำเร็จ'); return; }
      setItems(data.items ?? []);
      setMessage('');
    } catch {
      setMessage('เชื่อมต่อระบบโปรโมชันไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setIsLoading(false);
    }
  }

  function requestReview(id: string, next: 'APPROVED' | 'REJECTED') {
    const adminNote = (notes[id] ?? '').trim();
    if (next === 'REJECTED' && !adminNote) { setMessage('กรุณาใส่เหตุผลก่อนปฏิเสธคำขอ'); return; }
    setMessage('');
    setPendingReview({ id, next });
  }

  async function confirmReview() {
    if (!pendingReview) return;
    const { id, next } = pendingReview;
    const adminNote = (notes[id] ?? '').trim();
    setBusyId(id);
    try {
      const res = await adminApiFetch(`/admin/promotion-claims/${id}/review`, { method: 'PATCH', body: JSON.stringify({ status: next, adminNote }) });
      const data = await res.json().catch(() => null);
      if (!res.ok) { setMessage(data?.message ?? 'ตรวจคำขอไม่สำเร็จ'); return; }
      setItems((current) => current.map((item) => item.id === id ? data.item : item));
      setPendingReview(null);
      setMessage(next === 'APPROVED' ? 'อนุมัติคำขอแล้ว ระบบสร้างบัญชีโบนัสตามขั้นตอนที่กำหนด' : 'ปฏิเสธคำขอแล้ว');
    } catch {
      setMessage('เชื่อมต่อระบบตรวจคำขอไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setBusyId('');
    }
  }

  const pendingItem = pendingReview ? items.find((item) => item.id === pendingReview.id) : undefined;

  return <AdminPage eyebrow="งานโปรโมชัน" title="คำขอรับโปรโมชัน" description="ตรวจคำขอของสมาชิก ดูหลักฐานการฝาก และอนุมัติหรือปฏิเสธพร้อมบันทึกเหตุผล" actions={<AdminButton disabled={isLoading} onClick={() => void load()}>{isLoading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton>}>
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminMetricGrid>
      <AdminMetric tone={counts.pending > 0 ? 'warning' : 'success'} title="รอตรวจ" value={String(counts.pending)} />
      <AdminMetric tone="warning" title="กำลังตรวจ" value={String(counts.reviewing)} />
      <AdminMetric tone="success" title="อนุมัติแล้ว" value={String(counts.approved)} />
      <AdminMetric tone="danger" title="ปฏิเสธแล้ว" value={String(counts.rejected)} />
    </AdminMetricGrid>
    <AdminToolbar><select aria-label="กรองคำขอตามสถานะ" disabled={isLoading} value={status} onChange={(event) => setStatus(event.target.value)} style={selectStyle}><option value="ALL">ทุกสถานะ</option><option value="OPEN">รอตรวจ</option><option value="REVIEWING">กำลังตรวจ</option><option value="RESOLVED">อนุมัติแล้ว</option><option value="DISMISSED">ปฏิเสธแล้ว</option></select></AdminToolbar>
    <AdminGrid>{items.map((item) => <AdminCard key={item.id} title={item.campaign?.title ?? item.campaignId} description={`${new Date(item.createdAt).toLocaleString('th-TH')} · ${memberLabel(item)}`} tone={item.status === 'APPROVED' ? 'success' : item.status === 'REJECTED' ? 'danger' : 'warning'}><AdminStack>
      <AdminRow><strong>สถานะ</strong><AdminBadge tone={statusTone(item.status)}>{statusLabel(item.status)}</AdminBadge></AdminRow>
      <AdminRow><strong>SLA</strong><AdminBadge tone={slaTone(item)}>{slaLabel(item)}</AdminBadge></AdminRow>
      <AdminRow><strong>สมาชิก</strong><span>{memberLabel(item)}</span></AdminRow>
      <AdminRow><strong>รายการฝากที่ใช้</strong><span>{item.linkedTopup ? `${money(Number(item.linkedTopup.amount))} · ${topupStatusLabel(item.linkedTopup.status)} · ${item.linkedTopup.referenceCode ?? item.linkedTopup.id}` : item.topupId ?? '-'}</span></AdminRow>
      <AdminRow><strong>ยอดฝากที่ตรวจพบ</strong><span>{money(Number(item.depositAmount ?? item.linkedTopup?.amount ?? 0))}</span></AdminRow>
      <AdminRow><strong>เงื่อนไขโปรโมชัน</strong><span>โบนัส {bonusLabel(item)} · ฝากขั้นต่ำ {money(item.campaign?.minDeposit ?? 0)} · ยอดทำรายการ {item.campaign?.turnoverMultiplier ?? 0} เท่า</span></AdminRow>
      <AdminRow><strong>การจ่ายโบนัส</strong><span>{settlementLabel(item)}</span></AdminRow>
      {item.memberNote && <AdminRow><strong>หมายเหตุสมาชิก</strong><span>{item.memberNote}</span></AdminRow>}
      {item.adminNote && <AdminRow><strong>หมายเหตุผู้ดูแล</strong><span>{item.adminNote}</span></AdminRow>}
      <section aria-label="ประวัติคำขอ" style={timelineStyle}>{(item.events ?? []).length > 0 ? (item.events ?? []).slice(-4).map((event, index) => <div key={`${event.createdAt}-${index}`} style={eventStyle}><AdminBadge tone={event.by === 'admin' ? 'success' : event.by === 'member' ? 'warning' : 'neutral'}>{senderLabel(event.by)}</AdminBadge><strong>{eventActionLabel(event.action)}</strong><span>{event.message || '-'}</span><small>{new Date(event.createdAt).toLocaleString('th-TH')}</small></div>) : <small>ยังไม่มีประวัติการดำเนินการ</small>}</section>
      <textarea aria-label={`หมายเหตุผู้ดูแลสำหรับ ${memberLabel(item)}`} value={notes[item.id] ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="หมายเหตุผู้ดูแล โดยจำเป็นเมื่อปฏิเสธ" style={textareaStyle} />
      <div style={actionRowStyle}><AdminButton tone="secondary" onClick={() => setSelectedClaim(item)}>เปิด Review drawer</AdminButton><AdminButton disabled={busyId === item.id || item.status === 'APPROVED'} tone="success" onClick={() => requestReview(item.id, 'APPROVED')}>{busyId === item.id ? 'กำลังดำเนินการ...' : 'อนุมัติคำขอ'}</AdminButton><AdminButton disabled={busyId === item.id || item.status === 'REJECTED'} tone="danger" onClick={() => requestReview(item.id, 'REJECTED')}>{busyId === item.id ? 'กำลังดำเนินการ...' : 'ปฏิเสธคำขอ'}</AdminButton></div>
    </AdminStack></AdminCard>)}{!isLoading && items.length === 0 && <AdminEmpty>ยังไม่มีคำขอรับโปรโมชันในสถานะนี้</AdminEmpty>}</AdminGrid>
    <AdminConfirmDialog open={Boolean(pendingReview)} title={pendingReview?.next === 'APPROVED' ? 'ยืนยันการอนุมัติคำขอ' : 'ยืนยันการปฏิเสธคำขอ'} description={pendingReview?.next === 'APPROVED' ? 'ระบบจะอนุมัติคำขอและสร้างขั้นตอนบัญชีโบนัสต่อไป กรุณาตรวจหลักฐานและเงื่อนไขให้ครบก่อนดำเนินการ' : 'คำขอนี้จะถูกปฏิเสธและสมาชิกจะไม่สามารถรับโบนัสจากรายการนี้ได้'} confirmLabel={pendingReview?.next === 'APPROVED' ? 'ยืนยันอนุมัติ' : 'ยืนยันปฏิเสธ'} tone={pendingReview?.next === 'APPROVED' ? 'success' : 'danger'} busy={Boolean(pendingReview && busyId === pendingReview.id)} details={pendingItem ? <div style={confirmDetailsStyle}><strong>{pendingItem.campaign?.title ?? pendingItem.campaignId}</strong><span>{memberLabel(pendingItem)}</span><span>ยอดฝาก {money(Number(pendingItem.depositAmount ?? pendingItem.linkedTopup?.amount ?? 0))}</span>{(notes[pendingItem.id] ?? '').trim() && <span>หมายเหตุ: {(notes[pendingItem.id] ?? '').trim()}</span>}</div> : undefined} onConfirm={() => void confirmReview()} onCancel={() => { if (!busyId) setPendingReview(null); }} />
    <AdminDrawer open={Boolean(selectedClaim)} title={selectedClaim?.campaign?.title ?? selectedClaim?.campaignId ?? 'Promotion claim review'} description="ตรวจหลักฐาน รายละเอียด SLA และ timeline ก่อนตัดสินใจ" busy={Boolean(selectedClaim && busyId === selectedClaim.id)} onClose={() => { if (!busyId) setSelectedClaim(null); }}>
    {selectedClaim && <AdminStack><AdminRow><span>สมาชิก</span><strong>{memberLabel(selectedClaim)}</strong></AdminRow><AdminRow><span>หลักฐานรายการฝาก</span><strong>{selectedClaim.linkedTopup ? `${money(Number(selectedClaim.linkedTopup.amount))} · ${selectedClaim.linkedTopup.referenceCode ?? selectedClaim.linkedTopup.id}` : 'ไม่พบรายการฝากที่เชื่อมโยง'}</strong></AdminRow><AdminRow><span>สถานะรายการฝาก</span><AdminBadge tone={selectedClaim.linkedTopup?.status === 'COMPLETED' ? 'success' : 'warning'}>{selectedClaim.linkedTopup ? topupStatusLabel(selectedClaim.linkedTopup.status) : '-'}</AdminBadge></AdminRow><AdminRow><span>SLA</span><AdminBadge tone={slaTone(selectedClaim)}>{slaLabel(selectedClaim)}</AdminBadge></AdminRow><AdminCard title="Timeline" compact><AdminStack>{(selectedClaim.events ?? []).map((event, index) => <AdminRow key={`${event.createdAt}-${index}`}><div><strong>{eventActionLabel(event.action)}</strong><p style={{ margin: '4px 0 0', color: '#94a3b8' }}>{event.message || '-'}</p></div><small>{new Date(event.createdAt).toLocaleString('th-TH')}</small></AdminRow>)}{(selectedClaim.events ?? []).length === 0 && <AdminEmpty>ยังไม่มี timeline</AdminEmpty>}</AdminStack></AdminCard><label style={{ display: 'grid', gap: 6, fontWeight: 800 }}>เหตุผลผู้ดูแล<textarea aria-label="เหตุผลผู้ดูแลใน Review drawer" disabled={Boolean(busyId)} value={notes[selectedClaim.id] ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [selectedClaim.id]: event.target.value }))} placeholder="จำเป็นเมื่อปฏิเสธ" style={textareaStyle} /></label><div style={actionRowStyle}><AdminButton tone="success" disabled={Boolean(busyId) || selectedClaim.status === 'APPROVED'} onClick={() => requestReview(selectedClaim.id, 'APPROVED')}>อนุมัติ</AdminButton><AdminButton tone="danger" disabled={Boolean(busyId) || selectedClaim.status === 'REJECTED'} onClick={() => requestReview(selectedClaim.id, 'REJECTED')}>ปฏิเสธ</AdminButton></div></AdminStack>}
  </AdminDrawer>
  </AdminPage>;
}

function memberLabel(item: Claim) { return item.member?.username ?? item.member?.phone ?? item.member?.email ?? '-'; }
function statusTone(status: string) { if (status === 'APPROVED') return 'success'; if (status === 'REJECTED') return 'danger'; if (status === 'REVIEWING') return 'warning'; return 'neutral'; }
function statusLabel(status: string) { const map: Record<string, string> = { PENDING: 'รอตรวจ', REVIEWING: 'กำลังตรวจ', APPROVED: 'อนุมัติแล้ว', REJECTED: 'ปฏิเสธแล้ว' }; return map[status] ?? status; }
function topupStatusLabel(status: string) { const map: Record<string, string> = { PENDING: 'รอตรวจ', APPROVED: 'อนุมัติแล้ว', REJECTED: 'ปฏิเสธแล้ว', COMPLETED: 'เสร็จสมบูรณ์' }; return map[status] ?? status; }
function bonusLabel(item: Claim) { const value = Number(item.campaign?.bonusValue ?? 0); return item.campaign?.bonusType === 'fixed' ? money(value) : `${value}%`; }
function settlementLabel(item: Claim) { if (item.settlement?.enabled) return 'พร้อมเข้าสู่ขั้นตอนบัญชีโบนัส'; const reason = String(item.settlement?.reason ?? 'รอการอนุมัติและตรวจเงื่อนไข'); const map: Record<string, string> = { 'Bonus ledger is not enabled yet': 'ยังไม่เปิดบัญชีโบนัส', 'Bonus ledger pending approval': 'รออนุมัติคำขอ', 'Claim not approved': 'คำขอยังไม่ได้รับอนุมัติ' }; return map[reason] ?? reason; }
function senderLabel(sender: string) { const map: Record<string, string> = { admin: 'ผู้ดูแล', member: 'สมาชิก', system: 'ระบบ' }; return map[sender] ?? sender; }
function eventActionLabel(action: string) { const map: Record<string, string> = { CLAIM_CREATED: 'สร้างคำขอ', REVIEWING: 'เริ่มตรวจ', APPROVED: 'อนุมัติคำขอ', REJECTED: 'ปฏิเสธคำขอ' }; return map[action] ?? action; }
function money(value: number) { const amount = Number(value); return `THB ${(Number.isFinite(amount) ? amount : 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`; }
function slaLabel(item: Claim) { if (item.status === 'APPROVED' || item.status === 'REJECTED') return 'ปิด SLA แล้ว'; const minutes = Math.ceil((new Date(item.createdAt).getTime() + 4 * 60 * 60 * 1000 - Date.now()) / 60_000); if (minutes < 0) return `เกิน SLA ${Math.abs(minutes)} นาที`; if (minutes < 60) return `เหลือ ${minutes} นาที`; return `เหลือ ${Math.ceil(minutes / 60)} ชม.`; }
function slaTone(item: Claim) { if (item.status === 'APPROVED' || item.status === 'REJECTED') return 'success'; const minutes = Math.ceil((new Date(item.createdAt).getTime() + 4 * 60 * 60 * 1000 - Date.now()) / 60_000); return minutes <= 0 ? 'danger' : minutes <= 60 ? 'warning' : 'neutral'; }
const selectStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 180 } as const;
const textareaStyle = { minHeight: 88, borderRadius: 14, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: 12, resize: 'vertical' as const, minWidth: 0 };
const actionRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const timelineStyle = { border: '1px solid rgba(148,163,184,.14)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,.04)', display: 'grid', gap: 8 } as const;
const eventStyle = { display: 'grid', gap: 4, borderBottom: '1px solid rgba(148,163,184,.10)', paddingBottom: 8 } as const;
const confirmDetailsStyle = { display: 'grid', gap: 6 } as const;
