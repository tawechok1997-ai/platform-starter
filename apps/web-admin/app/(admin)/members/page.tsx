'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminRow, AdminStack, AdminToolbar, formatMoney } from '../_components/admin-ui';
import { hasAnyPermission, maskEmail, maskPhone } from '../_components/member-mask';
import { useAdminLocale, type AdminLocale } from '../admin-locale';

type MemberItem = { id: string; shortId: string; username: string; phone?: string | null; email?: string | null; status: string; displayName?: string | null; balance: string; lockedBalance: string; availableBalance: string; createdAt: string; lastLoginAt?: string | null };
type MemberDrawerData = { user: MemberItem & { updatedAt?: string; profile?: { displayName?: string | null } | null }; wallet: { currency: string; balance: string; lockedBalance: string; availableBalance: string; status: string; updatedAt: string } | null };
type AdminIdentity = { permissions?: string[] };
type PendingStatus = { member: MemberItem; status: 'ACTIVE' | 'SUSPENDED' | 'LOCKED' };
const STATUSES = ['ALL', 'ACTIVE', 'SUSPENDED', 'LOCKED', 'CLOSED'];
const BANK_STATUSES = ['ALL', 'ACTIVE', 'PENDING_REVIEW', 'REJECTED', 'DISABLED'];
const KYC_STATUSES = ['ALL', 'DRAFT', 'SUBMITTED', 'REVIEWING', 'APPROVED', 'REJECTED', 'EXPIRED'];
const PAGE_SIZE = 20;

type MembersCopy = {
  eyebrow: string; title: string; description: string; refresh: string; loading: string; search: string; searchPlaceholder: string; status: string; bankAccount: string; identityCheck: string; clear: string; previous: string; next: string; page: string; piiRestricted: string;
  visible: string; totalItems: string; active: string; currentPageOnly: string; restricted: string; restrictedHelp: string; totalAvailable: string; visibleOnly: string; noBalancePermission: string; directory: string; directoryDescription: string; member: string; contact: string; available: string; lastLogin: string; actions: string; noDisplayName: string; neverLoggedIn: string; details: string; open: string; suspend: string; noMembers: string;
  drawerAria: string; memberDetail: string; close: string; phone: string; email: string; joined: string; wallet: string; total: string; locked: string; noWallet: string; changeDescription: string; reason: string; reasonPlaceholder: string; confirm: string;
  statuses: Record<string, string>; bankStatuses: Record<string, string>; kycStatuses: Record<string, string>; actionsByStatus: Record<PendingStatus['status'], string>; messages: { loading: string; loadFailed: string; drawerFailed: string; reasonRequired: string; updating: string; updateFailed: string; updated: string };
};

