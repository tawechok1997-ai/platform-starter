'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminEmpty, AdminGrid, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type MemberBank = { id: string; userId: string; bankName: string; accountName: string; accountNumber: string; status: string; adminNote?: string | null; flags?: string[]; user?: { username?: string | null; phone?: string | null; email?: string | null; status?: string; phoneVerifiedAt?: string | null } };
type KycSummary = { summary?: { pending?: number; active?: number; rejected?: number; disabled?: number; duplicateGroups?: number; unverifiedPhones?: number }; duplicateGroups?: Array<{ accountNumber: string; count: number; items: MemberBank[] }>; riskyAccounts?: MemberBank[] };
type ReviewStatus = 'ACTIVE' | 'REJECTED' | 'DISABLED';
type PendingReview = { item: MemberBank; status: ReviewStatus };
type KycCase = { id: string; status: string; riskLevel?: string | null; reviewNote?: string | null; version: number; createdAt: string; reviewedAt?: string | null; member?: { username?: string | null }; documentCount?: number };
type KycDocument = { id: string; documentType: string; status: string; originalName: string; reviewNote?: string | null; version: number; createdAt: string };
type KycCaseDetail = { item: KycCase; documents: KycDocument[] };
type PendingKycReview = { item: KycCase; status: 'REVIEWING' | 'APPROVED' | 'REJECTED' } | null;
const KYC_STATUSES = ['ALL', 'DRAFT', 'SUBMITTED', 'REVIEWING', 'APPROVED', 'REJECTED', 'EXPIRED'];

