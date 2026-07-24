'use client';

import { useEffect, useRef, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminConfirmDialog,
  AdminEmpty,
  AdminLinkButton,
  AdminMetric,
  AdminMetricGrid,
  AdminNotice,
  AdminPage,
  AdminRow,
  AdminStack,
  AdminToolbar,
} from '../_components/admin-ui';
import { humanStatus, severityLabel, statusTone } from '../_components/human-labels';
import { RiskMetadataRaw, RiskMetadataView } from './metadata';

type RiskStatus = 'OPEN' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';
type RiskSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type RiskAlert = {
  id: string;
  type: string;
  severity: RiskSeverity;
  status: RiskStatus;
  memberId?: string | null;
  shortMemberId?: string | null;
  refType?: string | null;
  refId?: string | null;
  title: string;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
};
type RiskResponse = {
  items?: RiskAlert[];
  total?: number;
  page?: number;
  pageCount?: number;
  summary?: { openCount?: number; criticalCount?: number };
};
type AutoCloseSuggestion = {
  id: string;
  reason: string;
  status: RiskStatus;
  refType?: string | null;
  refId?: string | null;
};
type RiskFilters = {
  status: string;
  severity: string;
  type: string;
  provider: string;
  memberId: string;
  createdFrom: string;
  createdTo: string;
};