const membersCopy: Record<AdminLocale, MembersCopy> = {
  th: {
    eyebrow: 'สมาชิก', title: 'รายชื่อสมาชิก', description: 'ค้นหา ข้อมูลสำคัญ และสถานะบัญชี', refresh: 'รีเฟรช', loading: 'กำลังโหลด...', search: 'ค้นหา', searchPlaceholder: 'ชื่อผู้ใช้ เบอร์โทร อีเมล หรือรหัสสมาชิก', status: 'สถานะ', bankAccount: 'บัญชีธนาคาร', identityCheck: 'ยืนยันตัวตน', clear: 'ล้าง', previous: 'ก่อนหน้า', next: 'ถัดไป', page: 'หน้า', piiRestricted: 'ข้อมูลบางส่วนถูกซ่อนตามสิทธิ์ของบัญชีนี้',
    visible: 'รายการที่แสดง', totalItems: 'ทั้งหมด', active: 'ใช้งานได้', currentPageOnly: 'เฉพาะหน้านี้', restricted: 'ถูกจำกัด', restrictedHelp: 'ระงับ ล็อก หรือปิดบัญชี', totalAvailable: 'ยอดใช้ได้รวม', visibleOnly: 'เฉพาะรายการที่แสดง', noBalancePermission: 'ไม่มีสิทธิ์ดูยอดเงิน', directory: 'รายชื่อสมาชิก', directoryDescription: 'เลือกสมาชิกเพื่อดูรายละเอียด', member: 'สมาชิก', contact: 'ติดต่อ', available: 'ยอดใช้ได้', lastLogin: 'เข้าใช้ล่าสุด', actions: 'การทำงาน', noDisplayName: 'ยังไม่ได้ตั้งชื่อ', neverLoggedIn: 'ยังไม่เคยเข้าใช้', details: 'รายละเอียด', open: 'เปิด', suspend: 'ระงับ', noMembers: 'ไม่พบสมาชิก',
    drawerAria: 'รายละเอียดสมาชิก', memberDetail: 'รายละเอียดสมาชิก', close: 'ปิด', phone: 'โทรศัพท์', email: 'อีเมล', joined: 'สมัครเมื่อ', wallet: 'กระเป๋าเงิน', total: 'ยอดรวม', locked: 'ยอดล็อก', noWallet: 'ไม่มีกระเป๋าเงิน', changeDescription: 'การเปลี่ยนสถานะมีผลต่อการเข้าใช้และถูกบันทึกไว้', reason: 'เหตุผล', reasonPlaceholder: 'ระบุเหตุผลให้ชัดเจน', confirm: 'ยืนยัน',
    statuses: { ALL: 'ทุกสถานะ', ACTIVE: 'ใช้งานได้', SUSPENDED: 'ระงับ', LOCKED: 'ล็อก', CLOSED: 'ปิดบัญชี' }, bankStatuses: { ALL: 'ทุกสถานะ', ACTIVE: 'อนุมัติแล้ว', PENDING_REVIEW: 'รอตรวจ', REJECTED: 'ปฏิเสธ', DISABLED: 'ปิดใช้งาน' }, kycStatuses: { ALL: 'ทุกสถานะ', DRAFT: 'ร่าง', SUBMITTED: 'ส่งแล้ว', REVIEWING: 'กำลังตรวจ', APPROVED: 'อนุมัติแล้ว', REJECTED: 'ปฏิเสธ', EXPIRED: 'หมดอายุ' }, actionsByStatus: { ACTIVE: 'เปิดใช้งาน', SUSPENDED: 'ระงับบัญชี', LOCKED: 'ล็อกบัญชี' }, messages: { loading: 'กำลังโหลดสมาชิก...', loadFailed: 'โหลดรายชื่อสมาชิกไม่สำเร็จ', drawerFailed: 'โหลดรายละเอียดสมาชิกไม่สำเร็จ', reasonRequired: 'ระบุเหตุผลก่อนเปลี่ยนสถานะสมาชิก', updating: 'กำลังอัปเดตสถานะ...', updateFailed: 'อัปเดตสถานะไม่สำเร็จ', updated: 'อัปเดตสถานะสมาชิกแล้ว' },
  },
  en: {
    eyebrow: 'Members', title: 'Members', description: 'Search, key details, and account status', refresh: 'Refresh', loading: 'Loading...', search: 'Search', searchPlaceholder: 'Username, phone, email, or member ID', status: 'Status', bankAccount: 'Bank account', identityCheck: 'Identity check', clear: 'Clear', previous: 'Previous', next: 'Next', page: 'Page', piiRestricted: 'Some data is hidden by your account permissions',
    visible: 'Visible items', totalItems: 'total', active: 'Active', currentPageOnly: 'Current page only', restricted: 'Restricted', restrictedHelp: 'Suspended, locked, or closed', totalAvailable: 'Total available', visibleOnly: 'Visible items only', noBalancePermission: 'No permission to view balances', directory: 'Member directory', directoryDescription: 'Select a member to view details', member: 'Member', contact: 'Contact', available: 'Available', lastLogin: 'Last login', actions: 'Actions', noDisplayName: 'No display name', neverLoggedIn: 'Never logged in', details: 'Details', open: 'Open', suspend: 'Suspend', noMembers: 'No members found',
    drawerAria: 'Member details', memberDetail: 'Member details', close: 'Close', phone: 'Phone', email: 'Email', joined: 'Joined', wallet: 'Wallet', total: 'Total', locked: 'Locked', noWallet: 'No wallet', changeDescription: 'Changing status affects access and is recorded', reason: 'Reason', reasonPlaceholder: 'Enter a clear reason', confirm: 'Confirm',
    statuses: { ALL: 'All statuses', ACTIVE: 'Active', SUSPENDED: 'Suspended', LOCKED: 'Locked', CLOSED: 'Closed' }, bankStatuses: { ALL: 'All statuses', ACTIVE: 'Approved', PENDING_REVIEW: 'Awaiting review', REJECTED: 'Rejected', DISABLED: 'Disabled' }, kycStatuses: { ALL: 'All statuses', DRAFT: 'Draft', SUBMITTED: 'Submitted', REVIEWING: 'Reviewing', APPROVED: 'Approved', REJECTED: 'Rejected', EXPIRED: 'Expired' }, actionsByStatus: { ACTIVE: 'Activate account', SUSPENDED: 'Suspend account', LOCKED: 'Lock account' }, messages: { loading: 'Loading members...', loadFailed: 'Unable to load members', drawerFailed: 'Unable to load member details', reasonRequired: 'Enter a reason before changing member status', updating: 'Updating status...', updateFailed: 'Unable to update member status', updated: 'Member status updated' },
  },
};
type MembersMessage = keyof MembersCopy['messages'];

