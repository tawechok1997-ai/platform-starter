'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminStack, AdminToolbar, formatMoney } from '../_components/admin-ui';
import { hasAnyPermission, maskEmail, maskPhone } from '../_components/member-mask';

type MemberItem = { id: string; shortId: string; username: string; phone?: string | null; email?: string | null; status: string; displayName?: string | null; balance: string; lockedBalance: string; availableBalance: string; createdAt: string; lastLoginAt?: string | null };
type MemberDrawerData = { user: MemberItem & { updatedAt?: string; profile?: { displayName?: string | null } | null }; wallet: { currency: string; balance: string; lockedBalance: string; availableBalance: string; status: string; updatedAt: string } | null };
type AdminIdentity = { permissions?: string[] };
type PendingStatus = { member: MemberItem; status: 'ACTIVE' | 'SUSPENDED' | 'LOCKED' };
const STATUSES = ['ALL', 'ACTIVE', 'SUSPENDED', 'LOCKED', 'CLOSED'];
const BANK_STATUSES = ['ALL', 'ACTIVE', 'PENDING_REVIEW', 'REJECTED', 'DISABLED'];
const KYC_STATUSES = ['ALL', 'DRAFT', 'SUBMITTED', 'REVIEWING', 'APPROVED', 'REJECTED', 'EXPIRED'];
const PAGE_SIZE = 20;

