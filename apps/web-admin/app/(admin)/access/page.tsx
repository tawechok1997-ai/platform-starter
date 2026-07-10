'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminGrid, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminSectionRow, AdminStack } from '../_components/admin-ui';
import AdminInvitationList from './admin-invitation-list';
import InviteAdminPanel from './invite-admin-panel';

type Permission = { id: string; code: string; name: string; module: string; description?: string | null };
type Role = { id: string; code: string; name: string; description?: string | null; level: number; adminUserCount: number; permissionCount: number; hasWildcard: boolean; permissions: Permission[] };
type AdminUser = { id: string; username: string; email: string; status: string; twoFactorEnabled: boolean; lastLoginAt?: string | null; createdAt: string; protected?: boolean; roles: { id: string; code: string; name: string; level: number }[] };
type AccessResponse = { summary: { roleCount: number; permissionCount: number; adminUserCount: number; wildcardRoleCount: number }; roles: Role[]; permissions: Permission[]; adminUsers: AdminUser[] };
type CurrentAdmin = { permissions?: string[] };

export default function AccessOverviewPage() {
  const [data, setData] = useState<AccessResponse | null>(null);
  const [message, setMessage] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [selectedRoles, setSelectedRoles] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState('');
  const [permissionsHeld, setPermissionsHeld] = useState<string[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    setMessage('กำลังโหลดสิทธิ์แอดมิน...');
    try {
      const [accessRes, meRes] = await Promise.all([
        adminApiFetch('/admin/access/overview'),
        adminApiFetch('/admin/auth/me'),
      ]);
      const [payload, mePayload] = await Promise.all([
        accessRes.json().catch(() => null),
        meRes.json().catch(() => null),
      ]);
      if (!accessRes.ok) {
        setMessage(payload?.message ?? 'โหลดข้อมูลสิทธิ์ไม่สำเร็จ');
        return;
      }
      setData(payload);
      setPermissionsHeld(Array.isArray((mePayload as CurrentAdmin | null)?.permissions) ? (mePayload as CurrentAdmin).permissions ?? [] : []);
      setMessage('');
    } catch {
      setMessage('เชื่อมต่อระบบสิทธิ์ไม่สำเร็จ');
    }
  }

  const canManage = permissionsHeld.includes('*') || permissionsHeld.includes('admin.access.manage');
  const canInvite = permissionsHeld.includes('*') || permissionsHeld.includes('admin.create');

  async function assignRole(adminUser: AdminUser) {
    if (!canManage || adminUser.protected) return;
    const roleId = selectedRoles[adminUser.id];
    const role = data?.roles.find((item) => item.id === roleId);
    if (!roleId || !role) { setMessage('กรุณาเลือก role ก่อน'); return; }
    if (adminUser.roles.some((item) => item.id === roleId)) { setMessage('Admin คนนี้มี role นี้อยู่แล้ว'); return; }
    if (!window.confirm(`ยืนยันเพิ่ม role ${role.code} ให้ ${adminUser.username}?`)) return;
    setBusyKey(`${adminUser.id}:assign`);
    const res = await adminApiFetch(`/admin/access/admin-users/${adminUser.id}/roles`, { method: 'POST', body: JSON.stringify({ roleId }) });
    const payload = await res.json().catch(() => null);
    setBusyKey('');
    if (!res.ok) { setMessage(payload?.message ?? 'เพิ่ม role ไม่สำเร็จ'); return; }
    setData(payload);
    setSelectedRoles((current) => ({ ...current, [adminUser.id]: '' }));
    setMessage('เพิ่ม role แล้ว');
  }

  async function removeRole(adminUser: AdminUser, role: AdminUser['roles'][number]) {
    if (!canManage || adminUser.protected) return;
    if (!window.confirm(`ยืนยันถอด role ${role.code} ออกจาก ${adminUser.username}?`)) return;
    setBusyKey(`${adminUser.id}:${role.id}`);
    const res = await adminApiFetch(`/admin/access/admin-users/${adminUser.id}/roles/${role.id}`, { method: 'DELETE' });
    const payload = await res.json().catch(() => null);
    setBusyKey('');
    if (!res.ok) { setMessage(payload?.message ?? 'ถอด role ไม่สำเร็จ'); return; }
    setData(payload);
    setMessage('ถอด role แล้ว');
  }

  const modules = useMemo(() => ['ALL', ...Array.from(new Set((data?.permissions ?? []).map((item) => item.module))).sort()], [data]);
  const permissions = useMemo(() => moduleFilter === 'ALL' ? data?.permissions ?? [] : (data?.permissions ?? []).filter((item) => item.module === moduleFilter), [data, moduleFilter]);

  return <AdminPage eyebrow="Security" title="Access Control" description="จัดการ roles, permissions และ admin users ตามสิทธิ์ของผู้ดูแลแต่ละคน" actions={<AdminButton onClick={load}>Reload</AdminButton>}>
    {message && <AdminNotice>{message}</AdminNotice>}
    {data && <>
      <AdminMetricGrid>
        <AdminMetric title="Roles" value={String(data.summary.roleCount)} helper={`${data.summary.wildcardRoleCount} wildcard`} />
        <AdminMetric title="Permissions" value={String(data.summary.permissionCount)} helper="permission codes" />
        <AdminMetric title="Admin users" value={String(data.summary.adminUserCount)} helper="accounts" />
      </AdminMetricGrid>

      <InviteAdminPanel roles={data.roles} onCreated={load} />
      <AdminInvitationList allowed={canInvite} />

      <AdminGrid>
        <AdminCard title="Roles" description="Role และ permission ที่ผูกอยู่">
          <AdminStack>{data.roles.map((role) => <AdminSectionRow key={role.id}><div style={roleBlockStyle}><div style={badgeRowStyle}><AdminBadge tone={role.hasWildcard ? 'danger' : 'neutral'}>{role.hasWildcard ? 'WILDCARD' : 'ROLE'}</AdminBadge><AdminBadge>Level {role.level}</AdminBadge></div><strong>{role.name}</strong><p>{role.code}</p>{role.description && <p>{role.description}</p>}</div><div style={roleMetaStyle}><span>{role.permissionCount} permissions</span><span>{role.adminUserCount} users</span></div></AdminSectionRow>)}{data.roles.length === 0 && <AdminEmpty>ยังไม่มี roles</AdminEmpty>}</AdminStack>
        </AdminCard>

        <AdminCard title="Admin users" description={canManage ? 'เพิ่มหรือถอด Role ตามสิทธิ์ของคุณ' : 'ดูบัญชีผู้ดูแลแบบอ่านอย่างเดียว'}>
          <AdminStack>{data.adminUsers.map((user) => <AdminSectionRow key={user.id}><div style={userBlockStyle}><div style={badgeRowStyle}><AdminBadge tone={user.status === 'ACTIVE' ? 'success' : 'danger'}>{user.status}</AdminBadge><AdminBadge tone={user.twoFactorEnabled ? 'success' : 'warning'}>{user.twoFactorEnabled ? '2FA ON' : '2FA OFF'}</AdminBadge>{user.protected && <AdminBadge tone="danger">PROTECTED</AdminBadge>}</div><strong>{user.username}</strong><p>{user.email}</p><div style={rolePillWrapStyle}>{user.roles.map((role) => <span key={role.id} style={rolePillStyle}>{role.code}{canManage && !user.protected && <button type="button" disabled={Boolean(busyKey)} onClick={() => removeRole(user, role)} style={removeRoleButtonStyle} aria-label={`Remove ${role.code}`}>×</button>}</span>)}{user.roles.length === 0 && <span style={emptyRoleStyle}>no roles</span>}</div></div>{canManage && !user.protected && <div style={assignPanelStyle}><select value={selectedRoles[user.id] ?? ''} onChange={(event) => setSelectedRoles((current) => ({ ...current, [user.id]: event.target.value }))} style={selectStyle}><option value="">เลือก role</option>{data.roles.filter((role) => !role.hasWildcard && !['owner', 'super_admin'].includes(role.code)).map((role) => <option key={role.id} value={role.id}>{role.code}</option>)}</select><AdminButton disabled={Boolean(busyKey)} onClick={() => assignRole(user)}>Add role</AdminButton></div>}</AdminSectionRow>)}{data.adminUsers.length === 0 && <AdminEmpty>ยังไม่มี admin users</AdminEmpty>}</AdminStack>
        </AdminCard>
      </AdminGrid>

      <AdminCard title="Permissions" description="รายการ permission ทั้งหมดในระบบ">
        <div style={toolbarStyle}><select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)} style={selectStyle}>{modules.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
        <AdminStack>{permissions.map((permission) => <AdminSectionRow key={permission.id}><div style={permissionBlockStyle}><AdminBadge>{permission.module}</AdminBadge><strong>{permission.code}</strong><p>{permission.name}</p>{permission.description && <p>{permission.description}</p>}</div></AdminSectionRow>)}{permissions.length === 0 && <AdminEmpty>ไม่มี permission ใน filter นี้</AdminEmpty>}</AdminStack>
      </AdminCard>
    </>}
  </AdminPage>;
}

const toolbarStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 10, marginBottom: 12 } as const;
const badgeRowStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const roleBlockStyle = { display: 'grid', gap: 7, minWidth: 0 } as const;
const roleMetaStyle = { display: 'grid', gap: 8, alignContent: 'start', color: '#94a3b8', fontWeight: 850, minWidth: 0 } as const;
const userBlockStyle = { display: 'grid', gap: 8, minWidth: 0, width: '100%' } as const;
const rolePillWrapStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const rolePillStyle = { display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid rgba(245,197,66,.32)', borderRadius: 999, padding: '7px 9px', background: 'rgba(245,197,66,.10)', color: '#f5c542', fontWeight: 900, maxWidth: '100%', overflowWrap: 'anywhere' as const } as const;
const removeRoleButtonStyle = { border: 0, background: 'transparent', color: '#fecaca', cursor: 'pointer', fontWeight: 950, fontSize: 18, lineHeight: 1, minWidth: 28, minHeight: 28 } as const;
const emptyRoleStyle = { color: '#94a3b8', fontWeight: 800 } as const;
const assignPanelStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap: 8, alignContent: 'start', minWidth: 0 } as const;
const permissionBlockStyle = { display: 'grid', gap: 7, minWidth: 0 } as const;
const selectStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 0, width: '100%' } as const;
