'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminGrid, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

type MemberBank = { id: string; userId: string; bankName: string; accountName: string; accountNumber: string; status: string; adminNote?: string | null; flags?: string[]; user?: { username?: string | null; phone?: string | null; email?: string | null; status?: string; phoneVerifiedAt?: string | null } };
type KycSummary = { summary?: { pending?: number; active?: number; rejected?: number; disabled?: number; duplicateGroups?: number; unverifiedPhones?: number }; duplicateGroups?: Array<{ accountNumber: string; count: number; items: MemberBank[] }>; riskyAccounts?: MemberBank[] };

export default function KycCenterPage() {
  const [summary, setSummary] = useState<KycSummary>({});
  const [accounts, setAccounts] = useState<MemberBank[]>([]);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('กำลังโหลด KYC...');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState('');
  useEffect(() => { load(); }, []);
  const queue = useMemo(() => accounts.filter((item) => item.status === 'PENDING_REVIEW'), [accounts]);
  async function load() {
    setMessage('กำลังโหลด KYC...');
    const [summaryRes, accountRes] = await Promise.all([adminApiFetch('/admin/member-bank-accounts/kyc-summary'), adminApiFetch(`/admin/member-bank-accounts${search.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''}`)]);
    const summaryData = await summaryRes.json().catch(() => null);
    const accountData = await accountRes.json().catch(() => null);
    if (summaryRes.ok) setSummary(summaryData ?? {});
    if (accountRes.ok) setAccounts(accountData.items ?? []);
    if (!summaryRes.ok || !accountRes.ok) { setMessage(summaryData?.message ?? accountData?.message ?? 'โหลด KYC ไม่สำเร็จ'); return; }
    setMessage('');
  }
  async function review(id: string, status: 'ACTIVE' | 'REJECTED' | 'DISABLED') {
    const adminNote = (notes[id] ?? '').trim();
    if (status !== 'ACTIVE' && !adminNote) { setMessage('กรุณาใส่เหตุผลก่อน reject/disable บัญชี'); return; }
    setBusyId(id); const res = await adminApiFetch(`/admin/member-bank-accounts/${id}/review`, { method: 'PATCH', body: JSON.stringify({ status, adminNote }) }); const data = await res.json().catch(() => null); setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'ตรวจบัญชีไม่สำเร็จ'); return; }
    setMessage(status === 'ACTIVE' ? 'อนุมัติบัญชีแล้ว' : status === 'REJECTED' ? 'ปฏิเสธบัญชีแล้ว' : 'ปิดบัญชีแล้ว');
    setAccounts((current) => current.map((item) => item.id === id ? { ...item, ...data.item } : item));
    load();
  }
  return <AdminPage eyebrow="Risk" title="KYC / Bank Verification" description="ตรวจบัญชีธนาคารสมาชิก กันเลขบัญชีซ้ำ และดูความเสี่ยงก่อนปล่อยให้ถอนเงินแบบหวังพึ่งโชค">
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminMetricGrid><AdminMetric tone={(summary.summary?.pending ?? 0) > 0 ? 'warning' : 'success'} title="รอตรวจบัญชี" value={String(summary.summary?.pending ?? 0)} /><AdminMetric tone={(summary.summary?.duplicateGroups ?? 0) > 0 ? 'danger' : 'success'} title="เลขบัญชีซ้ำ" value={String(summary.summary?.duplicateGroups ?? 0)} /><AdminMetric tone={(summary.summary?.unverifiedPhones ?? 0) > 0 ? 'warning' : 'success'} title="ยังไม่ยืนยันเบอร์" value={String(summary.summary?.unverifiedPhones ?? 0)} /><AdminMetric tone="success" title="อนุมัติแล้ว" value={String(summary.summary?.active ?? 0)} /></AdminMetricGrid>
    <AdminToolbar><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ค้นหาสมาชิก / ธนาคาร / เลขบัญชี" style={inputStyle} /><AdminButton onClick={load}>ค้นหา/รีเฟรช</AdminButton></AdminToolbar>
    {(summary.duplicateGroups ?? []).length > 0 && <AdminCard title="เลขบัญชีซ้ำ" description="ตรวจกลุ่มนี้ก่อนอนุมัติ บัญชีซ้ำไม่ใช่เรื่องที่ควรปล่อยผ่านแล้วค่อยทำหน้าตกใจทีหลัง" tone="danger"><AdminStack>{summary.duplicateGroups?.map((group) => <AdminRow key={group.accountNumber}><strong>{group.accountNumber}</strong><span>{group.count} บัญชี</span></AdminRow>)}</AdminStack></AdminCard>}
    <AdminGrid><AdminCard title="คิวตรวจบัญชี" description="บัญชีที่รออนุมัติ" tone={queue.length > 0 ? 'warning' : 'success'}><AdminStack>{queue.map((item) => <BankReviewCard key={item.id} item={item} note={notes[item.id] ?? ''} busy={busyId === item.id} onNote={(value) => setNotes((current) => ({ ...current, [item.id]: value }))} onReview={review} />)}{queue.length === 0 && <AdminEmpty>ไม่มีบัญชีรอตรวจ</AdminEmpty>}</AdminStack></AdminCard><AdminCard title="บัญชีเสี่ยง" description="ระบบรวมรายการที่ควรดูเพิ่ม"><AdminStack>{(summary.riskyAccounts ?? []).slice(0, 20).map((item) => <RiskRow key={item.id} item={item} />)}{(summary.riskyAccounts ?? []).length === 0 && <AdminEmpty>ยังไม่พบรายการเสี่ยง</AdminEmpty>}</AdminStack></AdminCard></AdminGrid>
    <AdminCard title="บัญชีทั้งหมด" description="รายการล่าสุด 200 รายการ"><AdminStack>{accounts.map((item) => <BankReviewCard key={item.id} item={item} note={notes[item.id] ?? ''} busy={busyId === item.id} onNote={(value) => setNotes((current) => ({ ...current, [item.id]: value }))} onReview={review} compact />)}{accounts.length === 0 && <AdminEmpty>ยังไม่มีบัญชีสมาชิก</AdminEmpty>}</AdminStack></AdminCard>
  </AdminPage>;
}