export default function MembersPage() {
  const [items, setItems] = useState<MemberItem[]>([]);
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [bankStatus, setBankStatus] = useState('ALL');
  const [kycStatus, setKycStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [pendingStatus, setPendingStatus] = useState<PendingStatus | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [drawerId, setDrawerId] = useState('');
  const [drawerData, setDrawerData] = useState<MemberDrawerData | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  useEffect(() => { void loadAccess(); }, []);
  useEffect(() => { void loadItems(page, submittedSearch, status, bankStatus, kycStatus); }, [page, submittedSearch, status, bankStatus, kycStatus]);

  async function loadAccess() {
    const response = await adminApiFetch('/admin/auth/me', { cache: 'no-store' });
    const data = await response.json().catch(() => null) as AdminIdentity | null;
    if (response.ok && data) setPermissions(Array.isArray(data.permissions) ? data.permissions : []);
  }

  async function loadItems(nextPage: number, nextSearch: string, nextStatus: string, nextBankStatus = bankStatus, nextKycStatus = kycStatus) {
    setLoading(true);
    setMessage('กำลังโหลดสมาชิก...');
    const params = new URLSearchParams();
    if (nextSearch) params.set('search', nextSearch);
    if (nextStatus !== 'ALL') params.set('status', nextStatus);
    if (nextBankStatus !== 'ALL') params.set('bankStatus', nextBankStatus);
    if (nextKycStatus !== 'ALL') params.set('kycStatus', nextKycStatus);
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
    setBankStatus('ALL');
    setKycStatus('ALL');
    setPage(1);
  }

  function changeStatus(nextStatus: string) {
    setStatus(nextStatus);
    setPage(1);
  }

  function changeFilter(setter: (value: string) => void, value: string) { setter(value); setPage(1); }

  function requestStatus(member: MemberItem, nextStatus: PendingStatus['status']) { setPendingStatus({ member, status: nextStatus }); setStatusReason(''); }

  async function openDrawer(member: MemberItem) {
    setDrawerId(member.id);
    setDrawerData(null);
    setDrawerLoading(true);
    const res = await adminApiFetch(`/admin/members/${member.id}`);
    const payload = await res.json().catch(() => null);
    if (res.ok && payload?.user) setDrawerData(payload as MemberDrawerData);
    else setMessage(payload?.message ?? 'โหลดรายละเอียดสมาชิกไม่สำเร็จ');
    setDrawerLoading(false);
  }

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
        <label className="admin-members-field"><span>บัญชีธนาคาร</span><select value={bankStatus} onChange={(event) => changeFilter(setBankStatus, event.target.value)}>{BANK_STATUSES.map((item) => <option key={item} value={item}>{bankStatusLabel(item)}</option>)}</select></label>
        <label className="admin-members-field"><span>KYC</span><select value={kycStatus} onChange={(event) => changeFilter(setKycStatus, event.target.value)}>{KYC_STATUSES.map((item) => <option key={item} value={item}>{kycStatusLabel(item)}</option>)}</select></label>
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

    {loading && items.length === 0 ? <AdminEmpty>กำลังโหลดสมาชิก...</AdminEmpty> : <AdminCard title="Member directory" description="เลือกสมาชิกเพื่อเปิดรายละเอียดแบบ drawer"><div className="admin-members-table-wrap"><table className="admin-members-table"><thead><tr><th>สมาชิก</th><th>สถานะ</th><th>ติดต่อ</th><th>ยอดใช้ได้</th><th>เข้าใช้ล่าสุด</th><th>การทำงาน</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}>
      <td><button type="button" className="admin-members-name-button" onClick={() => void openDrawer(item)}><strong>{item.username}</strong><small>{item.displayName || 'ยังไม่ได้ตั้งชื่อ'} · {item.shortId}</small></button></td>
      <td><AdminBadge tone={statusTone(item.status)}>{statusLabel(item.status)}</AdminBadge></td>
      <td>{maskPhone(item.phone, canViewPii)}<br />{maskEmail(item.email, canViewPii)}</td>
      <td className="admin-members-number">{canViewBalances ? formatMoney(item.availableBalance) : '••••••'}</td>
      <td>{item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString('th-TH') : 'ยังไม่เคยเข้าใช้'}</td>
      <td><div className="admin-members-row-actions"><AdminButton size="compact" tone="secondary" onClick={() => void openDrawer(item)}>รายละเอียด</AdminButton><AdminButton size="compact" tone="success" disabled={busyId === item.id || item.status === 'ACTIVE'} onClick={() => requestStatus(item, 'ACTIVE')}>เปิด</AdminButton><AdminButton size="compact" tone="danger" disabled={busyId === item.id || item.status === 'SUSPENDED'} onClick={() => requestStatus(item, 'SUSPENDED')}>ระงับ</AdminButton></div></td>
    </tr>)}</tbody></table></div>{items.length === 0 && <AdminEmpty>ไม่พบสมาชิก</AdminEmpty>}</AdminCard>}

    {drawerId && <div className="admin-member-drawer-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setDrawerId(''); setDrawerData(null); } }}><aside className="admin-member-drawer" aria-label="รายละเอียดสมาชิก"><header><div><p className="admin-ui-eyebrow">Member detail</p><h2>{drawerData?.user.username ?? 'กำลังโหลด...'}</h2></div><AdminButton tone="ghost" onClick={() => { setDrawerId(''); setDrawerData(null); }}>ปิด</AdminButton></header>{drawerLoading && <AdminEmpty>กำลังโหลดรายละเอียด...</AdminEmpty>}{drawerData && <AdminStack><AdminRow><span>สถานะ</span><AdminBadge tone={statusTone(drawerData.user.status)}>{statusLabel(drawerData.user.status)}</AdminBadge></AdminRow><AdminRow><span>โทรศัพท์</span><strong>{maskPhone(drawerData.user.phone, canViewPii)}</strong></AdminRow><AdminRow><span>อีเมล</span><strong>{maskEmail(drawerData.user.email, canViewPii)}</strong></AdminRow><AdminRow><span>สมัครเมื่อ</span><span>{new Date(drawerData.user.createdAt).toLocaleString('th-TH')}</span></AdminRow><AdminRow><span>เข้าใช้ล่าสุด</span><span>{drawerData.user.lastLoginAt ? new Date(drawerData.user.lastLoginAt).toLocaleString('th-TH') : 'ยังไม่เคยเข้าใช้'}</span></AdminRow><AdminCard title="Wallet" compact>{drawerData.wallet ? <AdminStack><AdminRow><span>ยอดรวม</span><strong>{canViewBalances ? formatMoney(drawerData.wallet.balance) : '••••••'}</strong></AdminRow><AdminRow><span>ยอดล็อก</span><strong>{canViewBalances ? formatMoney(drawerData.wallet.lockedBalance) : '••••••'}</strong></AdminRow><AdminRow><span>ยอดใช้ได้</span><strong>{canViewBalances ? formatMoney(drawerData.wallet.availableBalance) : '••••••'}</strong></AdminRow></AdminStack> : <AdminEmpty>ไม่มี wallet</AdminEmpty>}</AdminCard></AdminStack>}</aside></div>}

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

function statusTone(status: string) { if (status === 'ACTIVE') return 'success'; if (status === 'SUSPENDED' || status === 'LOCKED') return 'danger'; return 'neutral'; }
function statusLabel(status: string) { const labels: Record<string, string> = { ALL: 'ทุกสถานะ', ACTIVE: 'ใช้งานได้', SUSPENDED: 'ระงับ', LOCKED: 'ล็อก', CLOSED: 'ปิดบัญชี' }; return labels[status] ?? status; }
function statusActionLabel(status: PendingStatus['status']) { return status === 'ACTIVE' ? 'เปิดใช้งาน' : status === 'SUSPENDED' ? 'ระงับบัญชี' : 'ล็อกบัญชี'; }
function bankStatusLabel(status: string) { const labels: Record<string, string> = { ALL: 'ทุกสถานะ', ACTIVE: 'อนุมัติแล้ว', PENDING_REVIEW: 'รอตรวจ', REJECTED: 'ปฏิเสธ', DISABLED: 'ปิดใช้งาน' }; return labels[status] ?? status; }
function kycStatusLabel(status: string) { const labels: Record<string, string> = { ALL: 'ทุกสถานะ', DRAFT: 'ร่าง', SUBMITTED: 'ส่งแล้ว', REVIEWING: 'กำลังตรวจ', APPROVED: 'อนุมัติแล้ว', REJECTED: 'ปฏิเสธ', EXPIRED: 'หมดอายุ' }; return labels[status] ?? status; }
