'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminEmpty, AdminGrid, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminSectionRow, AdminStack } from '../_components/admin-ui';
import AdminInvitationList from './admin-invitation-list';
import InviteAdminPanel from './invite-admin-panel';

type Permission = { id: string; code: string; name: string; module: string; description?: string | null };
type Role = { id: string; code: string; name: string; description?: string | null; level: number; adminUserCount: number; permissionCount: number; hasWildcard: boolean; permissions: Permission[] };
type AdminRole = { id: string; code: string; name: string; level: number };
type AdminUser = { id: string; username: string; email: string; status: string; twoFactorEnabled: boolean; lastLoginAt?: string | null; createdAt: string; protected?: boolean; roles: AdminRole[] };
type Delegation = { id: string; grantorAdminId: string; delegateAdminId: string; permissionCodes: string[]; status: string; reason?: string | null; expiresAt: string; revokedAt?: string | null; grantor: { username: string }; delegate: { username: string; email: string; status: string } };
type AccessResponse = { summary: { roleCount: number; permissionCount: number; adminUserCount: number; wildcardRoleCount: number }; roles: Role[]; permissions: Permission[]; adminUsers: AdminUser[] };
type PendingAction =
  | { type: 'assign-role'; user: AdminUser; role: { id: string; code: string }; reason: string }
  | { type: 'remove-role'; user: AdminUser; role: { id: string; code: string }; reason: string }
  | { type: 'revoke-delegation'; delegation: Delegation; reason: string }
  | null;
type Confirmation = { title: string; description: string; label: string; tone: 'primary' | 'danger'; reason: string };

