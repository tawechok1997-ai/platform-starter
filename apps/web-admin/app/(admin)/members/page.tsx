'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminStack, AdminToolbar, formatMoney } from '../_components/admin-ui';
import { hasAnyPermission, maskEmail, maskPhone } from '../_components/member-mask';

type MemberItem = { id: string; shortId: string; username: string; phone?: string | null; email?: string | null; status: string; displayName?: string | null; balance: string; lockedBalance: string; availableBalance: string; createdAt: string; lastLoginAt?: string | null };
type AdminIdentity = { permissions?: string[] };
const STATUSES = ['ALL', 'ACTIVE', 'SUSPENDED', 'LOCKED', 'CLOSED'];
const PAGE_SIZE = 20;

export default function MembersPage() {
  const [items, setItems] = useState<MemberItem[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => { void loadAccess(); void loadItems(undefined, 1); }, []);
  useEffect(() => { if (page > 1) void loadItems(undefined, page); }, [page]);

  async function loadAccess() {
    const response = await adminApiFetch('/admin/auth/me', { cache: 'no-store' });
    const data = await response.json().catch(() => null) as AdminIdentity | null;
    if (response.ok && data) setPermissions(Array.isArray(data.permissions) ? data.permissions : []);
  }

  async function loadItems(event?: FormEvent<HTMLFormElement>, nextPage = page) {
    event?.preventDefault();
    setLoading(true);
    setMessage('กำลังโหลดสมาชิก...');
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (status !== 'ALL') params.set('status', status);
    params.set('page', String(nextPage));
    params.set('take', String(PAGE_SIZE));
    const res = await adminApiFetch(`/admin/members?${params.toString()}`);
    const data = await res.json().catch(() => null);
    if (!res.ok) { setMessage(data?.message ?? 'โหลดสมาชิกไม่สำเร็จ'); setLoading(false); return; }
    setItems(data.items ?? []);
    setTotal(Number(data.total ?? data.items?.length ?? 0));
    setPageCount(Math.max(Number(data.pageCount ?? 1), 1));
    setMessage('');
    setLoading(false);
  }

  function searchMembers(event: FormEvent<HTMLFormElement>) { setPage(1); void loadItems(event, 1); }
  function resetFilters() { setSearch(''); setStatus('ALL'); setPage(1); window.setTimeout(() => void loadItems(undefined, 1), 0); }

  async function updateStatus(id: string, nextStatus: string) {
    setBusyId(id);
    setMessage('กำลังอัปเดตสถานะ...');
    const res = await adminApiFetch(`/admin/members/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus, reason: 'quick action from members page' }) });
    const data = await res.json().catch(() => null);
    setBusyId('');
    if (!res.ok) { setMessage(data?.message ?? 'อัปเดตสถานะไม่สำเร็จ'); return; }
    setItems((current) => current.map((item) => item.id === id ? { ...item, status: data.user.status } : item));
    setMessage('อัปเดตสถานะแล้ว');
  }

  const canViewPii = hasAnyPermission(permissions, ['users.pii.view', 'users.sensitive.view', 'admin.access.view']);
  const canViewBalances = hasAnyPermission(permissions, ['wallet.view']);
  const totals = useMemo(() => ({
    activeCount: items.filter((item) => item.status === 'ACTIVE').length,
    restrictedCount: items.filter((item) => item.status !== 'ACTIVE').length,
    available: items.reduce((sum, item) => sum + Number(item.availableBalance ?? 0), 0),
  }), [items]);

  return <AdminPage eyebrow="Operations" title="สมาชิก" description="ค้นหา ตรวจสถานะ และจัดการสมาชิกจากหน้าเดียว" actions={<AdminButton onClick={() => void loadItems()}>รีเฟรช</AdminButton>}>
    <form onSubmit={searchMembers} className="admin-members-filter-form">
      <AdminToolbar>
        <label className="admin-members-field"><span>ค้นหา</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="username / phone / email / shortId" /></label>
        <label className="admin-members-field"><span>สถานะ</span><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>{STATUSES.map((item) => <option key={item} value={item}>{statusLabel(item)}</option>)}</select></label>
        <div className="admin-members-filter-actions"><AdminButton type="submit">ค้นหา</AdminButton><AdminButton type="button" tone="secondary" onClick={resetFilters}>ล้างตัวกรอง</AdminButton></div>
        <div className="admin-queue-pager"><AdminButton type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(value - 1, 1))}>ก่อนหน้า</AdminButton><span className="admin-queue-page-label">หน้า {page} / {pageCount}</span><AdminButton type="button" disabled={page >= pageCount} onClick={() => setPage((value) => Math.min(value + 1, pageCount))}>ถัดไป</AdminButton></div>
      </AdminToolbar>
    </form>

    {message && <AdminNotice>{message}</AdminNotice>}
    {(!canViewPii || !canViewBalances) && <AdminNotice tone="warning">ข้อมูลอ่อนไหวบางส่วนถูกปิดบังตามสิทธิ์ของบัญชีผู้ดูแล</AdminNotice>}

    <AdminMetricGrid>
      <AdminMetric title="โหลดแล้ว" value={`${items.length}`} helper={`${total} รายการทั้งหมด`} />
      <AdminMetric title="ใช้งานได้" value={`${totals.activeCount}`} helper="เฉพาะหน้าปัจจุบัน" tone="success" />
      <AdminMetric title="ถูกจำกัด" value={`${totals.restrictedCount}`} helper="ระงับ ล็อก หรือปิด" tone={totals.restrictedCount ? 'warning' : 'neutral'} />
      <AdminMetric title="ยอดใช้ได้รวม" value={canViewBalances ? formatMoney(String(totals.available)) : '••••••'} helper={canViewBalances ? 'เฉพาะรายการที่โหลด' : 'ต้องมีสิทธิ์ wallet.view'} />
    </AdminMetricGrid>

    {loading && items.length === 0 ? <AdminEmpty>กำลังโหลดสมาชิก...</AdminEmpty> : <AdminStack>{items.map((item) => <AdminCard key={item.id} title={item.username} description={`${item.displayName || 'ยังไม่มีชื่อแสดง'} · ${item.shortId}`}>
      <article className="admin-member-card-grid">
        <section className="admin-member-identity">
          <div className="admin-member-badges"><AdminBadge tone={statusTone(item.status)}>{statusLabel(item.status)}</AdminBadge><AdminBadge>{item.shortId}</AdminBadge></div>
          <p>{maskPhone(item.phone, canViewPii)} · {maskEmail(item.email, canViewPii)}</p>
          <p>สมัคร {new Date(item.createdAt).toLocaleDateString('th-TH')}</p>
          <p>เข้าใช้ล่าสุด {item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString('th-TH') : '-'}</p>
        </section>
        <section className="admin-member-money-summary">
          <div><span>ยอดใช้ได้</span><strong>{canViewBalances ? formatMoney(item.availableBalance) : '••••••'}</strong></div>
          <div className="admin-member-balance-grid"><span>ยอดรวม {canViewBalances ? formatMoney(item.balance) : '••••••'}</span><span>ยอดล็อก {canViewBalances ? formatMoney(item.lockedBalance) : '••••••'}</span></div>
          <a href={`/members/${item.id}`} className="admin-member-profile-link">ดูโปรไฟล์</a>
        </section>
        <section className="admin-member-actions" aria-label={`จัดการสถานะ ${item.username}`}>
          <AdminButton disabled={busyId === item.id || item.status === 'ACTIVE'} tone="success" onClick={() => void updateStatus(item.id, 'ACTIVE')}>เปิดใช้งาน</AdminButton>
          <AdminButton disabled={busyId === item.id || item.status === 'SUSPENDED'} tone="danger" onClick={() => void updateStatus(item.id, 'SUSPENDED')}>ระงับ</AdminButton>
          <AdminButton disabled={busyId === item.id || item.status === 'LOCKED'} tone="danger" onClick={() => void updateStatus(item.id, 'LOCKED')}>ล็อก</AdminButton>
        </section>
      </article>
    </AdminCard>)}{items.length === 0 && <AdminEmpty>ไม่พบสมาชิก</AdminEmpty>}</AdminStack>}
  </AdminPage>;
}

function statusTone(status: string) { if (status === 'ACTIVE') return 'success'; if (status === 'SUSPENDED' || status === 'LOCKED') return 'danger'; return 'neutral'; }
function statusLabel(status: string) { const labels: Record<string, string> = { ALL: 'ทุกสถานะ', ACTIVE: 'ใช้งานได้', SUSPENDED: 'ระงับ', LOCKED: 'ล็อก', CLOSED: 'ปิดบัญชี' }; return labels[status] ?? status; }
