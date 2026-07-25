'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { stringifyAdminPayload } from '../_components/admin-payload-redaction';
import { AdminAuditExportButton } from './admin-audit-export-button';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmpty,
  AdminLinkButton,
  AdminMetric,
  AdminMetricGrid,
  AdminNotice,
  AdminPage,
  AdminStack,
} from '../_components/admin-ui';

type AuditLog = {
  id: string;
  action: string;
  module: string;
  targetId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  oldData?: unknown;
  newData?: unknown;
  createdAt: string;
  adminUser?: { id: string; username: string; email: string } | null;
};

type AuditFilters = {
  search: string;
  module: string;
  action: string;
  admin: string;
  targetId: string;
  from: string;
  to: string;
};

type NoticeTone = 'neutral' | 'success' | 'danger';

const PAGE_SIZE = 20;
const emptyFilters: AuditFilters = { search: '', module: '', action: '', admin: '', targetId: '', from: '', to: '' };

export default function AdminAuditPage() {
  const [items, setItems] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [draft, setDraft] = useState<AuditFilters>(emptyFilters);
  const [applied, setApplied] = useState<AuditFilters>(emptyFilters);
  const [message, setMessage] = useState('');
  const [messageTone, setMessageTone] = useState<NoticeTone>('neutral');
  const [loading, setLoading] = useState(false);
  const requestSequence = useRef(0);

  useEffect(() => { void loadAuditLogs(page, applied); }, [page, applied]);

  const moduleCount = useMemo(() => new Set(items.map((item) => item.module)).size, [items]);
  const adminCount = useMemo(() => new Set(items.map((item) => item.adminUser?.id).filter(Boolean)).size, [items]);
  const activeFilters = useMemo(() => Object.entries(applied).filter(([, value]) => value.trim()), [applied]);

  async function loadAuditLogs(nextPage = page, filters = applied) {
    const requestId = ++requestSequence.current;
    const safePage = Math.max(1, Math.floor(nextPage));
    setLoading(true);
    setMessageTone('neutral');
    setMessage('กำลังโหลด audit logs...');
    try {
      const params = new URLSearchParams({ page: String(safePage), take: String(PAGE_SIZE) });
      Object.entries(filters).forEach(([key, value]) => { const trimmed = value.trim(); if (trimmed) params.set(key, trimmed); });
      const response = await adminApiFetch(`/admin/audit-logs?${params.toString()}`);
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isAuditResponse(payload)) throw new Error('load');
      if (requestId !== requestSequence.current) return;

      const nextPageCount = positiveInteger(payload.pageCount, 1);
      if (safePage > nextPageCount) {
        setPage(nextPageCount);
        return;
      }

      setItems(payload.items);
      setTotal(nonNegativeInteger(payload.total, payload.items.length));
      setPageCount(nextPageCount);
      setMessage('');
    } catch {
      if (requestId !== requestSequence.current) return;
      setItems([]);
      setTotal(0);
      setPageCount(1);
      setMessageTone('danger');
      setMessage('โหลด audit logs ไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      if (requestId === requestSequence.current) setLoading(false);
    }
  }

  function applyFilters() {
    if (draft.from && draft.to && draft.from > draft.to) {
      setMessageTone('danger');
      setMessage('ช่วงวันที่ไม่ถูกต้อง วันที่เริ่มต้องไม่อยู่หลังวันที่สิ้นสุด');
      return;
    }
    setMessage('');
    setPage(1);
    setApplied({ ...draft });
  }

  function clearFilters() {
    setDraft(emptyFilters);
    setPage(1);
    setApplied({ ...emptyFilters });
  }

  function showExportMessage(nextMessage: string, error = false) {
    setMessageTone(error ? 'danger' : 'success');
    setMessage(nextMessage);
  }

  return <AdminPage
    eyebrow="Security & Operations"
    title="Audit Logs"
    description="ตรวจสอบว่าใครทำอะไร เมื่อไร จากอุปกรณ์ใด และข้อมูลเปลี่ยนจากอะไรเป็นอะไร"
    actions={<>
      <AdminAuditExportButton filters={applied} disabled={loading} onMessage={showExportMessage} />
      <AdminButton disabled={loading} onClick={() => void loadAuditLogs(page, applied)}>รีเฟรช</AdminButton>
    </>}
  >
    <div className="admin-audit-page">
      {message && <AdminNotice tone={messageTone}>{message}</AdminNotice>}

      <AdminMetricGrid>
        <AdminMetric title="รายการหน้านี้" value={items.length.toLocaleString('th-TH')} helper={`${total.toLocaleString('th-TH')} รายการทั้งหมด`} />
        <AdminMetric title="หน้า" value={`${page}/${pageCount}`} helper={`${PAGE_SIZE} รายการต่อหน้า`} />
        <AdminMetric title="โมดูล" value={moduleCount.toLocaleString('th-TH')} helper="จากข้อมูลหน้านี้" />
        <AdminMetric title="ผู้ดูแล" value={adminCount.toLocaleString('th-TH')} helper="จากข้อมูลหน้านี้" />
        <AdminMetric title="โหมด" value="Read-only" helper="ไม่แก้ไขข้อมูลธุรกรรม" />
      </AdminMetricGrid>

      <AdminCard title="ค้นหาและกรอง" description="กรองตามข้อความ โมดูล action ผู้ดูแล target และช่วงเวลา">
        <form onSubmit={(event) => { event.preventDefault(); applyFilters(); }}>
          <div className="admin-audit-filter-grid">
            <label className="admin-audit-field"><span>ค้นหารวม</span><input disabled={loading} value={draft.search} onChange={(event) => setDraft((value) => ({ ...value, search: event.target.value }))} placeholder="action, module, target, IP..." /></label>
            <label className="admin-audit-field"><span>โมดูล</span><input disabled={loading} value={draft.module} onChange={(event) => setDraft((value) => ({ ...value, module: event.target.value }))} placeholder="topups, withdrawals..." /></label>
            <label className="admin-audit-field"><span>Action</span><input disabled={loading} value={draft.action} onChange={(event) => setDraft((value) => ({ ...value, action: event.target.value }))} placeholder="approve, reject, login..." /></label>
            <label className="admin-audit-field"><span>ผู้ดูแล</span><input disabled={loading} value={draft.admin} onChange={(event) => setDraft((value) => ({ ...value, admin: event.target.value }))} placeholder="ชื่อหรืออีเมล" /></label>
            <label className="admin-audit-field"><span>Target ID</span><input disabled={loading} value={draft.targetId} onChange={(event) => setDraft((value) => ({ ...value, targetId: event.target.value }))} placeholder="UUID ของรายการ" /></label>
            <label className="admin-audit-field"><span>ตั้งแต่วันที่</span><input disabled={loading} type="date" value={draft.from} onChange={(event) => setDraft((value) => ({ ...value, from: event.target.value }))} /></label>
            <label className="admin-audit-field"><span>ถึงวันที่</span><input disabled={loading} type="date" value={draft.to} onChange={(event) => setDraft((value) => ({ ...value, to: event.target.value }))} /></label>
          </div>
          <div className="admin-audit-filter-actions">
            <AdminButton type="submit" disabled={loading}>ใช้ตัวกรอง</AdminButton>
            <AdminButton type="button" disabled={loading} tone="secondary" onClick={clearFilters}>ล้างตัวกรอง</AdminButton>
          </div>
        </form>
        {activeFilters.length > 0 && <div className="admin-audit-filter-chips">{activeFilters.map(([key, value]) => <AdminBadge key={key} tone="warning">{key}: {value}</AdminBadge>)}</div>}
      </AdminCard>

      <AdminCard title="เหตุการณ์" description="ข้อมูลสำคัญใน before/after จะถูกปิดบังก่อนแสดงผล">
        <AdminStack>
          {items.map((item) => {
            const href = targetHref(item.module, item.targetId);
            const tone = actionTone(item.action);
            return <article key={item.id} className="admin-audit-event" data-tone={tone}>
              <header className="admin-audit-event__top">
                <div className="admin-audit-event__badges">
                  <AdminBadge tone="neutral">{item.module || 'unknown'}</AdminBadge>
                  <AdminBadge tone={tone}>{item.action}</AdminBadge>
                </div>
                <time dateTime={item.createdAt}>{formatDateTime(item.createdAt)}</time>
              </header>

              <div className="admin-audit-event__summary">
                <div className="admin-audit-data-cell"><span>ผู้ดูแล</span><strong>{item.adminUser?.username ?? item.adminUser?.email ?? 'Unknown admin'}</strong></div>
                <div className="admin-audit-data-cell"><span>อีเมล</span><strong>{item.adminUser?.email ?? '-'}</strong></div>
                <div className="admin-audit-data-cell"><span>Target</span><strong>{item.targetId || '-'}</strong></div>
                <div className="admin-audit-data-cell"><span>IP address</span><strong>{item.ipAddress || '-'}</strong></div>
              </div>

              <div className="admin-audit-agent"><span>User agent</span><span>{item.userAgent || '-'}</span></div>

              <div className="admin-audit-event__details">
                <AuditData title="ข้อมูลก่อนเปลี่ยน" value={item.oldData} />
                <AuditData title="ข้อมูลหลังเปลี่ยน" value={item.newData} />
              </div>

              {href && <div className="admin-audit-event__link"><AdminLinkButton href={href}>เปิดรายการที่เกี่ยวข้อง</AdminLinkButton></div>}
            </article>;
          })}
          {!loading && items.length === 0 && <AdminEmpty>ยังไม่มี audit log ตามเงื่อนไขนี้</AdminEmpty>}
        </AdminStack>

        <div className="admin-audit-pager">
          <AdminButton disabled={loading || page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>ก่อนหน้า</AdminButton>
          <span>หน้า {page} / {pageCount}</span>
          <AdminButton disabled={loading || page >= pageCount} onClick={() => setPage((value) => Math.min(value + 1, pageCount))}>ถัดไป</AdminButton>
        </div>
      </AdminCard>
    </div>
  </AdminPage>;
}

function AuditData({ title, value }: { title: string; value: unknown }) {
  const hasValue = value !== undefined && value !== null;
  return <details className="admin-audit-payload">
    <summary>{title}</summary>
    {hasValue ? <pre>{stringifyAdminPayload(value)}</pre> : <p>ไม่มีข้อมูล</p>}
  </details>;
}

function targetHref(moduleName: string, targetId?: string | null) {
  if (!targetId) return null;
  const module = moduleName.toLowerCase();
  const id = encodeURIComponent(targetId);
  if (module.includes('admin-access') || module.includes('admin_access') || module.includes('delegat') || module.includes('role') || module.includes('permission')) return '/access';
  if (module.includes('admin-account') || module.includes('admin_user') || module.includes('admin-user')) return `/admin-accounts?adminId=${id}`;
  if (module.includes('anti-bot') || module.includes('anti_bot') || module.includes('captcha')) return '/anti-bot';
  if (module.includes('auth') || module === 'security') return '/security';
  if (module.includes('topup') || module.includes('deposit')) return `/topups?requestId=${id}`;
  if (module.includes('withdraw')) return `/withdrawals?requestId=${id}`;
  if (module.includes('game-session') || module.includes('game_session')) return `/game-sessions?sessionId=${id}`;
  if (module.includes('game-transfer') || module.includes('game_transfer')) return `/game-transfers?transferId=${id}`;
  if (module.includes('webhook')) return `/webhook-logs?referenceId=${id}`;
  if (module.includes('reconciliation')) return `/reconciliation-center?referenceId=${id}`;
  if (module.includes('provider')) return `/game-providers?providerId=${id}`;
  if (module.includes('promotion-claim') || module.includes('promotion_claim')) return `/promotion-claims?claimId=${id}`;
  if (module.includes('promotion')) return `/promotion-center?promotionId=${id}`;
  if (module.includes('bonus')) return `/bonus-ledgers?referenceId=${id}`;
  if (module.includes('commission')) return `/commission-ledgers?referenceId=${id}`;
  if (module.includes('affiliate')) return `/affiliate-center?affiliateId=${id}`;
  if (module.includes('support')) return `/support-center?ticketId=${id}`;
  if (module.includes('kyc')) return `/kyc-center?caseId=${id}`;
  if (module.includes('content') || module.includes('cms')) return '/content-center';
  if (module.includes('setting')) return '/settings';
  if (module.includes('risk')) return `/risk-alerts/${id}`;
  if (module.includes('member') || module.includes('user')) return `/members/${id}`;
  if (module.includes('wallet') || module.includes('ledger') || module.includes('money')) return `/ledgers?referenceId=${id}`;
  return null;
}

function actionTone(action: string) {
  const value = action.toLowerCase();
  if (value.includes('reject') || value.includes('revoke') || value.includes('fail') || value.includes('delete')) return 'danger';
  if (value.includes('approve') || value.includes('complete') || value.includes('confirm') || value.includes('create')) return 'success';
  if (value.includes('claim') || value.includes('review') || value.includes('update')) return 'warning';
  return 'neutral';
}

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }
function isNullableString(value: unknown): value is string | null | undefined { return value === undefined || value === null || typeof value === 'string'; }
function isAdminUser(value: unknown): value is NonNullable<AuditLog['adminUser']> { return isRecord(value) && typeof value.id === 'string' && typeof value.username === 'string' && typeof value.email === 'string'; }
function isAuditLog(value: unknown): value is AuditLog { return isRecord(value) && typeof value.id === 'string' && typeof value.action === 'string' && typeof value.module === 'string' && typeof value.createdAt === 'string' && isNullableString(value.targetId) && isNullableString(value.ipAddress) && isNullableString(value.userAgent) && (value.adminUser === undefined || value.adminUser === null || isAdminUser(value.adminUser)); }
function isAuditResponse(value: unknown): value is { items: AuditLog[]; total?: unknown; pageCount?: unknown } { return isRecord(value) && Array.isArray(value.items) && value.items.every(isAuditLog); }
function nonNegativeInteger(value: unknown, fallback: number) { const parsed = Number(value); return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback; }
function positiveInteger(value: unknown, fallback: number) { const parsed = Number(value); return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : fallback; }
function formatDateTime(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('th-TH'); }
