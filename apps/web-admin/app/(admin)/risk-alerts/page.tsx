'use client';

import { useEffect, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminEmpty, AdminLinkButton, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar } from '../_components/admin-ui';
import { humanStatus, severityLabel, statusTone } from '../_components/human-labels';
import { RiskMetadataRaw, RiskMetadataView } from './metadata';

type RiskAlert = { id: string; type: string; severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'; status: 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED'; memberId?: string | null; shortMemberId?: string | null; refType?: string | null; refId?: string | null; title: string; description?: string | null; metadata?: Record<string, unknown> | null; createdAt: string };
type RiskResponse = { items?: RiskAlert[]; total?: number; page?: number; pageCount?: number; summary?: { openCount?: number; criticalCount?: number } };
type AutoCloseSuggestion = { id: string; reason: string; status: string; refType?: string | null; refId?: string | null };
const PAGE_SIZE = 20;
const statusOptions = ['', 'OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'];
const severityOptions = ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const typeOptions = ['', 'REPEATED_TOPUPS', 'RAPID_DEPOSIT_WITHDRAWAL', 'HIGH_WITHDRAWAL', 'BANK_CHANGE_WITHDRAWAL', 'MULTIPLE_PENDING_TOPUPS', 'WALLET_LEDGER_MISMATCH', 'DUPLICATE_DEPOSIT_SLIP', 'REPEATED_DUPLICATE_DEPOSIT_SLIP'];