export default function KycCenterPage() {
  const [summary, setSummary] = useState<KycSummary>({});
  const [accounts, setAccounts] = useState<MemberBank[]>([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('กำลังโหลดข้อมูลบัญชี...');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState('');
  const [pendingReview, setPendingReview] = useState<PendingReview | null>(null);
  const [kycStatus, setKycStatus] = useState('ALL');
  const [kycCases, setKycCases] = useState<KycCase[]>([]);
  const [kycLoading, setKycLoading] = useState(false);
  const [selectedKyc, setSelectedKyc] = useState<KycCaseDetail | null>(null);
  const [kycNote, setKycNote] = useState('');
  const [pendingKycReview, setPendingKycReview] = useState<PendingKycReview>(null);

  useEffect(() => { void load(); void loadKycCases(); }, []);
  const queue = useMemo(() => accounts.filter((item) => item.status === 'PENDING_REVIEW'), [accounts]);

  async function load() {
    setMessage('กำลังโหลดข้อมูลบัญชี...');
    const [summaryRes, accountRes] = await Promise.all([
      adminApiFetch('/admin/member-bank-accounts/kyc-summary'),
      adminApiFetch(`/admin/member-bank-accounts${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''}`),
    ]);
    const summaryData = await summaryRes.json().catch(() => null);
    const accountData = await accountRes.json().catch(() => null);
    if (summaryRes.ok) setSummary(summaryData ?? {});
    if (accountRes.ok) setAccounts(accountData.items ?? []);
    if (!summaryRes.ok || !accountRes.ok) {
      setMessage(summaryData?.message ?? accountData?.message ?? 'โหลดข้อมูลบัญชีไม่สำเร็จ');
      return;
    }
    setMessage('');
  }

  async function loadKycCases(nextStatus = kycStatus) {
    setKycLoading(true);
    const params = new URLSearchParams({ take: '50' });
    if (nextStatus !== 'ALL') params.set('status', nextStatus);
    const res = await adminApiFetch(`/admin/kyc/cases?${params.toString()}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) setMessage(data?.message ?? 'โหลดรายการ KYC ไม่สำเร็จ');
    else setKycCases(data.items ?? []);
    setKycLoading(false);
  }

  async function openKycCase(id: string) {
    const res = await adminApiFetch(`/admin/kyc/cases/${id}`);
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.item) { setMessage(data?.message ?? 'โหลดรายละเอียด KYC ไม่สำเร็จ'); return; }
    setSelectedKyc(data as KycCaseDetail);
    setKycNote('');
  }

  async function confirmKycReview() {
    if (!pendingKycReview) return;
    const note = kycNote.trim();
    if (pendingKycReview.status === 'REJECTED' && note.length < 5) { setMessage('ต้องระบุเหตุผลปฏิเสธ KYC อย่างน้อย 5 ตัวอักษร'); return; }
    setBusyId(pendingKycReview.item.id);
    const res = await adminApiFetch(`/admin/kyc/cases/${pendingKycReview.item.id}/review`, { method: 'PATCH', body: JSON.stringify({ status: pendingKycReview.status, note: note || undefined, version: pendingKycReview.item.version }) });
    const data = await res.json().catch(() => null);
    setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'อัปเดต KYC ไม่สำเร็จ'); return; }
    setPendingKycReview(null);
    setSelectedKyc((current) => current ? { ...current, item: { ...current.item, ...data.item } } : current);
    setMessage(`อัปเดต KYC เป็น ${kycStatusLabel(pendingKycReview.status)} แล้ว`);
    void loadKycCases();
  }

  function requestReview(item: MemberBank, status: ReviewStatus) {
    const adminNote = (notes[item.id] ?? '').trim();
    if (status !== 'ACTIVE' && !adminNote) {
      setMessage('กรุณาระบุเหตุผลก่อนปฏิเสธหรือปิดบัญชี');
      return;
    }
    setPendingReview({ item, status });
  }

  async function confirmReview() {
    if (!pendingReview) return;
    const { item, status } = pendingReview;
    const adminNote = (notes[item.id] ?? '').trim();
    setBusyId(item.id);
    const res = await adminApiFetch(`/admin/member-bank-accounts/${item.id}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ status, adminNote }),
    });
    const data = await res.json().catch(() => null);
    setBusyId('');
    if (!res.ok) {
      setMessage(data?.message ?? 'ตรวจบัญชีไม่สำเร็จ');
      return;
    }
    setPendingReview(null);
    setMessage(status === 'ACTIVE' ? 'อนุมัติบัญชีแล้ว' : status === 'REJECTED' ? 'ปฏิเสธบัญชีแล้ว' : 'ปิดบัญชีแล้ว');
    setAccounts((current) => current.map((entry) => entry.id === item.id ? { ...entry, ...data.item } : entry));
    void load();
  }

  return <AdminPage eyebrow="ตรวจสอบสมาชิก" title="ตรวจบัญชีธนาคาร" description="ตรวจชื่อบัญชี เลขบัญชีซ้ำ และข้อมูลเสี่ยงก่อนอนุญาตให้ถอนเงิน">
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminMetricGrid>
      <AdminMetric tone={(summary.summary?.pending ?? 0) > 0 ? 'warning' : 'success'} title="รอตรวจ" value={String(summary.summary?.pending ?? 0)} />
      <AdminMetric tone={(summary.summary?.duplicateGroups ?? 0) > 0 ? 'danger' : 'success'} title="เลขบัญชีซ้ำ" value={String(summary.summary?.duplicateGroups ?? 0)} />
      <AdminMetric tone={(summary.summary?.unverifiedPhones ?? 0) > 0 ? 'warning' : 'success'} title="ยังไม่ยืนยันเบอร์" value={String(summary.summary?.unverifiedPhones ?? 0)} />
      <AdminMetric tone="success" title="อนุมัติแล้ว" value={String(summary.summary?.active ?? 0)} />
    </AdminMetricGrid>
    <AdminCard title="KYC review queue" description="ตรวจเอกสาร ยืนยันความเสี่ยง และอนุมัติเป็นขั้นตอน">
      <AdminToolbar><label style={fieldStyle}>สถานะ KYC<select value={kycStatus} onChange={(event) => { setKycStatus(event.target.value); void loadKycCases(event.target.value); }}>{KYC_STATUSES.map((value) => <option key={value} value={value}>{kycStatusLabel(value)}</option>)}</select></label><AdminButton tone="secondary" disabled={kycLoading} onClick={() => void loadKycCases()}>{kycLoading ? 'กำลังโหลด...' : 'รีเฟรช KYC'}</AdminButton></AdminToolbar>
      <AdminStack>{kycCases.map((item) => <AdminRow key={item.id}><div><div style={flagRowStyle}><AdminBadge tone={kycTone(item.status)}>{kycStatusLabel(item.status)}</AdminBadge>{item.riskLevel && <AdminBadge tone={item.riskLevel === 'HIGH' || item.riskLevel === 'CRITICAL' ? 'danger' : 'warning'}>Risk: {item.riskLevel}</AdminBadge>}</div><strong>{item.member?.username ?? item.id.slice(0, 8)}</strong><p style={mutedStyle}>{item.documentCount ?? 0} เอกสาร · ส่งเมื่อ {new Date(item.createdAt).toLocaleString('th-TH')}</p>{item.reviewNote && <p style={mutedStyle}>เหตุผล: {item.reviewNote}</p>}</div><AdminButton tone="secondary" onClick={() => void openKycCase(item.id)}>เปิด checklist</AdminButton></AdminRow>)}{!kycLoading && kycCases.length === 0 && <AdminEmpty>ไม่มีรายการ KYC ตามตัวกรอง</AdminEmpty>}</AdminStack>
    </AdminCard>
    <AdminToolbar>
      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาชื่อสมาชิก ธนาคาร หรือเลขบัญชี" style={inputStyle} />
      <AdminButton onClick={() => void load()}>ค้นหา</AdminButton>
    </AdminToolbar>
    {(summary.duplicateGroups ?? []).length > 0 && <AdminCard title="เลขบัญชีซ้ำ" description="ตรวจเจ้าของบัญชีและข้อมูลสมาชิกทุกคนก่อนอนุมัติ" tone="danger"><AdminStack>{summary.duplicateGroups?.map((group) => <AdminRow key={group.accountNumber}><strong>{maskAccountNumber(group.accountNumber)}</strong><span>{group.count} บัญชี</span></AdminRow>)}</AdminStack></AdminCard>}
    <AdminGrid>
      <AdminCard title="บัญชีรอตรวจ" description="รายการที่ยังไม่ได้อนุมัติ" tone={queue.length > 0 ? 'warning' : 'success'}>
        <AdminStack>{queue.map((item) => <BankReviewCard key={item.id} item={item} note={notes[item.id] ?? ''} busy={busyId === item.id} onNote={(value) => setNotes((current) => ({ ...current, [item.id]: value }))} onReview={(status) => requestReview(item, status)} />)}{queue.length === 0 && <AdminEmpty>ไม่มีบัญชีรอตรวจ</AdminEmpty>}</AdminStack>
      </AdminCard>
      <AdminCard title="บัญชีที่ควรตรวจเพิ่ม" description="รายการที่ระบบพบข้อมูลผิดปกติ">
        <AdminStack>{(summary.riskyAccounts ?? []).slice(0, 20).map((item) => <RiskRow key={item.id} item={item} />)}{(summary.riskyAccounts ?? []).length === 0 && <AdminEmpty>ยังไม่พบรายการเสี่ยง</AdminEmpty>}</AdminStack>
      </AdminCard>
    </AdminGrid>
    <AdminCard title="บัญชีทั้งหมด" description="รายการล่าสุดไม่เกิน 200 รายการ">
      <AdminStack>{accounts.map((item) => <BankReviewCard key={item.id} item={item} note={notes[item.id] ?? ''} busy={busyId === item.id} onNote={(value) => setNotes((current) => ({ ...current, [item.id]: value }))} onReview={(status) => requestReview(item, status)} compact />)}{accounts.length === 0 && <AdminEmpty>ยังไม่มีบัญชีสมาชิก</AdminEmpty>}</AdminStack>
    </AdminCard>
    <AdminConfirmDialog
      open={Boolean(pendingReview)}
      title={pendingReview ? reviewTitle(pendingReview.status) : ''}
      description={pendingReview ? reviewDescription(pendingReview.status) : ''}
      confirmLabel={pendingReview ? reviewConfirmLabel(pendingReview.status) : 'ยืนยัน'}
      tone={pendingReview?.status === 'ACTIVE' ? 'success' : 'danger'}
      busy={Boolean(pendingReview && busyId === pendingReview.item.id)}
      onCancel={() => setPendingReview(null)}
      onConfirm={() => void confirmReview()}
      details={pendingReview ? <><p><strong>สมาชิก:</strong> {pendingReview.item.user?.username ?? pendingReview.item.userId}</p><p><strong>บัญชี:</strong> {pendingReview.item.bankName} · {maskAccountNumber(pendingReview.item.accountNumber)}</p><p><strong>เหตุผล:</strong> {(notes[pendingReview.item.id] ?? '').trim() || '-'}</p></> : null}
    />
    {selectedKyc && <div style={kycDrawerLayerStyle} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedKyc(null); }}><aside style={kycDrawerStyle} aria-label="รายละเอียด KYC"><AdminStack><AdminRow><div><p style={mutedStyle}>KYC checklist</p><h2 style={{ margin: 0 }}>{selectedKyc.item.member?.username ?? selectedKyc.item.id.slice(0, 8)}</h2></div><AdminButton tone="ghost" onClick={() => setSelectedKyc(null)}>ปิด</AdminButton></AdminRow><AdminRow><span>สถานะ</span><AdminBadge tone={kycTone(selectedKyc.item.status)}>{kycStatusLabel(selectedKyc.item.status)}</AdminBadge></AdminRow>{selectedKyc.item.riskLevel && <AdminRow><span>Risk reason</span><strong>{selectedKyc.item.riskLevel}</strong></AdminRow>}<AdminCard title="เอกสาร" description="สถานะตรวจเอกสารแต่ละรายการ" compact><AdminStack>{selectedKyc.documents.map((document) => <AdminRow key={document.id}><div><strong>{kycDocumentLabel(document.documentType)}</strong><p style={mutedStyle}>{document.originalName}</p>{document.reviewNote && <p style={mutedStyle}>หมายเหตุ: {document.reviewNote}</p>}</div><AdminBadge tone={document.status === 'ACCEPTED' ? 'success' : document.status === 'REJECTED' ? 'danger' : 'warning'}>{document.status}</AdminBadge></AdminRow>)}{selectedKyc.documents.length === 0 && <AdminEmpty>ยังไม่มีเอกสาร</AdminEmpty>}</AdminStack></AdminCard><label style={fieldStyle}>เหตุผลสำหรับการตัดสินใจ<textarea value={kycNote} onChange={(event) => setKycNote(event.target.value)} style={textareaStyle} placeholder="จำเป็นเมื่อปฏิเสธ" /></label><div style={actionRowStyle}><AdminButton tone="secondary" disabled={busyId === selectedKyc.item.id || selectedKyc.item.status === 'REVIEWING'} onClick={() => setPendingKycReview({ item: selectedKyc.item, status: 'REVIEWING' })}>เริ่มตรวจ</AdminButton><AdminButton tone="success" disabled={busyId === selectedKyc.item.id || selectedKyc.item.status === 'APPROVED'} onClick={() => setPendingKycReview({ item: selectedKyc.item, status: 'APPROVED' })}>อนุมัติ</AdminButton><AdminButton tone="danger" disabled={busyId === selectedKyc.item.id || selectedKyc.item.status === 'REJECTED'} onClick={() => setPendingKycReview({ item: selectedKyc.item, status: 'REJECTED' })}>ปฏิเสธ</AdminButton></div></AdminStack></aside></div>}
    <AdminConfirmDialog open={Boolean(pendingKycReview)} title={pendingKycReview ? `${kycStatusLabel(pendingKycReview.status)} KYC` : ''} description={pendingKycReview?.status === 'REJECTED' ? 'ต้องระบุเหตุผลก่อนปฏิเสธ KYC' : 'ยืนยันการเปลี่ยนสถานะ KYC'} confirmLabel="ยืนยัน" tone={pendingKycReview?.status === 'REJECTED' ? 'danger' : pendingKycReview?.status === 'APPROVED' ? 'success' : 'primary'} busy={Boolean(pendingKycReview && busyId === pendingKycReview.item.id)} onCancel={() => setPendingKycReview(null)} onConfirm={() => void confirmKycReview()} details={pendingKycReview?.status === 'REJECTED' ? <p>เหตุผล: {kycNote.trim() || '-'}</p> : undefined} />
  </AdminPage>;
}