function BankReviewCard({ item, note, busy, onNote, onReview, compact = false }: { item: MemberBank; note: string; busy: boolean; compact?: boolean; onNote: (value: string) => void; onReview: (id: string, status: 'ACTIVE' | 'REJECTED' | 'DISABLED') => void }) { return <section style={cardletStyle}><AdminRow><div><strong>{item.accountName}</strong><p style={mutedStyle}>{item.bankName} · {item.accountNumber}</p><p style={mutedStyle}>สมาชิก: {item.user?.username ?? item.user?.phone ?? item.userId}</p></div><div style={rightStyle}><AdminBadge tone={statusTone(item.status)}>{statusLabel(item.status)}</AdminBadge>{item.user?.phoneVerifiedAt ? <AdminBadge tone="success">ยืนยันเบอร์แล้ว</AdminBadge> : <AdminBadge tone="warning">ยังไม่ยืนยันเบอร์</AdminBadge>}</div></AdminRow>{(item.flags ?? []).length > 0 && <div style={flagRowStyle}>{item.flags?.map((flag) => <AdminBadge key={flag} tone={flag.includes('ซ้ำ') ? 'danger' : 'warning'}>{flag}</AdminBadge>)}</div>}{!compact && <label style={fieldStyle}>หมายเหตุแอดมิน<textarea value={note} onChange={(event) => onNote(event.target.value)} style={textareaStyle} placeholder="จำเป็นเมื่อ reject/disable" /></label>}<div style={actionRowStyle}><AdminButton disabled={busy || item.status === 'ACTIVE'} tone="success" onClick={() => onReview(item.id, 'ACTIVE')}>อนุมัติ</AdminButton><AdminButton disabled={busy || item.status === 'REJECTED'} tone="danger" onClick={() => onReview(item.id, 'REJECTED')}>ปฏิเสธ</AdminButton><AdminButton disabled={busy || item.status === 'DISABLED'} tone="secondary" onClick={() => onReview(item.id, 'DISABLED')}>ปิดบัญชี</AdminButton></div></section>; }
function RiskRow({ item }: { item: MemberBank }) { return <AdminRow><div><strong>{item.accountName}</strong><p style={mutedStyle}>{item.bankName} · {item.accountNumber}</p></div><div style={rightStyle}>{(item.flags ?? []).map((flag) => <AdminBadge key={flag} tone={flag.includes('ซ้ำ') ? 'danger' : 'warning'}>{flag}</AdminBadge>)}</div></AdminRow>; }
function statusTone(status: string) { if (status === 'ACTIVE') return 'success'; if (status === 'REJECTED' || status === 'DISABLED') return 'danger'; return 'warning'; }
function statusLabel(status: string) { const map: Record<string, string> = { ACTIVE: 'อนุมัติแล้ว', PENDING_REVIEW: 'รอตรวจ', REJECTED: 'ปฏิเสธ', DISABLED: 'ปิดบัญชี' }; return map[status] ?? status; }
const inputStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 240 } as const;
const mutedStyle = { margin: '4px 0 0', color: '#94a3b8', lineHeight: 1.5 } as const;
const cardletStyle = { border: '1px solid rgba(148,163,184,.14)', borderRadius: 16, padding: 12, background: 'rgba(255,255,255,.04)', display: 'grid', gap: 10, minWidth: 0 } as const;
const rightStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, justifyContent: 'flex-end', alignItems: 'center' };
const flagRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const actionRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const fieldStyle = { display: 'grid', gap: 6, fontWeight: 850 } as const;
const textareaStyle = { minHeight: 80, borderRadius: 14, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: 12, resize: 'vertical' as const, minWidth: 0 };