export default function RiskAlertsPage() {
  const [items, setItems] = useState<RiskAlert[]>([]);
  const [summary, setSummary] = useState({ openCount: 0, criticalCount: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [status, setStatus] = useState('OPEN');
  const [severity, setSeverity] = useState('');
  const [type, setType] = useState('');
  const [provider, setProvider] = useState('');
  const [memberId, setMemberId] = useState('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [message, setMessage] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [autoCloseSuggestions, setAutoCloseSuggestions] = useState<AutoCloseSuggestion[]>([]);
  const [dismissReason, setDismissReason] = useState('');
  const [dismissConfirmOpen, setDismissConfirmOpen] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => { void load(1); }, []);
  useEffect(() => { void load(page); }, [page]);
  useEffect(() => { setPage(1); void load(1); }, [status, severity, type, provider]);
  useEffect(() => { if (cooldownRemaining <= 0) return; const timer = window.setInterval(() => setCooldownRemaining((value) => Math.max(0, value - 1)), 1000); return () => window.clearInterval(timer); }, [cooldownRemaining]);

  async function load(nextPage = page) {
    setLoading(true);
    const query = new URLSearchParams();
    if (status) query.set('status', status);
    if (severity) query.set('severity', severity);
    if (type) query.set('type', type);
    if (memberId.trim()) query.set('memberId', memberId.trim());
    if (provider.trim()) query.set('provider', provider.trim());
    if (createdFrom) query.set('createdFrom', createdFrom);
    if (createdTo) query.set('createdTo', createdTo);
    query.set('page', String(nextPage));
    query.set('take', String(PAGE_SIZE));
    const res = await adminApiFetch(`/admin/risk-alerts?${query.toString()}`);
    const data = (await res.json().catch(() => null)) as RiskResponse | { message?: string } | null;
    if (res.ok && data) {
      const payload = data as RiskResponse;
      setItems(payload.items ?? []);
      setTotal(Number(payload.total ?? payload.items?.length ?? 0));
      setPageCount(Math.max(Number(payload.pageCount ?? 1), 1));
      setSummary({ openCount: Number(payload.summary?.openCount ?? 0), criticalCount: Number(payload.summary?.criticalCount ?? 0) });
      setMessage('');
    } else setMessage((data as { message?: string } | null)?.message ?? 'โหลดรายการความเสี่ยงไม่สำเร็จ');
    setLoading(false);
  }

  async function scan() {
    if (scanning || cooldownRemaining > 0) return;
    setScanning(true);
    setMessage('กำลังตรวจหารายการผิดปกติ...');
    const res = await adminApiFetch('/admin/risk-alerts/scan', { method: 'POST' });
    const data = await res.json().catch(() => null);
    if (res.ok) { setMessage(`ตรวจเสร็จ พบรายการใหม่ ${Number(data?.created ?? 0)} รายการ`); setCooldownRemaining(45); }
    else if (data?.retryAfter) { const retryAfter = Number(data.retryAfter); setCooldownRemaining(Number.isFinite(retryAfter) ? retryAfter : 45); setMessage(`กรุณารอ ${data.retryAfter} วินาทีก่อนตรวจอีกครั้ง`); }
    else setMessage(data?.message ?? 'ตรวจหารายการผิดปกติไม่สำเร็จ');
    setScanning(false);
    await load(page);
  }

  async function updateStatus(id: string, nextStatus: RiskAlert['status']) {
    const res = await adminApiFetch(`/admin/risk-alerts/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) });
    const data = await res.json().catch(() => null);
    setMessage(res.ok ? 'อัปเดตสถานะแล้ว' : data?.message ?? 'อัปเดตสถานะไม่สำเร็จ');
    await load(page);
  }

  async function loadAutoCloseSuggestions() {
    const res = await adminApiFetch('/admin/risk-alerts/auto-close-suggestions?limit=20');
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'โหลดรายการที่อาจปิดได้ไม่สำเร็จ'); return; }
    setAutoCloseSuggestions(Array.isArray(data?.items) ? data.items : []);
    setMessage(`พบรายการที่ควรตรวจเพื่อปิด ${Number(data?.items?.length ?? 0)} รายการ`);
  }

  async function bulkDismiss() {
    if (!selectedIds.length) return;
    if (dismissReason.trim().length < 5) { setMessage('กรุณาระบุเหตุผลอย่างน้อย 5 ตัวอักษร'); return; }
    setDismissing(true);
    const res = await adminApiFetch('/admin/risk-alerts/bulk-dismiss', { method: 'POST', body: JSON.stringify({ ids: selectedIds, reason: dismissReason.trim() }) });
    const data = await res.json().catch(() => null);
    setDismissing(false);
    if (!res.ok) setMessage(data?.message ?? 'ปิดรายการไม่สำเร็จ');
    else { setMessage(`ปิดรายการแล้ว ${Number(data?.updated ?? 0)} รายการ`); setSelectedIds([]); setDismissReason(''); setDismissConfirmOpen(false); await load(page); }
  }

  function applyFilters() { setPage(1); void load(1); }
  function clearFilters() { setStatus('OPEN'); setSeverity(''); setType(''); setMemberId(''); setProvider(''); setCreatedFrom(''); setCreatedTo(''); setPage(1); window.setTimeout(() => void load(1), 0); }
  const scanDisabled = scanning || cooldownRemaining > 0;

  return <AdminPage eyebrow="ความเสี่ยง" title="รายการที่ต้องตรวจ" description="รวมรายการผิดปกติจากการฝาก ถอน บัญชี และยอดเงิน เพื่อให้ผู้ดูแลตรวจสอบและปิดเรื่องได้จากหน้าเดียว" actions={<><AdminButton onClick={scan} disabled={scanDisabled}>{scanning ? 'กำลังตรวจ...' : cooldownRemaining > 0 ? `รอ ${cooldownRemaining} วินาที` : 'ตรวจหารายการผิดปกติ'}</AdminButton><AdminButton tone="secondary" onClick={() => void loadAutoCloseSuggestions()}>ดูรายการที่อาจปิดได้</AdminButton></>}>
    <AdminMetricGrid><AdminMetric title="รอตรวจ" value={String(summary.openCount)} helper="รวมรายการใหม่และกำลังตรวจ" /><AdminMetric title="เร่งด่วนที่สุด" value={String(summary.criticalCount)} helper="ควรตรวจเป็นลำดับแรก" /><AdminMetric title="แสดงในหน้านี้" value={String(items.length)} helper={`${total} รายการทั้งหมด`} /><AdminMetric title="หน้า" value={`${page}/${pageCount}`} helper={`${PAGE_SIZE} รายการต่อหน้า`} /></AdminMetricGrid>
    {cooldownRemaining > 0 && <AdminNotice>ตรวจใหม่ได้ใน {cooldownRemaining} วินาที</AdminNotice>}
    <AdminToolbar><label style={fieldStyle}>สถานะ<select value={status} onChange={(event) => setStatus(event.target.value)} style={inputStyle}>{statusOptions.map((value) => <option key={value} value={value}>{value ? humanStatus(value) : 'ทั้งหมด'}</option>)}</select></label><label style={fieldStyle}>ระดับความเสี่ยง<select value={severity} onChange={(event) => setSeverity(event.target.value)} style={inputStyle}>{severityOptions.map((value) => <option key={value} value={value}>{value ? severityLabel(value) : 'ทั้งหมด'}</option>)}</select></label><label style={fieldStyle}>ประเภท<select value={type} onChange={(event) => setType(event.target.value)} style={inputStyle}>{typeOptions.map((value) => <option key={value} value={value}>{value ? riskTypeLabel(value) : 'ทั้งหมด'}</option>)}</select></label><label style={fieldStyle}>รหัสสมาชิก<input value={memberId} onChange={(event) => setMemberId(event.target.value)} placeholder="รหัสสมาชิก" style={inputStyle} /></label><label style={fieldStyle}>รหัสค่าย<input value={provider} onChange={(event) => setProvider(event.target.value)} placeholder="เช่น pragmatic" style={inputStyle} /></label><label style={fieldStyle}>ตั้งแต่วันที่<input type="date" value={createdFrom} onChange={(event) => setCreatedFrom(event.target.value)} style={inputStyle} /></label><label style={fieldStyle}>ถึงวันที่<input type="date" value={createdTo} onChange={(event) => setCreatedTo(event.target.value)} style={inputStyle} /></label><div style={filterActionStyle}><AdminButton tone="secondary" onClick={applyFilters}>ใช้ตัวกรอง</AdminButton><AdminButton tone="secondary" onClick={clearFilters}>ล้างตัวกรอง</AdminButton></div>{selectedIds.length > 0 && <AdminButton tone="danger" onClick={() => setDismissConfirmOpen(true)}>ปิดรายการที่เลือก ({selectedIds.length})</AdminButton>}<div style={pagerStyle}><AdminButton disabled={loading || page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>ก่อนหน้า</AdminButton><span>หน้า {page} / {pageCount}</span><AdminButton disabled={loading || page >= pageCount} onClick={() => setPage((value) => Math.min(value + 1, pageCount))}>ถัดไป</AdminButton></div></AdminToolbar>
    {message && <AdminNotice>{message}</AdminNotice>}
    {autoCloseSuggestions.length > 0 && <AdminCard title="รายการที่อาจปิดได้" description="ปลายทางของรายการเหล่านี้สิ้นสุดแล้ว ควรเปิดตรวจรายละเอียดก่อนปิด"><AdminStack>{autoCloseSuggestions.map((item) => <AdminRow key={item.id}><div style={alertBodyStyle}><strong>{item.reason}</strong><span style={mutedStyle}>{item.refType ?? 'รายการ'} / {item.refId ?? '-'} · {humanStatus(item.status)}</span></div><AdminLinkButton href={`/risk-alerts/${item.id}`}>ตรวจรายละเอียด</AdminLinkButton></AdminRow>)}</AdminStack></AdminCard>}
    <AdminCard title="รายการความเสี่ยง" description="เปิดดูรายละเอียดก่อนเปลี่ยนสถานะ โดยเฉพาะรายการความเสี่ยงสูง"><AdminStack>{loading ? <AdminEmpty>กำลังโหลด...</AdminEmpty> : items.length === 0 ? <AdminEmpty>ไม่พบรายการตามตัวกรอง</AdminEmpty> : items.map((item) => <AdminRow key={item.id}><div style={alertBodyStyle}><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><AdminBadge tone={severityTone(item.severity)}>{severityLabel(item.severity)}</AdminBadge><AdminBadge tone={statusTone(item.status)}>{humanStatus(item.status)}</AdminBadge><AdminBadge>{riskTypeLabel(item.type)}</AdminBadge></div><strong>{item.title}</strong>{item.description && <span style={mutedStyle}>{item.description}</span>}<div style={detailGridStyle}><span>สมาชิก: {item.memberId ? <a href={`/members/${item.memberId}`} style={linkStyle}>{item.shortMemberId ?? item.memberId.slice(0, 8)}</a> : '-'}</span><span>รายการอ้างอิง: {item.refId ? <a href={riskTargetHref(item)} style={linkStyle}>{item.refType ?? 'รายการ'} / {item.refId.slice(0, 8)}</a> : '-'}</span><span>พบเมื่อ: {new Date(item.createdAt).toLocaleString('th-TH')}</span></div>{item.metadata && <details style={detailsStyle}><summary>ข้อมูลเพิ่มเติม</summary><RiskMetadataView metadata={item.metadata} /><RiskMetadataRaw metadata={item.metadata} /></details>}</div><div style={actionStyle}><label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 12 }}><input type="checkbox" checked={selectedIds.includes(item.id)} disabled={item.severity !== 'LOW' && item.severity !== 'MEDIUM'} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...current, item.id] : current.filter((id) => id !== item.id))} />เลือก</label><AdminLinkButton href={`/risk-alerts/${item.id}`}>ดูรายละเอียด</AdminLinkButton><AdminButton tone="secondary" disabled={item.status === 'REVIEWING'} onClick={() => void updateStatus(item.id, 'REVIEWING')}>เริ่มตรวจ</AdminButton><AdminButton tone="success" disabled={item.status === 'RESOLVED'} onClick={() => void updateStatus(item.id, 'RESOLVED')}>แก้ไขแล้ว</AdminButton><AdminButton tone="danger" disabled={item.status === 'DISMISSED'} onClick={() => void updateStatus(item.id, 'DISMISSED')}>ปิดรายการ</AdminButton></div></AdminRow>)}</AdminStack></AdminCard>
    <AdminConfirmDialog open={dismissConfirmOpen} title="ยืนยันปิดเคสความเสี่ยง" description={`คุณกำลังปิด ${selectedIds.length.toLocaleString('th-TH')} เคสที่เลือก การดำเนินการนี้จะถูกบันทึกใน Audit log`} confirmLabel="ยืนยันปิดเคส" tone="danger" busy={dismissing} onCancel={() => setDismissConfirmOpen(false)} onConfirm={() => void bulkDismiss()} details={<label style={fieldStyle}>เหตุผลในการปิดเคส<textarea value={dismissReason} onChange={(event) => setDismissReason(event.target.value)} placeholder="ระบุเหตุผลอย่างน้อย 5 ตัวอักษร" style={{ ...inputStyle, minHeight: 100, padding: 12 }} /></label>} />
  </AdminPage>;
}

function severityTone(value: RiskAlert['severity']) { if (value === 'CRITICAL' || value === 'HIGH') return 'danger'; if (value === 'MEDIUM') return 'warning'; return 'neutral'; }
function riskTypeLabel(type: string) { const map: Record<string, string> = { REPEATED_TOPUPS: 'ฝากถี่ผิดปกติ', RAPID_DEPOSIT_WITHDRAWAL: 'ฝากแล้วถอนเร็ว', HIGH_WITHDRAWAL: 'ถอนยอดสูง', BANK_CHANGE_WITHDRAWAL: 'เปลี่ยนบัญชีแล้วถอน', MULTIPLE_PENDING_TOPUPS: 'มีรายการฝากค้างหลายรายการ', WALLET_LEDGER_MISMATCH: 'ยอดกระเป๋าเงินไม่ตรง', DUPLICATE_DEPOSIT_SLIP: 'พบสลิปฝากซ้ำ', REPEATED_DUPLICATE_DEPOSIT_SLIP: 'ใช้สลิปฝากซ้ำหลายครั้ง' }; return map[type] ?? type; }
function riskTargetHref(item: RiskAlert) { const refType = String(item.refType ?? '').toLowerCase(); if (refType.includes('withdrawal')) return `/withdrawals?requestId=${item.refId}`; if (refType.includes('top') || refType.includes('deposit')) return `/topups?requestId=${item.refId}`; if (refType.includes('user') || refType.includes('member')) return `/members/${item.refId}`; if (refType.includes('wallet')) return `/wallets?walletId=${item.refId}`; return `/risk-alerts/${item.id}`; }
const fieldStyle = { display: 'grid', gap: 6, color: '#94a3b8', fontSize: 12, fontWeight: 900, minWidth: 0, width: '100%', maxWidth: '100%', overflow: 'hidden' as const } as const;
const inputStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', width: '100%', minWidth: 0, maxWidth: '100%', boxSizing: 'border-box' as const, fontSize: 16 };
const filterActionStyle = { display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', alignItems: 'end', gap: 8, minWidth: 0, width: '100%' } as const;
const pagerStyle = { display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const };
const alertBodyStyle = { display: 'grid', gap: 8, flex: '1 1 240px', minWidth: 0, maxWidth: '100%', overflow: 'hidden' as const };
const mutedStyle = { color: '#94a3b8', fontSize: 13, lineHeight: 1.45 } as const;
const actionStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const, alignItems: 'start', justifyContent: 'flex-end' as const, minWidth: 0, maxWidth: '100%' };
const detailGridStyle = { display: 'grid', gap: 5, color: '#94a3b8', fontSize: 13, minWidth: 0 } as const;
const linkStyle = { color: '#f5c542', fontWeight: 900 } as const;
const detailsStyle = { border: '1px solid rgba(148,163,184,.18)', borderRadius: 12, padding: 10, background: 'rgba(15,23,42,.45)', minWidth: 0, maxWidth: '100%', overflow: 'hidden' as const };