function BankReviewCard({ item, note, busy, onNote, onReview, compact = false }: { item: MemberBank; note: string; busy: boolean; compact?: boolean; onNote: (value: string) => void; onReview: (status: ReviewStatus) => void }) {
  return <section style={cardletStyle}><AdminRow><div><strong>{item.accountName}</strong><p style={mutedStyle}>{item.bankName} · {maskAccountNumber(item.accountNumber)}</p><p style={mutedStyle}>สมาชิก: {item.user?.username ?? item.user?.phone ?? item.userId}</p></div><div style={rightStyle}><AdminBadge tone={statusTone(item.status)}>{statusLabel(item.status)}</AdminBadge>{item.user?.phoneVerifiedAt ? <AdminBadge tone="success">ยืนยันเบอร์แล้ว</AdminBadge> : <AdminBadge tone="warning">ยังไม่ยืนยันเบอร์</AdminBadge>}</div></AdminRow>{(item.flags ?? []).length > 0 && <div style={flagRowStyle}>{item.flags?.map((flag) => <AdminBadge key={flag} tone={flag.includes('ซ้ำ') ? 'danger' : 'warning'}>{flag}</AdminBadge>)}</div>}{!compact && <label style={fieldStyle}>หมายเหตุผู้ดูแล<textarea value={note} onChange={(event) => onNote(event.target.value)} style={textareaStyle} placeholder="จำเป็นเมื่อปฏิเสธหรือปิดบัญชี" /></label>}<div style={actionRowStyle}><AdminButton disabled={busy || item.status === 'ACTIVE'} tone="success" onClick={() => onReview('ACTIVE')}>อนุมัติ</AdminButton><AdminButton disabled={busy || item.status === 'REJECTED'} tone="danger" onClick={() => onReview('REJECTED')}>ปฏิเสธ</AdminButton><AdminButton disabled={busy || item.status === 'DISABLED'} tone="secondary" onClick={() => onReview('DISABLED')}>ปิดบัญชี</AdminButton></div></section>;
}
function RiskRow({ item }: { item: MemberBank }) { return <AdminRow><div><strong>{item.accountName}</strong><p style={mutedStyle}>{item.bankName} · {maskAccountNumber(item.accountNumber)}</p></div><div style={rightStyle}>{(item.flags ?? []).map((flag) => <AdminBadge key={flag} tone={flag.includes('ซ้ำ') ? 'danger' : 'warning'}>{flag}</AdminBadge>)}</div></AdminRow>; }
function maskAccountNumber(value: string) { const visible = value.slice(-4); return `${'•'.repeat(Math.max(value.length - visible.length, 4))}${visible}`; }
function statusTone(status: string) { if (status === 'ACTIVE') return 'success'; if (status === 'REJECTED' || status === 'DISABLED') return 'danger'; return 'warning'; }
function statusLabel(status: string) { const map: Record<string, string> = { ACTIVE: 'อนุมัติแล้ว', PENDING_REVIEW: 'รอตรวจ', REJECTED: 'ปฏิเสธ', DISABLED: 'ปิดบัญชี' }; return map[status] ?? status; }
function reviewTitle(status: ReviewStatus) { return status === 'ACTIVE' ? 'อนุมัติบัญชีนี้?' : status === 'REJECTED' ? 'ปฏิเสธบัญชีนี้?' : 'ปิดบัญชีนี้?'; }
function reviewDescription(status: ReviewStatus) { return status === 'ACTIVE' ? 'บัญชีนี้จะใช้รับเงินถอนของสมาชิกได้' : status === 'REJECTED' ? 'สมาชิกต้องแก้ไขหรือเพิ่มบัญชีใหม่ก่อนใช้งาน' : 'บัญชีนี้จะถูกหยุดใช้งานจนกว่าจะเปิดอีกครั้ง'; }
function reviewConfirmLabel(status: ReviewStatus) { return status === 'ACTIVE' ? 'อนุมัติบัญชี' : status === 'REJECTED' ? 'ยืนยันปฏิเสธ' : 'ยืนยันปิดบัญชี'; }
function kycStatusLabel(status: string) { const map: Record<string, string> = { ALL: 'ทุกสถานะ', DRAFT: 'ร่าง', SUBMITTED: 'ส่งแล้ว', REVIEWING: 'กำลังตรวจ', APPROVED: 'อนุมัติ', REJECTED: 'ปฏิเสธ', EXPIRED: 'หมดอายุ' }; return map[status] ?? status; }
function kycTone(status: string) { if (status === 'APPROVED') return 'success'; if (status === 'REJECTED' || status === 'EXPIRED') return 'danger'; return 'warning'; }
function kycDocumentLabel(type: string) { const map: Record<string, string> = { NATIONAL_ID_FRONT: 'บัตรประชาชนด้านหน้า', NATIONAL_ID_BACK: 'บัตรประชาชนด้านหลัง', PASSPORT: 'Passport', SELFIE: 'รูปยืนยันตัวตน', ADDRESS_PROOF: 'หลักฐานที่อยู่', BANK_PROOF: 'หลักฐานบัญชีธนาคาร', OTHER: 'เอกสารอื่น' }; return map[type] ?? type; }
const inputStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 240 } as const;
const mutedStyle = { margin: '4px 0 0', color: '#94a3b8', lineHeight: 1.5 } as const;
const cardletStyle = { border: '1px solid rgba(148,163,184,.14)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,.04)', display: 'grid', gap: 10, minWidth: 0 } as const;
const rightStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'flex-end', alignItems: 'center' };
const flagRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const actionRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const fieldStyle = { display: 'grid', gap: 6, fontWeight: 850 } as const;
const textareaStyle = { minHeight: 80, borderRadius: 14, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: 12, resize: 'vertical' as const, minWidth: 0 };
const kycDrawerLayerStyle = { position: 'fixed' as const, inset: 0, zIndex: 9000, display: 'flex', justifyContent: 'flex-end', background: 'rgba(2,6,23,.62)', backdropFilter: 'blur(5px)' };
const kycDrawerStyle = { width: 'min(600px, 100%)', height: '100%', overflow: 'auto' as const, padding: 24, background: '#111823', borderLeft: '1px solid rgba(148,163,184,.22)' };