const PAGE_SIZE = 20;
const DEFAULT_FILTERS: RiskFilters = {
  status: 'OPEN',
  severity: '',
  type: '',
  provider: '',
  memberId: '',
  createdFrom: '',
  createdTo: '',
};
const statusOptions = ['', 'OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'];
const severityOptions = ['', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const typeOptions = [
  '',
  'REPEATED_TOPUPS',
  'RAPID_DEPOSIT_WITHDRAWAL',
  'HIGH_WITHDRAWAL',
  'BANK_CHANGE_WITHDRAWAL',
  'MULTIPLE_PENDING_TOPUPS',
  'WALLET_LEDGER_MISMATCH',
  'DUPLICATE_DEPOSIT_SLIP',
  'REPEATED_DUPLICATE_DEPOSIT_SLIP',
];
const allowedTransitions: Record<RiskStatus, RiskStatus[]> = {
  OPEN: ['REVIEWING', 'DISMISSED'],
  REVIEWING: ['OPEN', 'RESOLVED', 'DISMISSED'],
  RESOLVED: ['REVIEWING'],
  DISMISSED: ['OPEN', 'REVIEWING'],
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isRiskStatus(value: unknown): value is RiskStatus {
  return ['OPEN', 'REVIEWING', 'RESOLVED', 'DISMISSED'].includes(String(value));
}

function isRiskSeverity(value: unknown): value is RiskSeverity {
  return ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(String(value));
}

function isRiskAlert(value: unknown): value is RiskAlert {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string'
    && typeof value.type === 'string'
    && typeof value.title === 'string'
    && typeof value.createdAt === 'string'
    && !Number.isNaN(new Date(value.createdAt).getTime())
    && isRiskSeverity(value.severity)
    && isRiskStatus(value.status);
}

function isAutoCloseSuggestion(value: unknown): value is AutoCloseSuggestion {
  if (!isRecord(value)) return false;
  return typeof value.id === 'string'
    && typeof value.reason === 'string'
    && isRiskStatus(value.status);
}

function canTransition(status: RiskStatus, nextStatus: RiskStatus) {
  return status !== nextStatus && allowedTransitions[status].includes(nextStatus);
}

function canBulkSelect(item: RiskAlert) {
  return ['LOW', 'MEDIUM'].includes(item.severity) && ['OPEN', 'REVIEWING'].includes(item.status);
}

export default function RiskAlertsPage() {
  const latestRequestRef = useRef(0);
  const [items, setItems] = useState<RiskAlert[]>([]);
  const [summary, setSummary] = useState({ openCount: 0, criticalCount: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [draftFilters, setDraftFilters] = useState<RiskFilters>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<RiskFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState('');
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [message, setMessage] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [autoCloseSuggestions, setAutoCloseSuggestions] = useState<AutoCloseSuggestion[]>([]);
  const [dismissReason, setDismissReason] = useState('');
  const [dismissConfirmOpen, setDismissConfirmOpen] = useState(false);
  const pageBusy = loading || Boolean(busyKey);

  useEffect(() => {
    void load(page, appliedFilters);
  }, [page, appliedFilters]);

  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = window.setInterval(() => {
      setCooldownRemaining((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownRemaining]);

  async function load(nextPage = page, filters = appliedFilters) {
    const requestId = latestRequestRef.current + 1;
    latestRequestRef.current = requestId;
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.status) query.set('status', filters.status);
      if (filters.severity) query.set('severity', filters.severity);
      if (filters.type) query.set('type', filters.type);
      if (filters.memberId.trim()) query.set('memberId', filters.memberId.trim());
      if (filters.provider.trim()) query.set('provider', filters.provider.trim());
      if (filters.createdFrom) query.set('createdFrom', filters.createdFrom);
      if (filters.createdTo) query.set('createdTo', filters.createdTo);
      query.set('page', String(nextPage));
      query.set('take', String(PAGE_SIZE));

      const response = await adminApiFetch(`/admin/risk-alerts?${query.toString()}`);
      const data = await response.json().catch(() => null) as RiskResponse | null;
      if (!response.ok || !isRecord(data)) throw new Error('load');
      if (latestRequestRef.current !== requestId) return;

      const nextItems = Array.isArray(data.items) ? data.items.filter(isRiskAlert) : [];
      const totalValue = Number(data.total ?? nextItems.length);
      const pageCountValue = Number(data.pageCount ?? 1);
      const openCountValue = Number(data.summary?.openCount ?? 0);
      const criticalCountValue = Number(data.summary?.criticalCount ?? 0);
      const nextPageCount = Number.isFinite(pageCountValue) ? Math.max(Math.floor(pageCountValue), 1) : 1;

      setItems(nextItems);
      setTotal(Number.isFinite(totalValue) ? Math.max(totalValue, 0) : nextItems.length);
      setPageCount(nextPageCount);
      setSummary({
        openCount: Number.isFinite(openCountValue) ? Math.max(openCountValue, 0) : 0,
        criticalCount: Number.isFinite(criticalCountValue) ? Math.max(criticalCountValue, 0) : 0,
      });
      if (nextPage > nextPageCount) setPage(nextPageCount);
      setSelectedIds((current) => current.filter((id) => nextItems.some((item) => item.id === id && canBulkSelect(item))));
      setMessage('');
    } catch {
      if (latestRequestRef.current !== requestId) return;
      setItems([]);
      setTotal(0);
      setPageCount(1);
      setSummary({ openCount: 0, criticalCount: 0 });
      setSelectedIds([]);
      setMessage('โหลดรายการความเสี่ยงไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      if (latestRequestRef.current === requestId) setLoading(false);
    }
  }

  async function scan() {
    if (pageBusy || cooldownRemaining > 0) return;
    setBusyKey('scan');
    setMessage('กำลังตรวจหารายการผิดปกติ...');
    try {
      const response = await adminApiFetch('/admin/risk-alerts/scan', { method: 'POST' });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        const retryAfter = isRecord(data) ? Number(data.retryAfter ?? 0) : 0;
        if (Number.isFinite(retryAfter) && retryAfter > 0) {
          setCooldownRemaining(retryAfter);
          setMessage(`กรุณารอ ${retryAfter} วินาทีก่อนตรวจอีกครั้ง`);
          return;
        }
        throw new Error('scan');
      }
      const created = isRecord(data) ? Number(data.created ?? 0) : 0;
      setMessage(`ตรวจเสร็จ พบรายการใหม่ ${Number.isFinite(created) ? Math.max(created, 0) : 0} รายการ`);
      setCooldownRemaining(45);
      await load(page, appliedFilters);
    } catch {
      setMessage('ตรวจหารายการผิดปกติไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setBusyKey('');
    }
  }

  async function updateStatus(item: RiskAlert, nextStatus: RiskStatus) {
    if (pageBusy || !canTransition(item.status, nextStatus)) return;
    setBusyKey(`status:${item.id}`);
    try {
      const response = await adminApiFetch(`/admin/risk-alerts/${item.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      await response.json().catch(() => null);
      if (!response.ok) throw new Error('status');
      await load(page, appliedFilters);
      setMessage('อัปเดตสถานะแล้ว');
    } catch {
      setMessage('อัปเดตสถานะไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setBusyKey('');
    }
  }

  async function loadAutoCloseSuggestions() {
    if (pageBusy) return;
    setBusyKey('suggestions');
    try {
      const response = await adminApiFetch('/admin/risk-alerts/auto-close-suggestions?limit=20');
      const data = await response.json().catch(() => null);
      if (!response.ok || !isRecord(data)) throw new Error('suggestions');
      const suggestions = Array.isArray(data.items) ? data.items.filter(isAutoCloseSuggestion) : [];
      setAutoCloseSuggestions(suggestions);
      setMessage(`พบรายการที่ควรตรวจเพื่อปิด ${suggestions.length} รายการ`);
    } catch {
      setAutoCloseSuggestions([]);
      setMessage('โหลดรายการที่อาจปิดได้ไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setBusyKey('');
    }
  }

  async function bulkDismiss() {
    if (!selectedIds.length || pageBusy) return;
    const eligibleIds = items.filter(canBulkSelect).map((item) => item.id);
    if (selectedIds.some((id) => !eligibleIds.includes(id))) {
      setSelectedIds((current) => current.filter((id) => eligibleIds.includes(id)));
      setDismissConfirmOpen(false);
      setMessage('มีบางรายการเปลี่ยนสถานะแล้ว กรุณาตรวจรายการที่เลือกอีกครั้ง');
      return;
    }
    if (dismissReason.trim().length < 5) {
      setMessage('กรุณาระบุเหตุผลอย่างน้อย 5 ตัวอักษร');
      return;
    }
    setBusyKey('bulk-dismiss');
    try {
      const response = await adminApiFetch('/admin/risk-alerts/bulk-dismiss', {
        method: 'POST',
        body: JSON.stringify({ ids: selectedIds, reason: dismissReason.trim() }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error('dismiss');
      const updated = isRecord(data) ? Number(data.updated ?? 0) : 0;
      setSelectedIds([]);
      setDismissReason('');
      setDismissConfirmOpen(false);
      await load(page, appliedFilters);
      setMessage(`ปิดรายการแล้ว ${Number.isFinite(updated) ? Math.max(updated, 0) : 0} รายการ`);
    } catch {
      setMessage('ปิดรายการไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setBusyKey('');
    }
  }

  function applyFilters() {
    if (pageBusy) return;
    if (draftFilters.createdFrom && draftFilters.createdTo && draftFilters.createdFrom > draftFilters.createdTo) {
      setMessage('วันที่เริ่มต้องไม่อยู่หลังวันที่สิ้นสุด');
      return;
    }
    setSelectedIds([]);
    setPage(1);
    setAppliedFilters({ ...draftFilters });
  }

  function clearFilters() {
    if (pageBusy) return;
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setSelectedIds([]);
    setPage(1);
  }

  const scanDisabled = pageBusy || cooldownRemaining > 0;

  return <AdminPage
    eyebrow="ความเสี่ยง"
    title="รายการที่ต้องตรวจ"
    description="รวมรายการผิดปกติจากการฝาก ถอน บัญชี และยอดเงิน เพื่อให้ผู้ดูแลตรวจสอบและปิดเรื่องได้จากหน้าเดียว"
    actions={<>
      <AdminButton onClick={() => void scan()} disabled={scanDisabled}>
        {busyKey === 'scan' ? 'กำลังตรวจ...' : cooldownRemaining > 0 ? `รอ ${cooldownRemaining} วินาที` : 'ตรวจหารายการผิดปกติ'}
      </AdminButton>
      <AdminButton tone="secondary" onClick={() => void loadAutoCloseSuggestions()} disabled={pageBusy}>ดูรายการที่อาจปิดได้</AdminButton>
    </>}
  >
    <AdminMetricGrid>
      <AdminMetric title="รอตรวจ" value={String(summary.openCount)} helper="รวมรายการใหม่และกำลังตรวจ" />
      <AdminMetric title="เร่งด่วนที่สุด" value={String(summary.criticalCount)} helper="ควรตรวจเป็นลำดับแรก" />
      <AdminMetric title="แสดงในหน้านี้" value={String(items.length)} helper={`${total} รายการทั้งหมด`} />
      <AdminMetric title="หน้า" value={`${page}/${pageCount}`} helper={`${PAGE_SIZE} รายการต่อหน้า`} />
    </AdminMetricGrid>

    {cooldownRemaining > 0 && <AdminNotice>ตรวจใหม่ได้ใน {cooldownRemaining} วินาที</AdminNotice>}

    <AdminToolbar>
      <label style={fieldStyle}>สถานะ
        <select value={draftFilters.status} disabled={pageBusy} onChange={(event) => setDraftFilters((current) => ({ ...current, status: event.target.value }))} style={inputStyle}>
          {statusOptions.map((value) => <option key={value} value={value}>{value ? humanStatus(value) : 'ทั้งหมด'}</option>)}
        </select>
      </label>
      <label style={fieldStyle}>ระดับความเสี่ยง
        <select value={draftFilters.severity} disabled={pageBusy} onChange={(event) => setDraftFilters((current) => ({ ...current, severity: event.target.value }))} style={inputStyle}>
          {severityOptions.map((value) => <option key={value} value={value}>{value ? severityLabel(value) : 'ทั้งหมด'}</option>)}
        </select>
      </label>
      <label style={fieldStyle}>ประเภท
        <select value={draftFilters.type} disabled={pageBusy} onChange={(event) => setDraftFilters((current) => ({ ...current, type: event.target.value }))} style={inputStyle}>
          {typeOptions.map((value) => <option key={value} value={value}>{value ? riskTypeLabel(value) : 'ทั้งหมด'}</option>)}
        </select>
      </label>
      <label style={fieldStyle}>รหัสสมาชิก
        <input value={draftFilters.memberId} disabled={pageBusy} onChange={(event) => setDraftFilters((current) => ({ ...current, memberId: event.target.value }))} placeholder="รหัสสมาชิก" style={inputStyle} />
      </label>
      <label style={fieldStyle}>รหัสค่าย
        <input value={draftFilters.provider} disabled={pageBusy} onChange={(event) => setDraftFilters((current) => ({ ...current, provider: event.target.value }))} placeholder="เช่น pragmatic" style={inputStyle} />
      </label>
      <label style={fieldStyle}>ตั้งแต่วันที่
        <input type="date" value={draftFilters.createdFrom} disabled={pageBusy} onChange={(event) => setDraftFilters((current) => ({ ...current, createdFrom: event.target.value }))} style={inputStyle} />
      </label>
      <label style={fieldStyle}>ถึงวันที่
        <input type="date" value={draftFilters.createdTo} disabled={pageBusy} onChange={(event) => setDraftFilters((current) => ({ ...current, createdTo: event.target.value }))} style={inputStyle} />
      </label>
      <div style={filterActionStyle}>
        <AdminButton tone="secondary" onClick={applyFilters} disabled={pageBusy}>ใช้ตัวกรอง</AdminButton>
        <AdminButton tone="secondary" onClick={clearFilters} disabled={pageBusy}>ล้างตัวกรอง</AdminButton>
      </div>
      {selectedIds.length > 0 && <AdminButton tone="danger" disabled={pageBusy} onClick={() => setDismissConfirmOpen(true)}>ปิดรายการที่เลือก ({selectedIds.length})</AdminButton>}
      <div style={pagerStyle}>
        <AdminButton disabled={pageBusy || page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>ก่อนหน้า</AdminButton>
        <span>หน้า {page} / {pageCount}</span>
        <AdminButton disabled={pageBusy || page >= pageCount} onClick={() => setPage((value) => Math.min(value + 1, pageCount))}>ถัดไป</AdminButton>
      </div>
    </AdminToolbar>

    {message && <AdminNotice tone={message.includes('ไม่สำเร็จ') || message.includes('วันที่') || message.includes('เปลี่ยนสถานะ') ? 'danger' : 'neutral'}>{message}</AdminNotice>}

    {autoCloseSuggestions.length > 0 && <AdminCard title="รายการที่อาจปิดได้" description="ปลายทางของรายการเหล่านี้สิ้นสุดแล้ว ควรเปิดตรวจรายละเอียดก่อนปิด">
      <AdminStack>
        {autoCloseSuggestions.map((item) => <AdminRow key={item.id}>
          <div style={alertBodyStyle}>
            <strong>{item.reason}</strong>
            <span style={mutedStyle}>{item.refType ?? 'รายการ'} / {item.refId ?? '-'} · {humanStatus(item.status)}</span>
          </div>
          <AdminLinkButton href={`/risk-alerts/${item.id}`}>ตรวจรายละเอียด</AdminLinkButton>
        </AdminRow>)}
      </AdminStack>
    </AdminCard>}

    <AdminCard title="รายการความเสี่ยง" description="เปิดดูรายละเอียดก่อนเปลี่ยนสถานะ โดยเฉพาะรายการความเสี่ยงสูง">
      <AdminStack>
        {loading ? <AdminEmpty>กำลังโหลด...</AdminEmpty> : items.length === 0 ? <AdminEmpty>ไม่พบรายการตามตัวกรอง</AdminEmpty> : items.map((item) => {
          const bulkSelectable = canBulkSelect(item);
          return <AdminRow key={item.id}>
            <div style={alertBodyStyle}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <AdminBadge tone={severityTone(item.severity)}>{severityLabel(item.severity)}</AdminBadge>
                <AdminBadge tone={statusTone(item.status)}>{humanStatus(item.status)}</AdminBadge>
                <AdminBadge>{riskTypeLabel(item.type)}</AdminBadge>
              </div>
              <strong>{item.title}</strong>
              {item.description && <span style={mutedStyle}>{item.description}</span>}
              <div style={detailGridStyle}>
                <span>สมาชิก: {item.memberId ? <a href={`/members/${item.memberId}`} style={linkStyle}>{item.shortMemberId ?? item.memberId.slice(0, 8)}</a> : '-'}</span>
                <span>รายการอ้างอิง: {item.refId ? <a href={riskTargetHref(item)} style={linkStyle}>{item.refType ?? 'รายการ'} / {item.refId.slice(0, 8)}</a> : '-'}</span>
                <span>พบเมื่อ: {new Date(item.createdAt).toLocaleString('th-TH')}</span>
              </div>
              {item.metadata && <details style={detailsStyle}>
                <summary>ข้อมูลเพิ่มเติม</summary>
                <RiskMetadataView metadata={item.metadata} />
                <RiskMetadataRaw metadata={item.metadata} />
              </details>}
            </div>
            <div style={actionStyle}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 12 }}>
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  disabled={pageBusy || !bulkSelectable}
                  onChange={(event) => setSelectedIds((current) => event.target.checked ? [...new Set([...current, item.id])] : current.filter((id) => id !== item.id))}
                />
                เลือก
              </label>
              <AdminLinkButton href={`/risk-alerts/${item.id}`}>ดูรายละเอียด</AdminLinkButton>
              <AdminButton tone="secondary" disabled={pageBusy || !canTransition(item.status, 'REVIEWING')} onClick={() => void updateStatus(item, 'REVIEWING')}>เริ่มตรวจ</AdminButton>
              <AdminButton tone="success" disabled={pageBusy || !canTransition(item.status, 'RESOLVED')} onClick={() => void updateStatus(item, 'RESOLVED')}>แก้ไขแล้ว</AdminButton>
              <AdminButton tone="danger" disabled={pageBusy || !canTransition(item.status, 'DISMISSED')} onClick={() => void updateStatus(item, 'DISMISSED')}>ปิดรายการ</AdminButton>
            </div>
          </AdminRow>;
        })}
      </AdminStack>
    </AdminCard>

    <AdminConfirmDialog
      open={dismissConfirmOpen}
      title="ยืนยันปิดเคสความเสี่ยง"
      description={`คุณกำลังปิด ${selectedIds.length.toLocaleString('th-TH')} เคสที่เลือก การดำเนินการนี้จะถูกบันทึกใน Audit log`}
      confirmLabel="ยืนยันปิดเคส"
      tone="danger"
      busy={busyKey === 'bulk-dismiss'}
      onCancel={() => { if (!pageBusy) setDismissConfirmOpen(false); }}
      onConfirm={() => void bulkDismiss()}
      details={<label style={fieldStyle}>เหตุผลในการปิดเคส
        <textarea value={dismissReason} disabled={pageBusy} onChange={(event) => setDismissReason(event.target.value)} placeholder="ระบุเหตุผลอย่างน้อย 5 ตัวอักษร" style={{ ...inputStyle, minHeight: 100, padding: 12 }} />
      </label>}
    />
  </AdminPage>;
}

function severityTone(value: RiskSeverity) {
  if (value === 'CRITICAL' || value === 'HIGH') return 'danger';
  if (value === 'MEDIUM') return 'warning';
  return 'neutral';
}

function riskTypeLabel(type: string) {
  const map: Record<string, string> = {
    REPEATED_TOPUPS: 'ฝากถี่ผิดปกติ',
    RAPID_DEPOSIT_WITHDRAWAL: 'ฝากแล้วถอนเร็ว',
    HIGH_WITHDRAWAL: 'ถอนยอดสูง',
    BANK_CHANGE_WITHDRAWAL: 'เปลี่ยนบัญชีแล้วถอน',
    MULTIPLE_PENDING_TOPUPS: 'มีรายการฝากค้างหลายรายการ',
    WALLET_LEDGER_MISMATCH: 'ยอดกระเป๋าเงินไม่ตรง',
    DUPLICATE_DEPOSIT_SLIP: 'พบสลิปฝากซ้ำ',
    REPEATED_DUPLICATE_DEPOSIT_SLIP: 'ใช้สลิปฝากซ้ำหลายครั้ง',
  };
  return map[type] ?? type;
}

function riskTargetHref(item: RiskAlert) {
  const refType = String(item.refType ?? '').toLowerCase();
  const refId = encodeURIComponent(item.refId ?? '');
  if (refType.includes('withdrawal')) return `/withdrawals?requestId=${refId}`;
  if (refType.includes('top') || refType.includes('deposit')) return `/topups?requestId=${refId}`;
  if (refType.includes('user') || refType.includes('member')) return `/members/${refId}`;
  if (refType.includes('wallet')) return `/wallets?walletId=${refId}`;
  if (refType.includes('provider')) return `/provider-health?provider=${refId}`;
  return `/risk-alerts/${encodeURIComponent(item.id)}`;
}

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
