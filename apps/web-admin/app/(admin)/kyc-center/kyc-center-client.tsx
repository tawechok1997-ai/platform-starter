'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminEmpty, AdminGrid, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type MemberBank = { id: string; userId: string; bankName: string; accountName: string; accountNumber: string; status: string; adminNote?: string | null; flags?: string[]; user?: { username?: string | null; phone?: string | null; email?: string | null; status?: string; phoneVerifiedAt?: string | null } };
type KycSummary = { summary?: { pending?: number; active?: number; rejected?: number; disabled?: number; duplicateGroups?: number; unverifiedPhones?: number }; duplicateGroups?: Array<{ accountNumber: string; count: number; items: MemberBank[] }>; riskyAccounts?: MemberBank[] };
type ReviewStatus = 'ACTIVE' | 'REJECTED' | 'DISABLED';
type PendingReview = { item: MemberBank; status: ReviewStatus };

export default function KycCenterPage() {
  const [summary, setSummary] = useState<KycSummary>({});
  const [accounts, setAccounts] = useState<MemberBank[]>([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('กำลังโหลดข้อมูลบัญชี...');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState('');
  const [pendingReview, setPendingReview] = useState<PendingReview | null>(null);

  useEffect(() => { void load(); }, []);
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
    <AdminToolbar>
      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาชื่อสมาชิก ธนาคาร หรือเลขบัญชี" style={inputStyle} />
      <AdminButton onClick={() => void load()}>ค้นหา</AdminButton>
    </AdminToolbar>
    {(summary.duplicateGroups ?? []).length > 0 && <AdminCard title="เลขบัญชีซ้ำ" description="ตรวจเจ้าของบัญชีและข้อมูลสมาชิกทุกคนก่อนอนุมัติ" tone="danger"><AdminStack>{summary.duplicateGroups?.map((group) => <AdminRow key={group.accountNumber}><strong>{group.accountNumber}</strong><span>{group.count} บัญชี</span></AdminRow>)}</AdminStack></AdminCard>}
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
      details={pendingReview ? <><p><strong>สมาชิก:</strong> {pendingReview.item.user?.username ?? pendingReview.item.userId}</p><p><strong>บัญชี:</strong> {pendingReview.item.bankName} · {pendingReview.item.accountNumber}</p><p><strong>เหตุผล:</strong> {(notes[pendingReview.item.id] ?? '').trim() || '-'}</p></> : null}
    />
  </AdminPage>;
}

function BankReviewCard({ item, note, busy, onNote, onReview, compact = false }: { item: MemberBank; note: string; busy: boolean; compact?: boolean; onNote: (value: string) => void; onReview: (status: ReviewStatus) => void }) {
  return <section style={cardletStyle}><AdminRow><div><strong>{item.accountName}</strong><p style={mutedStyle}>{item.bankName} · {item.accountNumber}</p><p style={mutedStyle}>สมาชิก: {item.user?.username ?? item.user?.phone ?? item.userId}</p></div><div style={rightStyle}><AdminBadge tone={statusTone(item.status)}>{statusLabel(item.status)}</AdminBadge>{item.user?.phoneVerifiedAt ? <AdminBadge tone="success">ยืนยันเบอร์แล้ว</AdminBadge> : <AdminBadge tone="warning">ยังไม่ยืนยันเบอร์</AdminBadge>}</div></AdminRow>{(item.flags ?? []).length > 0 && <div style={flagRowStyle}>{item.flags?.map((flag) => <AdminBadge key={flag} tone={flag.includes('ซ้ำ') ? 'danger' : 'warning'}>{flag}</AdminBadge>)}</div>}{!compact && <label style={fieldStyle}>หมายเหตุผู้ดูแล<textarea value={note} onChange={(event) => onNote(event.target.value)} style={textareaStyle} placeholder="จำเป็นเมื่อปฏิเสธหรือปิดบัญชี" /></label>}<div style={actionRowStyle}><AdminButton disabled={busy || item.status === 'ACTIVE'} tone="success" onClick={() => onReview('ACTIVE')}>อนุมัติ</AdminButton><AdminButton disabled={busy || item.status === 'REJECTED'} tone="danger" onClick={() => onReview('REJECTED')}>ปฏิเสธ</AdminButton><AdminButton disabled={busy || item.status === 'DISABLED'} tone="secondary" onClick={() => onReview('DISABLED')}>ปิดบัญชี</AdminButton></div></section>;
}
function RiskRow({ item }: { item: MemberBank }) { return <AdminRow><div><strong>{item.accountName}</strong><p style={mutedStyle}>{item.bankName} · {item.accountNumber}</p></div><div style={rightStyle}>{(item.flags ?? []).map((flag) => <AdminBadge key={flag} tone={flag.includes('ซ้ำ') ? 'danger' : 'warning'}>{flag}</AdminBadge>)}</div></AdminRow>; }
function statusTone(status: string) { if (status === 'ACTIVE') return 'success'; if (status === 'REJECTED' || status === 'DISABLED') return 'danger'; return 'warning'; }
function statusLabel(status: string) { const map: Record<string, string> = { ACTIVE: 'อนุมัติแล้ว', PENDING_REVIEW: 'รอตรวจ', REJECTED: 'ปฏิเสธ', DISABLED: 'ปิดบัญชี' }; return map[status] ?? status; }
function reviewTitle(status: ReviewStatus) { return status === 'ACTIVE' ? 'อนุมัติบัญชีนี้?' : status === 'REJECTED' ? 'ปฏิเสธบัญชีนี้?' : 'ปิดบัญชีนี้?'; }
function reviewDescription(status: ReviewStatus) { return status === 'ACTIVE' ? 'บัญชีนี้จะใช้รับเงินถอนของสมาชิกได้' : status === 'REJECTED' ? 'สมาชิกต้องแก้ไขหรือเพิ่มบัญชีใหม่ก่อนใช้งาน' : 'บัญชีนี้จะถูกหยุดใช้งานจนกว่าจะเปิดอีกครั้ง'; }
function reviewConfirmLabel(status: ReviewStatus) { return status === 'ACTIVE' ? 'อนุมัติบัญชี' : status === 'REJECTED' ? 'ยืนยันปฏิเสธ' : 'ยืนยันปิดบัญชี'; }
const inputStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 240 } as const;
const mutedStyle = { margin: '4px 0 0', color: '#94a3b8', lineHeight: 1.5 } as const;
const cardletStyle = { border: '1px solid rgba(148,163,184,.14)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,.04)', display: 'grid', gap: 10, minWidth: 0 } as const;
const rightStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'flex-end', alignItems: 'center' };
const flagRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const actionRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const fieldStyle = { display: 'grid', gap: 6, fontWeight: 850 } as const;
const textareaStyle = { minHeight: 80, borderRadius: 14, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: 12, resize: 'vertical' as const, minWidth: 0 };