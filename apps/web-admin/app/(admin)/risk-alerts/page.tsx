'use client';

import { useEffect, useMemo, useState } from 'react';
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
const severityPriority: Record<RiskAlert['severity'], number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

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
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [workingId, setWorkingId] = useState('');
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [message, setMessage] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [autoCloseSuggestions, setAutoCloseSuggestions] = useState<AutoCloseSuggestion[]>([]);
  const [dismissReason, setDismissReason] = useState('');
  const [dismissConfirmOpen, setDismissConfirmOpen] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => { void load(1); }, []);
  useEffect(() => { if (cooldownRemaining <= 0) return; const timer = window.setInterval(() => setCooldownRemaining((value) => Math.max(0, value - 1)), 1000); return () => window.clearInterval(timer); }, [cooldownRemaining]);

  const orderedItems = useMemo(() => [...items].sort((left, right) => {
    const severityDiff = severityPriority[left.severity] - severityPriority[right.severity];
    if (severityDiff !== 0) return severityDiff;
    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  }), [items]);

  async function load(nextPage = page) {
    setLoading(true);
    try {
      const query = new URLSearchParams({ page: String(nextPage), take: String(PAGE_SIZE) });
      if (status) query.set('status', status);
      if (severity) query.set('severity', severity);
      if (type) query.set('type', type);
      if (memberId.trim()) query.set('memberId', memberId.trim());
      if (provider.trim()) query.set('provider', provider.trim());
      if (createdFrom) query.set('createdFrom', createdFrom);
      if (createdTo) query.set('createdTo', createdTo);
      const response = await adminApiFetch(`/admin/risk-alerts?${query.toString()}`);
      const payload = await response.json().catch(() => null) as RiskResponse | null;
      if (!response.ok || !payload || !Array.isArray(payload.items)) throw new Error('load');
      setItems(payload.items);
      setTotal(Number(payload.total ?? payload.items.length));
      setPage(nextPage);
      setPageCount(Math.max(Number(payload.pageCount ?? 1), 1));
      setSummary({ openCount: Number(payload.summary?.openCount ?? 0), criticalCount: Number(payload.summary?.criticalCount ?? 0) });
      setSelectedIds([]);
      setMessage('');
    } catch {
      setItems([]);
      setMessage('โหลดรายการความเสี่ยงไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  async function scan() {
    if (scanning || cooldownRemaining > 0) return;
    setScanning(true);
    setMessage('กำลังตรวจหารายการผิดปกติ...');
    try {
      const response = await adminApiFetch('/admin/risk-alerts/scan', { method: 'POST' });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const retryAfter = Number(payload?.retryAfter);
        if (Number.isFinite(retryAfter) && retryAfter > 0) {
          setCooldownRemaining(retryAfter);
          setMessage(`กรุณารอ ${retryAfter} วินาทีก่อนตรวจอีกครั้ง`);
          return;
        }
        throw new Error('scan');
      }
      setMessage(`ตรวจเสร็จ พบรายการใหม่ ${Number(payload?.created ?? 0)} รายการ`);
      setCooldownRemaining(45);
      await load(1);
    } catch {
      setMessage('ตรวจหารายการผิดปกติไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setScanning(false);
    }
  }

  async function updateStatus(id: string, nextStatus: RiskAlert['status']) {
    if (workingId) return;
    setWorkingId(id);
    try {
      const response = await adminApiFetch(`/admin/risk-alerts/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus }) });
      if (!response.ok) throw new Error('status');
      setMessage('อัปเดตสถานะแล้ว');
      await load(page);
    } catch {
      setMessage('อัปเดตสถานะไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setWorkingId('');
    }
  }

  async function loadAutoCloseSuggestions() {
    if (suggestionsLoading) return;
    setSuggestionsLoading(true);
    try {
      const response = await adminApiFetch('/admin/risk-alerts/auto-close-suggestions?limit=20');
      const payload = await response.json().catch(() => null);
      if (!response.ok || !Array.isArray(payload?.items)) throw new Error('suggestions');
      setAutoCloseSuggestions(payload.items);
      setMessage(`พบรายการที่ควรตรวจเพื่อปิด ${payload.items.length} รายการ`);
    } catch {
      setAutoCloseSuggestions([]);
      setMessage('โหลดรายการที่อาจปิดได้ไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSuggestionsLoading(false);
    }
  }

  async function bulkDismiss() {
    if (!selectedIds.length || dismissing) return;
    if (dismissReason.trim().length < 5) { setMessage('กรุณาระบุเหตุผลอย่างน้อย 5 ตัวอักษร'); return; }
    setDismissing(true);
    try {
      const response = await adminApiFetch('/admin/risk-alerts/bulk-dismiss', { method: 'POST', body: JSON.stringify({ ids: selectedIds, reason: dismissReason.trim() }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error('dismiss');
      setMessage(`ปิดรายการแล้ว ${Number(payload?.updated ?? 0)} รายการ`);
      setSelectedIds([]);
      setDismissReason('');
      setDismissConfirmOpen(false);
      await load(page);
    } catch {
      setMessage('ปิดรายการไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setDismissing(false);
    }
  }

  function applyFilters() { void load(1); }
  function clearFilters() {
    setStatus('OPEN'); setSeverity(''); setType(''); setMemberId(''); setProvider(''); setCreatedFrom(''); setCreatedTo('');
    window.setTimeout(() => void load(1), 0);
  }

  const controlsBusy = loading || scanning || dismissing || Boolean(workingId);
  return <AdminPage eyebrow="ความเสี่ยง" title="รายการที่ต้องตรวจ" description="รวมรายการผิดปกติจากการฝาก ถอน บัญชี และยอดเงิน เพื่อให้ผู้ดูแลตรวจสอบและปิดเรื่องได้จากหน้าเดียว" actions={<><AdminButton onClick={() => void scan()} disabled={scanning || cooldownRemaining > 0}>{scanning ? 'กำลังตรวจ...' : cooldownRemaining > 0 ? `รอ ${cooldownRemaining} วินาที` : 'ตรวจหารายการผิดปกติ'}</AdminButton><AdminButton tone="secondary" onClick={() => void loadAutoCloseSuggestions()} disabled={suggestionsLoading}>{suggestionsLoading ? 'กำลังโหลด...' : 'ดูรายการที่อาจปิดได้'}</AdminButton></>}>
    <AdminMetricGrid><AdminMetric title="รอตรวจ" value={String(summary.openCount)} helper="รวมรายการใหม่และกำลังตรวจ" /><AdminMetric title="เร่งด่วนที่สุด" value={String(summary.criticalCount)} helper="ควรตรวจเป็นลำดับแรก" /><AdminMetric title="แสดงในหน้านี้" value={String(orderedItems.length)} helper={`${total} รายการทั้งหมด`} /><AdminMetric title="หน้า" value={`${page}/${pageCount}`} helper={`${PAGE_SIZE} รายการต่อหน้า`} /></AdminMetricGrid>
    {cooldownRemaining > 0 && <AdminNotice>ตรวจใหม่ได้ใน {cooldownRemaining} วินาที</AdminNotice>}
    {message && <AdminNotice tone={message.includes('ไม่สำเร็จ') ? 'danger' : 'neutral'}>{message}</AdminNotice>}
    <AdminToolbar>
      <label style={fieldStyle}>สถานะ<select disabled={controlsBusy} value={status} onChange={(event) => setStatus(event.target.value)} style={inputStyle}>{statusOptions.map((value) => <option key={value} value={value}>{value ? humanStatus(value) : 'ทั้งหมด'}</option>)}</select></label>
      <label style={fieldStyle}>ระดับความเสี่ยง<select disabled={controlsBusy} value={severity} onChange={(event) => setSeverity(event.target.value)} style={inputStyle}>{severityOptions.map((value) => <option key={value} value={value}>{value ? severityLabel(value) : 'ทั้งหมด'}</option>)}</select></label>
      <label style={fieldStyle}>ประเภท<select disabled={controlsBusy} value={type} onChange={(event) => setType(event.target.value)} style={inputStyle}>{typeOptions.map((value) => <option key={value} value={value}>{value ? riskTypeLabel(value) : 'ทั้งหมด'}</option>)}</select></label>
      <label style={fieldStyle}>รหัสสมาชิก<input disabled={controlsBusy} value={memberId} onChange={(event) => setMemberId(event.target.value)} placeholder="รหัสสมาชิก" style={inputStyle} /></label>
      <label style={fieldStyle}>รหัสค่าย<input disabled={controlsBusy} value={provider} onChange={(event) => setProvider(event.target.value)} placeholder="เช่น pragmatic" style={inputStyle} /></label>
      <label style={fieldStyle}>ตั้งแต่วันที่<input disabled={controlsBusy} type="date" value={createdFrom} onChange={(event) => setCreatedFrom(event.target.value)} style={inputStyle} /></label>
      <label style={fieldStyle}>ถึงวันที่<input disabled={controlsBusy} type="date" value={createdTo} onChange={(event) => setCreatedTo(event.target.value)} style={inputStyle} /></label>
      <div style={filterActionStyle}><AdminButton tone="secondary" disabled={controlsBusy} onClick={applyFilters}>ใช้ตัวกรอง</AdminButton><AdminButton tone="secondary" disabled={controlsBusy} onClick={clearFilters}>ล้างตัวกรอง</AdminButton></div>
      {selectedIds.length > 0 && <AdminButton tone="danger" disabled={controlsBusy} onClick={() => setDismissConfirmOpen(true)}>ปิดรายการที่เลือก ({selectedIds.length})</AdminButton>}
      <div style={pagerStyle}><AdminButton disabled={controlsBusy || page <= 1} onClick={() => void load(page - 1)}>ก่อนหน้า</AdminButton><span>หน้า {page} / {pageCount}</span><AdminButton disabled={controlsBusy || page >= pageCount} onClick={() => void load(page + 1)}>ถัดไป</AdminButton></div>
    </AdminToolbar>
    {autoCloseSuggestions.length > 0 && <AdminCard title="รายการที่อาจปิดได้" description="ปลายทางของรายการเหล่านี้สิ้นสุดแล้ว ควรเปิดตรวจรายละเอียดก่อนปิด"><AdminStack>{autoCloseSuggestions.map((item) => <AdminRow key={item.id}><div style={alertBodyStyle}><strong>{item.reason}</strong><span style={mutedStyle}>{item.refType ?? 'รายการ'} / {item.refId ?? '-'} · {humanStatus(item.status)}</span></div><AdminLinkButton href={`/risk-alerts/${item.id}`}>ตรวจรายละเอียด</AdminLinkButton></AdminRow>)}</AdminStack></AdminCard>}
    <AdminCard title="รายการความเสี่ยง" description="เรียง Critical และ High ก่อนเสมอ เปิดรายละเอียดก่อนเปลี่ยนสถานะ"><AdminStack>
      {loading ? <AdminEmpty>กำลังโหลด...</AdminEmpty> : orderedItems.length === 0 ? <AdminEmpty>ไม่พบรายการตามตัวกรอง</AdminEmpty> : orderedItems.map((item) => <AdminRow key={item.id}>
        <div style={alertBodyStyle}><div style={badgeRowStyle}><AdminBadge tone={severityTone(item.severity)}>{severityLabel(item.severity)}</AdminBadge><AdminBadge tone={statusTone(item.status)}>{humanStatus(item.status)}</AdminBadge><AdminBadge>{riskTypeLabel(item.type)}</AdminBadge></div><strong>{item.title}</strong>{item.description && <span style={mutedStyle}>{item.description}</span>}<div style={detailGridStyle}><span>สมาชิก: {item.memberId ? <a href={`/members/${item.memberId}`} style={linkStyle}>{item.shortMemberId ?? item.memberId.slice(0, 8)}</a> : '-'}</span><span>รายการอ้างอิง: {item.refId ? <a href={riskTargetHref(item)} style={linkStyle}>{item.refType ?? 'รายการ'} / {item.refId.slice(0, 8)}</a> : '-'}</span><span>พบเมื่อ: {new Date(item.createdAt).toLocaleString('th-TH')}</span></div>{item.metadata && <details style={detailsStyle}><summary>ข้อมูลเพิ่มเติม</summary><RiskMetadataView metadata={item.metadata} /><RiskMetadataRaw metadata={item.metadata} /></details>}</div>
        <div style={actionStyle}><label style={checkStyle}><input type="checkbox" checked={selectedIds.includes(item.id)} disabled={controlsBusy || (item.severity !== 'LOW' && item.severity !== 'MEDIUM')} onChange={(event) => setSelectedIds((current) => event.target.checked ? [...new Set([...current, item.id])] : current.filter((id) => id !== item.id))} />เลือก</label><AdminLinkButton href={`/risk-alerts/${item.id}`}>ดูรายละเอียด</AdminLinkButton><AdminButton tone="secondary" disabled={controlsBusy || item.status === 'REVIEWING'} onClick={() => void updateStatus(item.id, 'REVIEWING')}>{workingId === item.id ? 'กำลังทำ...' : 'เริ่มตรวจ'}</AdminButton><AdminButton tone="success" disabled={controlsBusy || item.status === 'RESOLVED'} onClick={() => void updateStatus(item.id, 'RESOLVED')}>แก้ไขแล้ว</AdminButton><AdminButton tone="danger" disabled={controlsBusy || item.status === 'DISMISSED'} onClick={() => void updateStatus(item.id, 'DISMISSED')}>ปิดรายการ</AdminButton></div>
      </AdminRow>)}
    </AdminStack></AdminCard>
    <AdminConfirmDialog open={dismissConfirmOpen} title="ยืนยันปิดเคสความเสี่ยง" description={`คุณกำลังปิด ${selectedIds.length.toLocaleString('th-TH')} เคสที่เลือก การดำเนินการนี้จะถูกบันทึกใน Audit log`} confirmLabel="ยืนยันปิดเคส" tone="danger" busy={dismissing} onCancel={() => { if (!dismissing) setDismissConfirmOpen(false); }} onConfirm={() => void bulkDismiss()} details={<label style={fieldStyle}>เหตุผลในการปิดเคส<textarea disabled={dismissing} value={dismissReason} onChange={(event) => setDismissReason(event.target.value)} placeholder="ระบุเหตุผลอย่างน้อย 5 ตัวอักษร" style={{ ...inputStyle, minHeight: 100, padding: 12 }} /></label>} />
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
const badgeRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const checkStyle = { display: 'inline-flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 12 } as const;