export default function MembersPage() {
  const [locale] = useAdminLocale();
  const copy = membersCopy[locale];
  const dateLocale = locale === 'th' ? 'th-TH' : 'en-US';
  const [items, setItems] = useState<MemberItem[]>([]);
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [bankStatus, setBankStatus] = useState('ALL');
  const [kycStatus, setKycStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [message, setMessage] = useState<MembersMessage | ''>('');
  const [messageTone, setMessageTone] = useState<'neutral' | 'success' | 'warning' | 'danger'>('neutral');
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
  const showMessage = (nextMessage: MembersMessage | '', tone: 'neutral' | 'success' | 'warning' | 'danger' = 'neutral') => { setMessage(nextMessage); setMessageTone(tone); };
  async function loadAccess() { const response = await adminApiFetch('/admin/auth/me', { cache: 'no-store' }); const data = await response.json().catch(() => null) as AdminIdentity | null; if (response.ok && data) setPermissions(Array.isArray(data.permissions) ? data.permissions : []); }
  async function loadItems(nextPage: number, nextSearch: string, nextStatus: string, nextBankStatus = bankStatus, nextKycStatus = kycStatus) {
    setLoading(true); showMessage('loading');
    const params = new URLSearchParams();
    if (nextSearch) params.set('search', nextSearch);
    if (nextStatus !== 'ALL') params.set('status', nextStatus);
    if (nextBankStatus !== 'ALL') params.set('bankStatus', nextBankStatus);
    if (nextKycStatus !== 'ALL') params.set('kycStatus', nextKycStatus);
    params.set('page', String(nextPage)); params.set('take', String(PAGE_SIZE));
    try {
      const res = await adminApiFetch(`/admin/members?${params.toString()}`);
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error();
      setItems(data.items ?? []); setTotal(Number(data.total ?? data.items?.length ?? 0)); setPageCount(Math.max(Number(data.pageCount ?? 1), 1)); showMessage('');
    } catch { setItems([]); setTotal(0); setPageCount(1); showMessage('loadFailed', 'danger'); } finally { setLoading(false); }
  }
  function searchMembers(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setPage(1); setSubmittedSearch(search.trim()); }
  function resetFilters() { setSearch(''); setSubmittedSearch(''); setStatus('ALL'); setBankStatus('ALL'); setKycStatus('ALL'); setPage(1); }
  function changeStatus(nextStatus: string) { setStatus(nextStatus); setPage(1); }
  function changeFilter(setter: (value: string) => void, value: string) { setter(value); setPage(1); }
  function requestStatus(member: MemberItem, nextStatus: PendingStatus['status']) { setPendingStatus({ member, status: nextStatus }); setStatusReason(''); }
  async function openDrawer(member: MemberItem) {
    setDrawerId(member.id); setDrawerData(null); setDrawerLoading(true);
    try { const res = await adminApiFetch(`/admin/members/${member.id}`); const payload = await res.json().catch(() => null); if (res.ok && payload?.user) setDrawerData(payload as MemberDrawerData); else showMessage('drawerFailed', 'danger'); } catch { showMessage('drawerFailed', 'danger'); } finally { setDrawerLoading(false); }
  }
  async function updateStatus() {
    if (!pendingStatus) return;
    const reason = statusReason.trim();
    if (!reason) return showMessage('reasonRequired', 'warning');
    const { member, status: nextStatus } = pendingStatus;
    setBusyId(member.id); showMessage('updating');
    try {
      const res = await adminApiFetch(`/admin/members/${member.id}/status`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus, reason }) });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error();
      setItems((current) => current.map((item) => item.id === member.id ? { ...item, status: data.user.status } : item)); setPendingStatus(null); setStatusReason(''); showMessage('updated', 'success');
    } catch { showMessage('updateFailed', 'danger'); } finally { setBusyId(''); }
  }
  const canViewPii = hasAnyPermission(permissions, ['users.pii.view', 'users.sensitive.view', 'admin.access.view']);
  const canViewBalances = hasAnyPermission(permissions, ['wallet.view']);
  const totals = useMemo(() => ({ activeCount: items.filter((item) => item.status === 'ACTIVE').length, restrictedCount: items.filter((item) => item.status !== 'ACTIVE').length, available: items.reduce((sum, item) => sum + Number(item.availableBalance ?? 0), 0) }), [items]);

  return <AdminPage eyebrow={copy.eyebrow} title={copy.title} description={copy.description} actions={<AdminButton onClick={() => void loadItems(page, submittedSearch, status)}>{copy.refresh}</AdminButton>}>
    <form onSubmit={searchMembers} className="admin-members-filter-form"><AdminToolbar><label className="admin-members-field"><span>{copy.search}</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={copy.searchPlaceholder} /></label><label className="admin-members-field"><span>{copy.status}</span><select value={status} onChange={(event) => changeStatus(event.target.value)}>{STATUSES.map((item) => <option key={item} value={item}>{statusLabel(item, copy)}</option>)}</select></label><label className="admin-members-field"><span>{copy.bankAccount}</span><select value={bankStatus} onChange={(event) => changeFilter(setBankStatus, event.target.value)}>{BANK_STATUSES.map((item) => <option key={item} value={item}>{bankStatusLabel(item, copy)}</option>)}</select></label><label className="admin-members-field"><span>{copy.identityCheck}</span><select value={kycStatus} onChange={(event) => changeFilter(setKycStatus, event.target.value)}>{KYC_STATUSES.map((item) => <option key={item} value={item}>{kycStatusLabel(item, copy)}</option>)}</select></label><div className="admin-members-filter-actions"><AdminButton type="submit">{copy.search}</AdminButton><AdminButton type="button" tone="secondary" onClick={resetFilters}>{copy.clear}</AdminButton></div><div className="admin-queue-pager"><AdminButton type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => Math.max(value - 1, 1))}>{copy.previous}</AdminButton><span className="admin-queue-page-label">{copy.page} {formatNumber(page, locale)} / {formatNumber(pageCount, locale)}</span><AdminButton type="button" disabled={page >= pageCount || loading} onClick={() => setPage((value) => Math.min(value + 1, pageCount))}>{copy.next}</AdminButton></div></AdminToolbar></form>
    {message && <AdminNotice tone={messageTone}>{copy.messages[message]}</AdminNotice>}{(!canViewPii || !canViewBalances) && <AdminNotice tone="warning">{copy.piiRestricted}</AdminNotice>}
    <AdminMetricGrid><AdminMetric title={copy.visible} value={formatNumber(items.length, locale)} helper={`${copy.totalItems} ${formatNumber(total, locale)}`} /><AdminMetric title={copy.active} value={formatNumber(totals.activeCount, locale)} helper={copy.currentPageOnly} tone="success" /><AdminMetric title={copy.restricted} value={formatNumber(totals.restrictedCount, locale)} helper={copy.restrictedHelp} tone={totals.restrictedCount ? 'warning' : 'neutral'} /><AdminMetric title={copy.totalAvailable} value={canViewBalances ? formatMoney(String(totals.available)) : '••••••'} helper={canViewBalances ? copy.visibleOnly : copy.noBalancePermission} /></AdminMetricGrid>
    {loading && items.length === 0 ? <AdminEmpty>{copy.loading}</AdminEmpty> : <AdminCard title={copy.directory} description={copy.directoryDescription}><div className="admin-members-table-wrap"><table className="admin-members-table"><thead><tr><th>{copy.member}</th><th>{copy.status}</th><th>{copy.contact}</th><th>{copy.available}</th><th>{copy.lastLogin}</th><th>{copy.actions}</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><button type="button" className="admin-members-name-button" onClick={() => void openDrawer(item)}><strong>{item.username}</strong><small>{item.displayName || copy.noDisplayName} · {item.shortId}</small></button></td><td><AdminBadge tone={statusTone(item.status)}>{statusLabel(item.status, copy)}</AdminBadge></td><td>{maskPhone(item.phone, canViewPii)}<br />{maskEmail(item.email, canViewPii)}</td><td className="admin-members-number">{canViewBalances ? formatMoney(item.availableBalance) : '••••••'}</td><td>{item.lastLoginAt ? new Date(item.lastLoginAt).toLocaleString(dateLocale) : copy.neverLoggedIn}</td><td><div className="admin-members-row-actions"><AdminButton size="compact" tone="secondary" onClick={() => void openDrawer(item)}>{copy.details}</AdminButton><AdminButton size="compact" tone="success" disabled={busyId === item.id || item.status === 'ACTIVE'} onClick={() => requestStatus(item, 'ACTIVE')}>{copy.open}</AdminButton><AdminButton size="compact" tone="danger" disabled={busyId === item.id || item.status === 'SUSPENDED'} onClick={() => requestStatus(item, 'SUSPENDED')}>{copy.suspend}</AdminButton></div></td></tr>)}</tbody></table></div>{items.length === 0 && <AdminEmpty>{copy.noMembers}</AdminEmpty>}</AdminCard>}
    {drawerId && <div className="admin-member-drawer-layer" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) { setDrawerId(''); setDrawerData(null); } }}><aside className="admin-member-drawer" aria-label={copy.drawerAria}><header><div><p className="admin-ui-eyebrow">{copy.memberDetail}</p><h2>{drawerData?.user.username ?? copy.loading}</h2></div><AdminButton tone="ghost" onClick={() => { setDrawerId(''); setDrawerData(null); }}>{copy.close}</AdminButton></header>{drawerLoading && <AdminEmpty>{copy.loading}</AdminEmpty>}{drawerData && <AdminStack><AdminRow><span>{copy.status}</span><AdminBadge tone={statusTone(drawerData.user.status)}>{statusLabel(drawerData.user.status, copy)}</AdminBadge></AdminRow><AdminRow><span>{copy.phone}</span><strong>{maskPhone(drawerData.user.phone, canViewPii)}</strong></AdminRow><AdminRow><span>{copy.email}</span><strong>{maskEmail(drawerData.user.email, canViewPii)}</strong></AdminRow><AdminRow><span>{copy.joined}</span><span>{new Date(drawerData.user.createdAt).toLocaleString(dateLocale)}</span></AdminRow><AdminRow><span>{copy.lastLogin}</span><span>{drawerData.user.lastLoginAt ? new Date(drawerData.user.lastLoginAt).toLocaleString(dateLocale) : copy.neverLoggedIn}</span></AdminRow><AdminCard title={copy.wallet} compact>{drawerData.wallet ? <AdminStack><AdminRow><span>{copy.total}</span><strong>{canViewBalances ? formatMoney(drawerData.wallet.balance) : '••••••'}</strong></AdminRow><AdminRow><span>{copy.locked}</span><strong>{canViewBalances ? formatMoney(drawerData.wallet.lockedBalance) : '••••••'}</strong></AdminRow><AdminRow><span>{copy.available}</span><strong>{canViewBalances ? formatMoney(drawerData.wallet.availableBalance) : '••••••'}</strong></AdminRow></AdminStack> : <AdminEmpty>{copy.noWallet}</AdminEmpty>}</AdminCard></AdminStack>}</aside></div>}
    <AdminConfirmDialog open={Boolean(pendingStatus)} title={pendingStatus ? `${statusActionLabel(pendingStatus.status, copy)} ${pendingStatus.member.username}` : ''} description={copy.changeDescription} confirmLabel={pendingStatus ? statusActionLabel(pendingStatus.status, copy) : copy.confirm} tone={pendingStatus?.status === 'ACTIVE' ? 'success' : 'danger'} busy={Boolean(pendingStatus && busyId === pendingStatus.member.id)} onCancel={() => { setPendingStatus(null); setStatusReason(''); }} onConfirm={() => void updateStatus()} details={<label><span>{copy.reason}</span><textarea value={statusReason} onChange={(event) => setStatusReason(event.target.value)} placeholder={copy.reasonPlaceholder} /></label>} />
  </AdminPage>;
}

function formatNumber(value: number, locale: AdminLocale) { return value.toLocaleString(locale === 'th' ? 'th-TH' : 'en-US'); }
function statusTone(status: string) { if (status === 'ACTIVE') return 'success'; if (status === 'SUSPENDED' || status === 'LOCKED') return 'danger'; return 'neutral'; }
function statusLabel(status: string, copy: MembersCopy) { return copy.statuses[status] ?? status; }
function statusActionLabel(status: PendingStatus['status'], copy: MembersCopy) { return copy.actionsByStatus[status]; }
function bankStatusLabel(status: string, copy: MembersCopy) { return copy.bankStatuses[status] ?? status; }
function kycStatusLabel(status: string, copy: MembersCopy) { return copy.kycStatuses[status] ?? status; }
