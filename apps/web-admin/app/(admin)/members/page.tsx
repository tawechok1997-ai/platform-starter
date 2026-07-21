'use client';

import { FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminStack, AdminToolbar, formatMoney } from '../_components/admin-ui';
import { hasAnyPermission, maskEmail, maskPhone } from '../_components/member-mask';

type MemberItem = { id: string; shortId: string; username: string; phone?: string | null; email?: string | null; status: string; displayName?: string | null; balance: string; lockedBalance: string; availableBalance: string; createdAt: string; lastLoginAt?: string | null };
type AdminIdentity = { permissions?: string[] };
type PendingStatus = { member: MemberItem; status: 'ACTIVE' | 'SUSPENDED' | 'LOCKED' };
const STATUSES = ['ALL', 'ACTIVE', 'SUSPENDED', 'LOCKED', 'CLOSED'];
const PAGE_SIZE = 20;

export default function MembersPage() {
  const [items, setItems] = useState<MemberItem[]>([]);
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [pendingStatus, setPendingStatus] = useState<PendingStatus | null>(null);
  const [statusReason, setStatusReason] = useState('');

  useEffect(() => { void loadAccess(); }, []);
  useEffect(() => { void loadItems(page, submittedSearch, status); }, [page, submittedSearch, status]);

  async function loadAccess() {
    const response = await adminApiFetch('/admin/auth/me', { cache: 'no-store' });
    const data = await response.json().catch(() => null) as AdminIdentity | null;
    if (response.ok && data) setPermissions(Array.isArray(data.permissions) ? data.permissions : []);
  }

  async function loadItems(nextPage: number, nextSearch: string, nextStatus: string) {
    setLoading(true);
    setMessage('กำลังโหลดสมาชิก...');
    const params = new URLSearchParams();
    if (nextSearch) params.set('search', nextSearch);
    if (nextStatus !== 'ALL') params.set('status', nextStatus);
    params.set('page', String(nextPage));
    params.set('take', String(PAGE_SIZE));
    const res = await adminApiFetch(`/admin/members?${params.toString()}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'โหลดรายชื่อสมาชิกไม่สำเร็จ'); setLoading(false); return; }
    setItems(data.items ?? []);
    setTotal(Number(data.total ?? data.items?.length ?? 0));
    setPageCount(Math.max(Number(data.pageCount ?? 1), 1));
    setMessage('');
    setLoading(false);
  }

  function searchMembers(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setSubmittedSearch(search.trim());
  }

  function resetFilters() {
    setSearch('');
    setSubmittedSearch('');
    setStatus('ALL');
    setPage(1);
  }

  function changeStatus(nextStatus: string) {
    setStatus(nextStatus);
    setPage(1);
  }

  function requestStatus(member: MemberItem, nextStatus: PendingStatus['status']) { setPendingStatus({ member, status: nextStatus }); setStatusReason(''); }

  async function updateStatus() {
    if (!pendingStatus) return;
    const reason = statusReason.trim();
    if (!reason) { setMessage('กรุณาระบุเหตุผลก่อนเปลี่ยนสถานะสมาชิก'); return; }
    const { member, status: nextStatus } = pendingStatus;
    setBusyId(member.id);
    setMessage('กำลังอัปเดตสถานะ...');
    const res = await adminApiFetch(`/admin/members/${member.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus, reason }),
    });
    const data = await res.json().catch(() => null);
    setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'อัปเดตสถานะไม่สำเร็จ'); return; }
    setItems((current) => current.map((item) => item.id === member.id ? { ...item, status: data.user.status } : item));
    setPendingStatus(null);
    setStatusReason('');
    setMessage('อัปเดตสถานะสมาชิกแล้ว');
  }

  const canViewPii = hasAnyPermission(permissions, ['users.pii.view', 'users.sensitive.view', 'admin.access.view']);
  const canViewBalances = hasAnyPermission(permissions, ['wallet.view']);
  const totals = useMemo(() => ({
    activeCount: items.filter((item) => item.status === 'ACTIVE').length,
    restrictedCount: items.filter((item) => item.status !== 'ACTIVE').length,
    available: items.reduce((sum, item) => sum + Number(item.availableBalance ?? 0), 0),
  }), [items]);

  return <AdminPage eyebrow="สมาชิก" title="รายชื่อสมาชิก" description="ค้นหา ดูข้อมูลสำคัญ และเปลี่ยนสถานะสมาชิกจากหน้าเดียว" actions={<AdminButton onClick={() => void loadItems(page, submittedSearch, status)}>รีเฟรช</AdminButton>}>
    <form onSubmit={searchMembers} className="admin-members-filter-form">
      <AdminToolbar>
        <label className="admin-members-field"><span>ค้นหา</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ชื่อผู้ใช้ เบอร์โทร อีเมล หรือรหัสสมาชิก" /></label>
        <label className="admin-members-field"><span>สถานะ</span><select value={status} onChange={(event) => changeStatus(event.target.value)}>{STATUSES.map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}</select></label>
        <div className="admin-members-filter-actions"><AdminButton type="submit">ค้นหา</AdminButton><AdminButton type="button" tone="secondary" onClick={resetFilters}>ล้าง</AdminButton></div>
        <div className="admin-queue-pager"><AdminButton type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(value - 1, 1))}>ก่อนหน้า</AdminButton><span className="admin-queue-page-label">หน้า {page} จาก {pageCount}</span><AdminButton type="button" disabled={page >= pageCount || loading} onClick={() => setPage((value) => Math.min(value + 1, pageCount))}>ถัดไป</AdminButton></div>
      </AdminToolbar>
    </form>

    {message && <AdminNotice>{message}</AdminNotice>}
    {(!canViewPii || !canViewBalances) && <AdminNotice tone="warning">ข้อมูลบางส่วนถูกซ่อนตามสิทธิ์ของบัญชีนี้</AdminNotice>}

    <AdminMetricGrid>
      <AdminMetric title="รายการที่แสดง" value={`${items.length}`} helper={`ทั้งหมด ${total} รายการ`} />
      <AdminMetric title="ใช้งานได้" value={`${totals.activeCount}`} helper="เฉพาะหน้านี้" tone="success" />
      <AdminMetric title="ถูกจำกัด" value={`${totals.restrictedCount}`} helper="ระงับ ล็อก หรือปิดบัญชี" tone={totals.restrictedCount ? 'warning' : 'neutral'} />
      <AdminMetric title="ยอดใช้ได้รวม" value={canViewBalances ? formatMoney(String(totals.available)) : '••••••'} helper={canViewBalances ? 'เฉพาะรายการที่แสดง' : 'ไม่มีสิทธิ์ดูยอดเงิน'} />
    </AdminMetricGrid>

    {loading && items.length === 0 ? <AdminEmpty>กำลังโหลดสมาชิก...</AdminEmpty> : <AdminStack>{items.map((item) => <AdminCard key={item.id} title={item.username} description={`${item.displayName || 'ยังไม่ได้ตั้งชื่อ'} · ${item.shortId}`}>
      <article className="admin-member-card-grid">
        <section className="admin-member-identity">
          <div className="admin-member-badges"><AdminBadge tone={statusTone(item.status)}>{statusLabel(item.status)}</AdminBadge><AdminBadge>{item.shortId}</AdminBadge></div>
          <p>{maskPhone(item.phone, canViewPii)} · {maskEmail(item.email, canViewPii)}</p>
          <p>สมัครเมื่อ {new Date(item.createdAt).toLocaleDateString('th-TH')}</p>
          <p>เข้าใช้ล่าสุด {item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString('th-TH') : 'ยังไม่เคยเข้าใช้'}</p>
        </section>
        <section className="admin-member-money-summary">
          <div><span>ยอดใช้ได้</span><strong>{canViewBalances ? formatMoney(item.availableBalance) : '••••••'}</strong></div>
          <div className="admin-member-balance-grid"><span>ยอดรวม {canViewBalances ? formatMoney(item.balance) : '••••••'}</span><span>ยอดล็อก {canViewBalances ? formatMoney(item.lockedBalance) : '••••••'}</span></div>
          <a href={`/members/${item.id}`} className="admin-member-profile-link">ดูรายละเอียด</a>
        </section>
        <section className="admin-member-actions" aria-label={`เปลี่ยนสถานะ ${item.username}`}>
          <AdminButton disabled={busyId === item.id || item.status === 'ACTIVE'} tone="success" onClick={() => requestStatus(item, 'ACTIVE')}>เปิดใช้งาน</AdminButton>
          <AdminButton disabled={busyId === item.id || item.status === 'SUSPENDED'} tone="danger" onClick={() => requestStatus(item, 'SUSPENDED')}>ระงับบัญชี</AdminButton>
          <AdminButton disabled={busyId === item.id || item.status === 'LOCKED'} tone="danger" onClick={() => requestStatus(item, 'LOCKED')}>ล็อกบัญชี</AdminButton>
        </section>
      </article>
    </AdminCard>)}{items.length === 0 && <AdminEmpty>ไม่พบสมาชิก</AdminEmpty>}</AdminStack>}

    <AdminConfirmDialog
      open={Boolean(pendingStatus)}
      title={pendingStatus ? `${statusActionLabel(pendingStatus.status)} ${pendingStatus.member.username}` : ''}
      description="การเปลี่ยนสถานะมีผลต่อการเข้าใช้งานของสมาชิกและจะถูกบันทึกไว้"
      confirmLabel={pendingStatus ? statusActionLabel(pendingStatus.status) : 'ยืนยัน'}
      tone={pendingStatus?.status === 'ACTIVE' ? 'success' : 'danger'}
      busy={Boolean(pendingStatus && busyId === pendingStatus.member.id)}
      onCancel={() => { setPendingStatus(null); setStatusReason(''); }}
      onConfirm={() => void updateStatus()}
      details={<label><span>เหตุผล</span><textarea value={statusReason} onChange={(event) => setStatusReason(event.target.value)} placeholder="ระบุเหตุผลให้ชัดเจน" /></label>}
    />
  </AdminPage>;
}

function AdminRow({ children }: { children: ReactNode }) { return <div className="admin-member-drawer-row">{children}</div>; }
function statusTone(status: string) { if (status === 'ACTIVE') return 'success'; if (status === 'SUSPENDED' || status === 'LOCKED') return 'danger'; return 'neutral'; }
function statusLabel(status: string) { const labels: Record<string, string> = { ALL: 'ทุกสถานะ', ACTIVE: 'ใช้งานได้', SUSPENDED: 'ระงับ', LOCKED: 'ล็อก', CLOSED: 'ปิดบัญชี' }; return labels[status] ?? status; }
function statusActionLabel(status: PendingStatus['status']) { return status === 'ACTIVE' ? 'เปิดใช้งาน' : status === 'SUSPENDED' ? 'ระงับบัญชี' : 'ล็อกบัญชี'; }