export default function AccessOverviewPage() {
  const [data, setData] = useState<AccessResponse | null>(null);
  const [message, setMessage] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});
  const [roleReasons, setRoleReasons] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentAdminId, setCurrentAdminId] = useState('');
  const [permissionsHeld, setPermissionsHeld] = useState<string[]>([]);
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [delegateAdminId, setDelegateAdminId] = useState('');
  const [delegationPermissionCodes, setDelegationPermissionCodes] = useState('');
  const [delegationHours, setDelegationHours] = useState('24');
  const [delegationReason, setDelegationReason] = useState('');
  const [delegationRevokeReasons, setDelegationRevokeReasons] = useState<Record<string, string>>({});
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setBusyKey('load');
    setMessage('กำลังโหลดสิทธิ์แอดมิน...');
    try {
      const accessResponse = await adminApiFetch('/admin/access/overview');
      const accessPayload = await accessResponse.json().catch(() => null);
      if (!accessResponse.ok || !isAccessResponse(accessPayload)) throw new Error('access');
      setData(accessPayload);

      let partialFailure = false;
      try {
        const meResponse = await adminApiFetch('/admin/auth/me');
        const mePayload = await meResponse.json().catch(() => null);
        if (!meResponse.ok || !isRecord(mePayload)) throw new Error('me');
        setCurrentAdminId(typeof mePayload.id === 'string' ? mePayload.id : '');
        setPermissionsHeld(Array.isArray(mePayload.permissions) ? mePayload.permissions.filter((item): item is string => typeof item === 'string') : []);
      } catch {
        partialFailure = true;
        setCurrentAdminId('');
        setPermissionsHeld([]);
      }

      try {
        const delegationResponse = await adminApiFetch('/admin/access/delegations');
        const delegationPayload = await delegationResponse.json().catch(() => null);
        if (!delegationResponse.ok || !Array.isArray(delegationPayload)) throw new Error('delegations');
        setDelegations(delegationPayload.filter(isDelegation));
      } catch {
        partialFailure = true;
        setDelegations([]);
      }

      setMessage(partialFailure ? 'โหลดข้อมูลหลักแล้ว แต่ข้อมูลความปลอดภัยบางส่วนไม่ครบ กรุณารีเฟรช' : '');
    } catch {
      setMessage('โหลดข้อมูลสิทธิ์ไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setBusyKey('');
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const canManage = permissionsHeld.includes('*') || permissionsHeld.includes('admin.access.manage');
  const canInvite = permissionsHeld.includes('*') || permissionsHeld.includes('admin.create');
  const canDelegate = permissionsHeld.includes('*') || permissionsHeld.includes('admin.access.delegate');
  const pageBusy = loading || Boolean(busyKey);

  async function createDelegation() {
    if (pageBusy || !canDelegate) return;
    const target = data?.adminUsers.find((user) => user.id === delegateAdminId);
    const permissionCodes = Array.from(new Set(delegationPermissionCodes.split(/[,\n ]+/).map((item) => item.trim()).filter(Boolean)));
    const hours = Number(delegationHours);
    const reason = delegationReason.trim();
    if (!target || target.status !== 'ACTIVE' || target.protected || target.id === currentAdminId) { setMessage('กรุณาเลือกผู้รับสิทธิ์ที่ใช้งานได้และไม่ใช่บัญชีของคุณ'); return; }
    if (permissionCodes.length === 0 || permissionCodes.length > 40) { setMessage('กรุณาระบุ permission ตั้งแต่ 1 ถึง 40 รายการ'); return; }
    if (!Number.isInteger(hours) || hours < 1 || hours > 168) { setMessage('ระยะเวลาต้องเป็นจำนวนเต็มระหว่าง 1 ถึง 168 ชั่วโมง'); return; }
    if (reason.length < 5) { setMessage('กรุณาระบุเหตุผลอย่างน้อย 5 ตัวอักษร'); return; }
    setBusyKey('delegation:create');
    setMessage('');
    try {
      const response = await adminApiFetch('/admin/access/delegations', { method: 'POST', body: JSON.stringify({ delegateAdminId, permissionCodes, expiresInHours: hours, reason }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isRecord(payload) || !isDelegation(payload.delegation)) throw new Error('create');
      const delegation = payload.delegation;
      setDelegations((current) => [delegation, ...current.filter((item) => item.id !== delegation.id)]);
      setDelegateAdminId('');
      setDelegationPermissionCodes('');
      setDelegationReason('');
      setMessage('สร้าง delegated access แล้ว');
    } catch {
      setMessage('สร้าง delegated access ไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setBusyKey('');
    }
  }

  function requestAssignRole(adminUser: AdminUser) {
    if (pageBusy || !canManage || adminUser.protected) return;
    const roleId = selectedRoles[adminUser.id];
    const role = data?.roles.find((item) => item.id === roleId);
    const reason = (roleReasons[adminUser.id] ?? '').trim();
    if (!roleId || !role) { setMessage('กรุณาเลือก role ก่อน'); return; }
    if (adminUser.roles.some((item) => item.id === roleId)) { setMessage('Admin คนนี้มี role นี้อยู่แล้ว'); return; }
    if (reason.length < 5) { setMessage('กรุณาระบุเหตุผลอย่างน้อย 5 ตัวอักษร'); return; }
    setPendingAction({ type: 'assign-role', user: adminUser, role: { id: role.id, code: role.code }, reason });
  }

  function requestRemoveRole(adminUser: AdminUser, role: AdminRole) {
    if (pageBusy || !canManage || adminUser.protected) return;
    const reason = (roleReasons[adminUser.id] ?? '').trim();
    if (reason.length < 5) { setMessage('กรุณาระบุเหตุผลอย่างน้อย 5 ตัวอักษร'); return; }
    setPendingAction({ type: 'remove-role', user: adminUser, role: { id: role.id, code: role.code }, reason });
  }

  function requestRevokeDelegation(item: Delegation) {
    if (pageBusy || !canDelegate || item.status !== 'ACTIVE') return;
    const reason = (delegationRevokeReasons[item.id] ?? '').trim();
    if (reason.length < 5) { setMessage('กรุณาระบุเหตุผลยกเลิกอย่างน้อย 5 ตัวอักษร'); return; }
    setPendingAction({ type: 'revoke-delegation', delegation: item, reason });
  }

  async function executeAction() {
    if (!pendingAction || pageBusy) return;
    const action = pendingAction;
    const key = action.type === 'revoke-delegation' ? `delegation:${action.delegation.id}` : `${action.user.id}:${action.type}`;
    setBusyKey(key);
    setMessage('');
    try {
      if (action.type === 'assign-role') {
        const response = await adminApiFetch(`/admin/access/admin-users/${action.user.id}/roles`, { method: 'POST', body: JSON.stringify({ roleId: action.role.id, reason: action.reason }) });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !isAccessResponse(payload)) throw new Error('assign');
        setData(payload);
        setSelectedRoles((current) => ({ ...current, [action.user.id]: '' }));
        setRoleReasons((current) => ({ ...current, [action.user.id]: '' }));
        setMessage('เพิ่ม role แล้ว');
      } else if (action.type === 'remove-role') {
        const response = await adminApiFetch(`/admin/access/admin-users/${action.user.id}/roles/${action.role.id}`, { method: 'DELETE', body: JSON.stringify({ reason: action.reason }) });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !isAccessResponse(payload)) throw new Error('remove');
        setData(payload);
        setRoleReasons((current) => ({ ...current, [action.user.id]: '' }));
        setMessage('ถอด role แล้ว');
      } else {
        const response = await adminApiFetch(`/admin/access/delegations/${action.delegation.id}/revoke`, { method: 'POST', body: JSON.stringify({ reason: action.reason }) });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !isRecord(payload) || !isDelegation(payload.delegation)) throw new Error('revoke');
        const delegation = payload.delegation;
        setDelegations((current) => current.map((item) => item.id === action.delegation.id ? delegation : item));
        setDelegationRevokeReasons((current) => ({ ...current, [action.delegation.id]: '' }));
        setMessage('ยกเลิก delegated access แล้ว');
      }
      setPendingAction(null);
    } catch {
      setMessage(action.type === 'assign-role' ? 'เพิ่ม role ไม่สำเร็จ กรุณาลองใหม่' : action.type === 'remove-role' ? 'ถอด role ไม่สำเร็จ กรุณาลองใหม่' : 'ยกเลิก delegated access ไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setBusyKey('');
    }
  }

  const modules = useMemo(() => ['ALL', ...Array.from(new Set((data?.permissions ?? []).map((item) => item.module))).sort()], [data]);
  const permissions = useMemo(() => moduleFilter === 'ALL' ? data?.permissions ?? [] : (data?.permissions ?? []).filter((item) => item.module === moduleFilter), [data, moduleFilter]);
  const confirmation = pendingAction ? confirmationFor(pendingAction) : null;

  return <AdminPage eyebrow="Security" title="Access Control" description="จัดการ roles, permissions และสิทธิ์ชั่วคราวตามขอบเขตของผู้ดูแลแต่ละคน" actions={<AdminButton tone="secondary" disabled={pageBusy} onClick={() => void load()}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton>}>
    {message && <AdminNotice tone={message.includes('ไม่สำเร็จ') || message.includes('ไม่ครบ') ? 'danger' : 'neutral'}>{message}</AdminNotice>}
    {data && <>
      <AdminMetricGrid>
        <AdminMetric title="Roles" value={String(data.summary.roleCount)} helper={`${data.summary.wildcardRoleCount} wildcard`} />
        <AdminMetric title="Permissions" value={String(data.summary.permissionCount)} helper="permission codes" />
        <AdminMetric title="Admin users" value={String(data.summary.adminUserCount)} helper="accounts" />
        <AdminMetric title="Delegated access" value={String(delegations.filter((item) => item.status === 'ACTIVE').length)} helper="สิทธิ์ชั่วคราวที่ยังใช้งาน" tone="warning" />
      </AdminMetricGrid>

      <InviteAdminPanel roles={data.roles} onCreated={load} />
      <AdminInvitationList allowed={canInvite} />

      <AdminGrid>
        <AdminCard title="Roles" description="Role และ permission ที่ผูกอยู่">
          <AdminStack>{data.roles.map((role) => <AdminSectionRow key={role.id}><div style={roleBlockStyle}><div style={badgeRowStyle}><AdminBadge tone={role.hasWildcard ? 'danger' : 'neutral'}>{role.hasWildcard ? 'WILDCARD' : 'ROLE'}</AdminBadge><AdminBadge>Level {role.level}</AdminBadge></div><strong>{role.name}</strong><p>{role.code}</p>{role.description && <p>{role.description}</p>}</div><div style={roleMetaStyle}><span>{role.permissionCount} permissions</span><span>{role.adminUserCount} users</span></div></AdminSectionRow>)}{data.roles.length === 0 && <AdminEmpty>ยังไม่มี roles</AdminEmpty>}</AdminStack>
        </AdminCard>

        <AdminCard title="Admin users" description={canManage ? 'เพิ่มหรือถอด Role พร้อมเหตุผลและ confirmation' : 'ดูบัญชีผู้ดูแลแบบอ่านอย่างเดียว'}>
          <AdminStack>{data.adminUsers.map((user) => <AdminSectionRow key={user.id}><div style={userBlockStyle}><div style={badgeRowStyle}><AdminBadge tone={user.status === 'ACTIVE' ? 'success' : 'danger'}>{user.status}</AdminBadge><AdminBadge tone={user.twoFactorEnabled ? 'success' : 'warning'}>{user.twoFactorEnabled ? '2FA ON' : '2FA OFF'}</AdminBadge>{user.protected && <AdminBadge tone="danger">PROTECTED</AdminBadge>}</div><strong>{user.username}</strong><p>{user.email}</p><div style={rolePillWrapStyle}>{user.roles.map((role) => <span key={role.id} style={rolePillStyle}>{role.code}{canManage && !user.protected && <button type="button" disabled={pageBusy} onClick={() => requestRemoveRole(user, role)} style={removeRoleButtonStyle} aria-label={`Remove ${role.code}`}>×</button>}</span>)}{user.roles.length === 0 && <span style={emptyRoleStyle}>no roles</span>}</div></div>{canManage && !user.protected && <div style={assignPanelStyle}><select disabled={pageBusy} value={selectedRoles[user.id] ?? ''} onChange={(event) => setSelectedRoles((current) => ({ ...current, [user.id]: event.target.value }))} style={selectStyle}><option value="">เลือก role</option>{data.roles.filter((role) => !role.hasWildcard && !['owner', 'super_admin'].includes(role.code)).map((role) => <option key={role.id} value={role.id}>{role.code}</option>)}</select><textarea disabled={pageBusy} value={roleReasons[user.id] ?? ''} onChange={(event) => setRoleReasons((current) => ({ ...current, [user.id]: event.target.value }))} maxLength={500} placeholder="เหตุผลเพิ่มหรือถอด role อย่างน้อย 5 ตัวอักษร" style={textareaStyle} /><AdminButton disabled={pageBusy} onClick={() => requestAssignRole(user)}>เพิ่ม role</AdminButton></div>}</AdminSectionRow>)}{data.adminUsers.length === 0 && <AdminEmpty>ยังไม่มี admin users</AdminEmpty>}</AdminStack>
        </AdminCard>
      </AdminGrid>

      <AdminCard title="Delegated Access" description="มอบ permission แบบจำกัดเวลา พร้อมเหตุผล การยืนยัน และ audit trail">
        {canDelegate && <div style={delegationFormStyle}>
          <select disabled={pageBusy} value={delegateAdminId} onChange={(event) => setDelegateAdminId(event.target.value)} style={selectStyle}><option value="">เลือกผู้รับสิทธิ์</option>{data.adminUsers.filter((user) => user.status === 'ACTIVE' && !user.protected && user.id !== currentAdminId).map((user) => <option key={user.id} value={user.id}>{user.username} · {user.email}</option>)}</select>
          <input disabled={pageBusy} value={delegationPermissionCodes} onChange={(event) => setDelegationPermissionCodes(event.target.value)} placeholder="reports.view, risk.view" style={inputStyle} />
          <input disabled={pageBusy} value={delegationHours} onChange={(event) => setDelegationHours(event.target.value)} type="number" min="1" max="168" step="1" placeholder="ชั่วโมง" style={inputStyle} />
          <input disabled={pageBusy} value={delegationReason} onChange={(event) => setDelegationReason(event.target.value)} maxLength={500} placeholder="เหตุผลการมอบหมาย" style={inputStyle} />
          <AdminButton disabled={pageBusy} onClick={() => void createDelegation()}>{busyKey === 'delegation:create' ? 'กำลังมอบสิทธิ์...' : 'มอบสิทธิ์'}</AdminButton>
        </div>}
        <AdminStack>{delegations.map((item) => <AdminSectionRow key={item.id}><div style={userBlockStyle}><div style={badgeRowStyle}><AdminBadge tone={item.status === 'ACTIVE' ? 'success' : 'neutral'}>{item.status}</AdminBadge><AdminBadge>{formatDate(item.expiresAt)}</AdminBadge></div><strong>{item.delegate.username}</strong><p>ผู้มอบ: {item.grantor.username} · {item.reason ?? 'ไม่มีเหตุผล'}</p><div style={rolePillWrapStyle}>{item.permissionCodes.map((code) => <span key={code} style={rolePillStyle}>{code}</span>)}</div></div>{item.status === 'ACTIVE' && canDelegate && <div style={delegationActionStyle}><input disabled={pageBusy} value={delegationRevokeReasons[item.id] ?? ''} onChange={(event) => setDelegationRevokeReasons((current) => ({ ...current, [item.id]: event.target.value }))} maxLength={500} placeholder="เหตุผลยกเลิกอย่างน้อย 5 ตัวอักษร" style={inputStyle} /><AdminButton tone="danger" disabled={pageBusy} onClick={() => requestRevokeDelegation(item)}>ยกเลิก</AdminButton></div>}</AdminSectionRow>)}{delegations.length === 0 && <AdminEmpty>ยังไม่มี delegated access</AdminEmpty>}</AdminStack>
      </AdminCard>

      <AdminCard title="Permissions" description="รายการ permission ทั้งหมดในระบบ">
        <div style={toolbarStyle}><select disabled={pageBusy} value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)} style={selectStyle}>{modules.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
        <AdminStack>{permissions.map((permission) => <AdminSectionRow key={permission.id}><div style={permissionBlockStyle}><AdminBadge>{permission.module}</AdminBadge><strong>{permission.code}</strong><p>{permission.name}</p>{permission.description && <p>{permission.description}</p>}</div></AdminSectionRow>)}{permissions.length === 0 && <AdminEmpty>ไม่มี permission ใน filter นี้</AdminEmpty>}</AdminStack>
      </AdminCard>
    </>}

    <AdminConfirmDialog open={Boolean(pendingAction)} title={confirmation?.title ?? 'ยืนยันการเปลี่ยนสิทธิ์'} description={confirmation?.description ?? 'ตรวจสอบข้อมูลก่อนดำเนินการ'} confirmLabel={confirmation?.label ?? 'ยืนยัน'} tone={confirmation?.tone ?? 'primary'} busy={Boolean(busyKey)} details={confirmation ? <p style={confirmReasonStyle}>เหตุผล: {confirmation.reason}</p> : null} onCancel={() => { if (!busyKey) setPendingAction(null); }} onConfirm={() => void executeAction()} />
  </AdminPage>;
}

function confirmationFor(action: Exclude<PendingAction, null>): Confirmation {
  if (action.type === 'assign-role') return { title: 'ยืนยันเพิ่ม Role', description: `เพิ่ม ${action.role.code} ให้ ${action.user.username}`, label: 'เพิ่ม role', tone: 'primary', reason: action.reason };
  if (action.type === 'remove-role') return { title: 'ยืนยันถอด Role', description: `ถอด ${action.role.code} ออกจาก ${action.user.username}`, label: 'ถอด role', tone: 'danger', reason: action.reason };
  return { title: 'ยืนยันยกเลิกสิทธิ์ชั่วคราว', description: `ยกเลิก delegated access ของ ${action.delegation.delegate.username}`, label: 'ยกเลิกสิทธิ์', tone: 'danger', reason: action.reason };
}

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === 'object'; }
function isPermission(value: unknown): value is Permission { return isRecord(value) && typeof value.id === 'string' && typeof value.code === 'string' && typeof value.name === 'string' && typeof value.module === 'string'; }
function isAdminRole(value: unknown): value is AdminRole { return isRecord(value) && typeof value.id === 'string' && typeof value.code === 'string' && typeof value.name === 'string' && Number.isFinite(Number(value.level)); }
function isRole(value: unknown): value is Role { return isRecord(value) && typeof value.id === 'string' && typeof value.code === 'string' && typeof value.name === 'string' && Number.isFinite(Number(value.level)) && Number.isFinite(Number(value.adminUserCount)) && Number.isFinite(Number(value.permissionCount)) && typeof value.hasWildcard === 'boolean' && Array.isArray(value.permissions) && value.permissions.every(isPermission); }
function isAdminUser(value: unknown): value is AdminUser { return isRecord(value) && typeof value.id === 'string' && typeof value.username === 'string' && typeof value.email === 'string' && typeof value.status === 'string' && typeof value.twoFactorEnabled === 'boolean' && typeof value.createdAt === 'string' && Array.isArray(value.roles) && value.roles.every(isAdminRole); }
function isDelegation(value: unknown): value is Delegation { return isRecord(value) && typeof value.id === 'string' && typeof value.grantorAdminId === 'string' && typeof value.delegateAdminId === 'string' && Array.isArray(value.permissionCodes) && value.permissionCodes.every((item) => typeof item === 'string') && typeof value.status === 'string' && typeof value.expiresAt === 'string' && isRecord(value.grantor) && typeof value.grantor.username === 'string' && isRecord(value.delegate) && typeof value.delegate.username === 'string' && typeof value.delegate.email === 'string' && typeof value.delegate.status === 'string'; }
function isAccessResponse(value: unknown): value is AccessResponse { return isRecord(value) && isRecord(value.summary) && Number.isFinite(Number(value.summary.roleCount)) && Number.isFinite(Number(value.summary.permissionCount)) && Number.isFinite(Number(value.summary.adminUserCount)) && Number.isFinite(Number(value.summary.wildcardRoleCount)) && Array.isArray(value.roles) && value.roles.every(isRole) && Array.isArray(value.permissions) && value.permissions.every(isPermission) && Array.isArray(value.adminUsers) && value.adminUsers.every(isAdminUser); }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('th-TH'); }

const toolbarStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 10, marginBottom: 12 } as const;
const badgeRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const roleBlockStyle = { display: 'grid', gap: 7, minWidth: 0 } as const;
const roleMetaStyle = { display: 'grid', gap: 8, alignContent: 'start', color: '#94a3b8', fontWeight: 850, minWidth: 0 } as const;
const userBlockStyle = { display: 'grid', gap: 8, minWidth: 0, width: '100%' } as const;
const rolePillWrapStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const rolePillStyle = { display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid rgba(245,197,66,.32)', borderRadius: 999, padding: '7px 9px', background: 'rgba(245,197,66,.10)', color: '#f5c542', fontWeight: 900, maxWidth: '100%', overflowWrap: 'anywhere' as const } as const;
const removeRoleButtonStyle = { border: 0, background: 'transparent', color: '#fecaca', cursor: 'pointer', fontWeight: 950, fontSize: 18, lineHeight: 1, minWidth: 28, minHeight: 28 } as const;
const emptyRoleStyle = { color: '#94a3b8', fontWeight: 800 } as const;
const assignPanelStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(170px, 100%), 1fr))', gap: 8, alignContent: 'start', minWidth: 0 } as const;
const permissionBlockStyle = { display: 'grid', gap: 7, minWidth: 0 } as const;
const selectStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 0, width: '100%' } as const;
const inputStyle = { ...selectStyle, padding: '0 12px' } as const;
const textareaStyle = { ...selectStyle, minHeight: 76, padding: 10, resize: 'vertical' as const } as const;
const delegationFormStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(190px, 100%), 1fr))', gap: 10, marginBottom: 16 } as const;
const delegationActionStyle = { display: 'grid', gap: 8, minWidth: 'min(260px, 100%)', width: 'min(360px, 100%)' } as const;
const confirmReasonStyle = { margin: 0, color: '#cbd5e1', overflowWrap: 'anywhere' as const } as const;
