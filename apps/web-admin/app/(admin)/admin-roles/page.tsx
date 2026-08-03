'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminDrawer } from '../_components/admin-drawer';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmpty,
  AdminMetric,
  AdminMetricGrid,
  AdminNotice,
  AdminPage,
  AdminStack,
} from '../_components/admin-ui';
import { useAdminLocale, type AdminLocale } from '../admin-locale';
import { AdminDataTable, type AdminDataColumn } from '../../../src/features/admin-modernization/data-table';
import { AdminWorkspaceTabs } from '../../../src/features/admin-modernization/workspace-tabs';
import { canAccessPath } from '../admin-nav';
import styles from './admin-role-governance.module.css';

type Permission = { id: string; code: string; name: string; module: string; description?: string | null };
type Role = { id: string; code: string; name: string; description?: string | null; level: number; adminUserCount: number; permissionCount: number; hasWildcard: boolean; permissions: Permission[] };
type AdminRole = { id: string; code: string; name: string; level: number };
type AdminUser = { id: string; username: string; email: string; status: string; protected?: boolean; roles: AdminRole[] };
type AccessOverview = {
  summary: { roleCount: number; permissionCount: number; adminUserCount: number; wildcardRoleCount: number };
  roles: Role[];
  permissions: Permission[];
  adminUsers: AdminUser[];
};
type TeamMember = { adminUserId: string; username: string; email: string; isLead: boolean };
type Team = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  parentTeamId?: string | null;
  managerAdminId?: string | null;
  managerUsername?: string | null;
  memberCount: number;
  members: TeamMember[];
};
type ReportingLine = { managerAdminId: string; subordinateAdminId: string; managerUsername: string; subordinateUsername: string };
type TeamOverview = { teams: Team[]; reportingLines: ReportingLine[] };
type PermissionOverride = {
  id: string;
  permissionCode: string;
  effect: 'ALLOW' | 'DENY';
  reason: string;
  expiresAt?: string | null;
};
type EffectiveAccess = {
  admin: { id: string; username: string; email: string; status: string; position?: string | null; department?: string | null };
  roles: AdminRole[];
  rolePermissionCodes: string[];
  permissions: string[];
  deniedPermissions: string[];
  allowedOverrides: string[];
  deniedOverrides: string[];
  hasWildcard: boolean;
  overrides: PermissionOverride[];
  profile: { scope: Record<string, unknown>; approvalLimits: Record<string, unknown> };
  teams: Array<{ teamId: string; teamCode: string; teamName: string; isLead: boolean }>;
  managerAdminId?: string | null;
  subordinateAdminIds: string[];
};
type CurrentAdmin = { permissions?: string[] };
type Notice = { tone: 'neutral' | 'success' | 'warning' | 'danger'; text: string };

type RolePreview = {
  grantable: boolean;
  reason?: string | null;
  primaryRole: AdminRole;
  roles: AdminRole[];
  permissionCodes: string[];
  modules: string[];
  permissionCount: number;
};

const EMPTY_OVERVIEW: AccessOverview = {
  summary: { roleCount: 0, permissionCount: 0, adminUserCount: 0, wildcardRoleCount: 0 },
  roles: [],
  permissions: [],
  adminUsers: [],
};

export default function AdminRolesPage() {
  const [locale] = useAdminLocale();
  const th = locale === 'th';
  const [overview, setOverview] = useState<AccessOverview>(EMPTY_OVERVIEW);
  const [teams, setTeams] = useState<TeamOverview>({ teams: [], reportingLines: [] });
  const [heldPermissions, setHeldPermissions] = useState<string[]>(['admin.access.view']);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [primaryRoleId, setPrimaryRoleId] = useState('');
  const [roleReason, setRoleReason] = useState('');
  const [rolePreview, setRolePreview] = useState<RolePreview | null>(null);
  const [effective, setEffective] = useState<EffectiveAccess | null>(null);
  const [permissionQuery, setPermissionQuery] = useState('');
  const [permissionPage, setPermissionPage] = useState(1);
  const [permissionPageSize, setPermissionPageSize] = useState(20);
  const [drawerPermission, setDrawerPermission] = useState<Permission | null>(null);
  const [teamCode, setTeamCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [teamParentId, setTeamParentId] = useState('');
  const [teamManagerId, setTeamManagerId] = useState('');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [teamMemberId, setTeamMemberId] = useState('');
  const [teamLead, setTeamLead] = useState(false);
  const [reportingManagerId, setReportingManagerId] = useState('');
  const [overrideCode, setOverrideCode] = useState('');
  const [overrideEffect, setOverrideEffect] = useState<'ALLOW' | 'DENY'>('DENY');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideExpiresAt, setOverrideExpiresAt] = useState('');
  const [scopeJson, setScopeJson] = useState('{}');
  const [limitsJson, setLimitsJson] = useState('{}');
  const [profileReason, setProfileReason] = useState('');

  const has = (permission: string) => heldPermissions.includes('*') || heldPermissions.includes(permission);
  const canManageRoles = has('admin.access.manage');
  const canManageTeams = has('admin.teams.manage');
  const canManageSubordinates = has('admin.subordinates.manage');
  const canOverride = has('admin.permissions.override');
  const selectedAdmin = overview.adminUsers.find((admin) => admin.id === selectedAdminId) ?? null;
  const selectedTeam = teams.teams.find((team) => team.id === selectedTeamId) ?? null;

  useEffect(() => { void loadAll(); }, []);
  useEffect(() => { setPermissionPage(1); }, [permissionQuery, permissionPageSize]);
  useEffect(() => {
    if (!selectedAdmin) {
      setSelectedRoleIds([]);
      setPrimaryRoleId('');
      setEffective(null);
      return;
    }
    const roleIds = selectedAdmin.roles.map((role) => role.id);
    setSelectedRoleIds(roleIds);
    setPrimaryRoleId(selectedAdmin.roles[0]?.id ?? '');
    setRolePreview(null);
    void loadEffective(selectedAdmin.id);
  }, [selectedAdminId]);

  async function loadAll() {
    setLoading(true);
    setNotice(null);
    try {
      const [overviewResponse, teamResponse, currentResponse] = await Promise.all([
        adminApiFetch('/admin/access/overview'),
        adminApiFetch('/admin/access/teams'),
        adminApiFetch('/admin/auth/me'),
      ]);
      const [overviewPayload, teamPayload, currentPayload]: [unknown, unknown, unknown] = await Promise.all([
        overviewResponse.json().catch(() => null),
        teamResponse.json().catch(() => null),
        currentResponse.json().catch(() => null),
      ]);
      if (!overviewResponse.ok || !isAccessOverview(overviewPayload)) throw new Error('overview');
      setOverview(overviewPayload);
      setTeams(teamResponse.ok && isTeamOverview(teamPayload) ? teamPayload : { teams: [], reportingLines: [] });
      setHeldPermissions(currentResponse.ok && isCurrentAdmin(currentPayload) ? currentPayload.permissions ?? [] : ['admin.access.view']);
      if (!selectedAdminId && overviewPayload.adminUsers[0]) setSelectedAdminId(overviewPayload.adminUsers[0].id);
    } catch {
      setNotice({ tone: 'danger', text: th ? 'โหลดข้อมูลบทบาทและทีมไม่สำเร็จ' : 'Unable to load roles and team governance data.' });
    } finally {
      setLoading(false);
    }
  }

  async function loadEffective(adminUserId: string) {
    setBusy('effective');
    try {
      const response = await adminApiFetch(`/admin/access/admin-users/${adminUserId}/effective-access`);
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok || !isEffectiveAccess(payload)) throw new Error('effective');
      setEffective(payload);
      const primary = payload.roles.find((role) => role.code === payload.admin.position) ?? payload.roles[0];
      setPrimaryRoleId(primary?.id ?? '');
      setReportingManagerId(payload.managerAdminId ?? '');
      setScopeJson(JSON.stringify(payload.profile.scope ?? {}, null, 2));
      setLimitsJson(JSON.stringify(payload.profile.approvalLimits ?? {}, null, 2));
    } catch {
      setEffective(null);
      setNotice({ tone: 'warning', text: th ? 'โหลดสิทธิ์ที่มีผลจริงไม่สำเร็จ' : 'Unable to load effective access.' });
    } finally {
      setBusy('');
    }
  }

  function toggleRole(roleId: string) {
    if (!canManageRoles || selectedAdmin?.protected || busy) return;
    setRolePreview(null);
    setSelectedRoleIds((current) => current.includes(roleId)
      ? current.filter((id) => id !== roleId)
      : current.length >= 8 ? current : [...current, roleId]);
  }

  async function previewRoles(): Promise<RolePreview | null> {
    if (!selectedAdmin || selectedRoleIds.length === 0) {
      setRolePreview(null);
      setNotice({ tone: 'danger', text: th ? 'เลือกอย่างน้อยหนึ่งบทบาท' : 'Select at least one role.' });
      return null;
    }
    if (!primaryRoleId || !selectedRoleIds.includes(primaryRoleId)) {
      setRolePreview(null);
      setNotice({ tone: 'danger', text: th ? 'เลือกบทบาทหลักจากรายการที่เลือก' : 'Choose a primary role from the selected roles.' });
      return null;
    }
    setBusy('preview');
    try {
      const response = await adminApiFetch('/admin/access/role-preview', {
        method: 'POST',
        body: JSON.stringify({ roleIds: selectedRoleIds, primaryRoleId }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok || !isRolePreview(payload)) throw new Error('preview');
      setRolePreview(payload);
      setNotice({
        tone: payload.grantable ? 'success' : 'danger',
        text: payload.grantable
          ? (th ? 'ตรวจสิทธิ์แล้ว สามารถบันทึกบทบาทชุดนี้ได้' : 'Role selection can be granted.')
          : payload.reason || (th ? 'ไม่สามารถมอบบทบาทชุดนี้ได้' : 'Role selection cannot be granted.'),
      });
      return payload;
    } catch {
      setRolePreview(null);
      setNotice({ tone: 'danger', text: th ? 'ตรวจสิทธิ์บทบาทไม่สำเร็จ' : 'Role preview failed.' });
      return null;
    } finally {
      setBusy('');
    }
  }

  async function saveRoles() {
    if (!selectedAdmin || !canManageRoles || selectedAdmin.protected) return;
    if (roleReason.trim().length < 5) return setNotice({ tone: 'danger', text: th ? 'ระบุเหตุผลอย่างน้อย 5 ตัวอักษร' : 'Provide a reason of at least 5 characters.' });
    const checkedPreview = rolePreview?.grantable ? rolePreview : await previewRoles();
    if (!checkedPreview?.grantable) return;
    setBusy('roles');
    try {
      const response = await adminApiFetch(`/admin/access/admin-users/${selectedAdmin.id}/roles`, {
        method: 'PATCH',
        body: JSON.stringify({ roleIds: selectedRoleIds, primaryRoleId, reason: roleReason.trim() }),
      });
      if (!response.ok) throw new Error('roles');
      setRoleReason('');
      setRolePreview(null);
      setNotice({ tone: 'success', text: th ? 'บันทึกบทบาทและเพิกถอนเซสชันเดิมแล้ว' : 'Roles saved and prior sessions revoked.' });
      await loadAll();
      await loadEffective(selectedAdmin.id);
    } catch {
      setNotice({ tone: 'danger', text: th ? 'บันทึกบทบาทไม่สำเร็จ' : 'Unable to save roles.' });
    } finally {
      setBusy('');
    }
  }

  async function createTeam() {
    if (!canManageTeams) return;
    if (!/^[a-z0-9][a-z0-9_-]{1,79}$/.test(teamCode) || !teamName.trim()) {
      return setNotice({ tone: 'danger', text: th ? 'กรอกรหัสและชื่อทีมให้ถูกต้อง' : 'Enter a valid team code and name.' });
    }
    setBusy('team:create');
    try {
      const response = await adminApiFetch('/admin/access/teams', {
        method: 'POST',
        body: JSON.stringify({
          code: teamCode,
          name: teamName.trim(),
          description: teamDescription.trim() || undefined,
          parentTeamId: teamParentId || undefined,
          managerAdminId: teamManagerId || undefined,
        }),
      });
      if (!response.ok) throw new Error('team');
      setTeamCode(''); setTeamName(''); setTeamDescription(''); setTeamParentId(''); setTeamManagerId('');
      setNotice({ tone: 'success', text: th ? 'สร้างทีมแล้ว' : 'Team created.' });
      await loadAll();
    } catch {
      setNotice({ tone: 'danger', text: th ? 'สร้างทีมไม่สำเร็จ' : 'Unable to create team.' });
    } finally { setBusy(''); }
  }

  async function addTeamMember() {
    if (!canManageTeams || !selectedTeam || !teamMemberId) return;
    setBusy('team:member');
    try {
      const response = await adminApiFetch(`/admin/access/teams/${selectedTeam.id}/members`, {
        method: 'POST',
        body: JSON.stringify({ adminUserId: teamMemberId, isLead: teamLead }),
      });
      if (!response.ok) throw new Error('member');
      setTeamMemberId(''); setTeamLead(false);
      setNotice({ tone: 'success', text: th ? 'เพิ่มสมาชิกทีมแล้ว' : 'Team member added.' });
      await loadAll();
      if (selectedAdminId) await loadEffective(selectedAdminId);
    } catch {
      setNotice({ tone: 'danger', text: th ? 'เพิ่มสมาชิกทีมไม่สำเร็จ' : 'Unable to add team member.' });
    } finally { setBusy(''); }
  }

  async function removeTeamMember(teamId: string, adminUserId: string) {
    if (!canManageTeams) return;
    setBusy(`team:remove:${adminUserId}`);
    try {
      const response = await adminApiFetch(`/admin/access/teams/${teamId}/members/${adminUserId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('remove');
      setNotice({ tone: 'success', text: th ? 'นำสมาชิกออกจากทีมแล้ว' : 'Team member removed.' });
      await loadAll();
      if (selectedAdminId) await loadEffective(selectedAdminId);
    } catch {
      setNotice({ tone: 'danger', text: th ? 'นำสมาชิกออกจากทีมไม่สำเร็จ' : 'Unable to remove team member.' });
    } finally { setBusy(''); }
  }

  async function saveReportingLine() {
    if (!selectedAdmin || !canManageSubordinates || selectedAdmin.protected) return;
    setBusy('reporting');
    try {
      const response = await adminApiFetch(`/admin/access/admin-users/${selectedAdmin.id}/reporting-line`, {
        method: 'PATCH',
        body: JSON.stringify({ managerAdminId: reportingManagerId || null }),
      });
      if (!response.ok) throw new Error('reporting');
      setNotice({ tone: 'success', text: th ? 'บันทึกสายบังคับบัญชาแล้ว' : 'Reporting line saved.' });
      await loadAll();
      await loadEffective(selectedAdmin.id);
    } catch {
      setNotice({ tone: 'danger', text: th ? 'บันทึกสายบังคับบัญชาไม่สำเร็จ' : 'Unable to save reporting line.' });
    } finally { setBusy(''); }
  }

  async function saveOverride() {
    if (!selectedAdmin || !canOverride || selectedAdmin.protected) return;
    if (!overrideCode.trim() || overrideReason.trim().length < 5) {
      return setNotice({ tone: 'danger', text: th ? 'กรอกรหัสสิทธิ์และเหตุผลอย่างน้อย 5 ตัวอักษร' : 'Enter a permission code and a reason of at least 5 characters.' });
    }
    setBusy('override');
    try {
      const response = await adminApiFetch(`/admin/access/admin-users/${selectedAdmin.id}/permission-overrides`, {
        method: 'PATCH',
        body: JSON.stringify({
          permissionCode: overrideCode.trim(),
          effect: overrideEffect,
          reason: overrideReason.trim(),
          expiresAt: overrideExpiresAt ? new Date(overrideExpiresAt).toISOString() : undefined,
        }),
      });
      if (!response.ok) throw new Error('override');
      setOverrideCode(''); setOverrideReason(''); setOverrideExpiresAt('');
      setNotice({ tone: 'success', text: th ? 'บันทึก Override แล้ว โดย DENY มีลำดับสูงสุด' : 'Override saved. DENY has highest priority.' });
      await loadEffective(selectedAdmin.id);
    } catch {
      setNotice({ tone: 'danger', text: th ? 'บันทึก Override ไม่สำเร็จ' : 'Unable to save override.' });
    } finally { setBusy(''); }
  }

  async function deleteOverride(permissionCode: string) {
    if (!selectedAdmin || !canOverride) return;
    setBusy(`override:delete:${permissionCode}`);
    try {
      const response = await adminApiFetch(`/admin/access/admin-users/${selectedAdmin.id}/permission-overrides/${encodeURIComponent(permissionCode)}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('delete');
      setNotice({ tone: 'success', text: th ? 'ลบ Override แล้ว' : 'Override removed.' });
      await loadEffective(selectedAdmin.id);
    } catch {
      setNotice({ tone: 'danger', text: th ? 'ลบ Override ไม่สำเร็จ' : 'Unable to remove override.' });
    } finally { setBusy(''); }
  }

  async function saveProfile() {
    if (!selectedAdmin || !canManageRoles || selectedAdmin.protected) return;
    const scope = parseJsonObject(scopeJson);
    const approvalLimits = parseJsonObject(limitsJson);
    if (!scope || !approvalLimits || profileReason.trim().length < 5) {
      return setNotice({ tone: 'danger', text: th ? 'ตรวจ JSON และระบุเหตุผลอย่างน้อย 5 ตัวอักษร' : 'Validate JSON and provide a reason of at least 5 characters.' });
    }
    setBusy('profile');
    try {
      const response = await adminApiFetch(`/admin/access/admin-users/${selectedAdmin.id}/access-profile`, {
        method: 'PATCH',
        body: JSON.stringify({ scope, approvalLimits, reason: profileReason.trim() }),
      });
      if (!response.ok) throw new Error('profile');
      setProfileReason('');
      setNotice({ tone: 'success', text: th ? 'บันทึก Scope และวงเงินอนุมัติแล้ว' : 'Scope and approval limits saved.' });
      await loadEffective(selectedAdmin.id);
    } catch {
      setNotice({ tone: 'danger', text: th ? 'บันทึก Access Profile ไม่สำเร็จ' : 'Unable to save access profile.' });
    } finally { setBusy(''); }
  }

  const normalizedQuery = permissionQuery.trim().toLowerCase();
  const filteredPermissions = useMemo(() => overview.permissions.filter((permission) => !normalizedQuery || [
    permission.code, permission.name, permission.module, permission.description ?? '',
  ].some((value) => value.toLowerCase().includes(normalizedQuery))), [overview.permissions, normalizedQuery]);
  const visiblePermissions = filteredPermissions.slice((permissionPage - 1) * permissionPageSize, permissionPage * permissionPageSize);
  const permissionColumns = useMemo<readonly AdminDataColumn<Permission>[]>(() => [
    { id: 'module', header: th ? 'โมดูล' : 'Module', mobileLabel: th ? 'โมดูล' : 'Module', priority: 'secondary', cell: (permission) => <AdminBadge>{permission.module}</AdminBadge> },
    { id: 'code', header: th ? 'รหัสสิทธิ์' : 'Permission code', mobileLabel: th ? 'รหัสสิทธิ์' : 'Permission code', priority: 'primary', cell: (permission) => <code>{permission.code}</code> },
    { id: 'name', header: th ? 'ชื่อ' : 'Name', mobileLabel: th ? 'ชื่อ' : 'Name', priority: 'primary', cell: (permission) => <strong>{permission.name}</strong> },
    { id: 'detail', header: '', mobileLabel: th ? 'รายละเอียด' : 'Details', align: 'end', priority: 'secondary', cell: (permission) => <AdminButton size="compact" tone="secondary" onClick={() => setDrawerPermission(permission)}>{th ? 'ดู' : 'View'}</AdminButton> },
  ], [th]);

  return <AdminPage
    eyebrow={th ? 'สิทธิ์และความปลอดภัย' : 'Access & security'}
    title={th ? 'บทบาท ทีม และสิทธิ์ที่มีผลจริง' : 'Roles, teams, and effective access'}
    description={th ? 'จัดการ Multi-role, Primary role, Team hierarchy, Reporting line, Override, Scope และวงเงินอนุมัติจากจุดเดียว' : 'Manage multi-role assignments, teams, reporting lines, overrides, scope, and approval limits.'}
    actions={<AdminButton tone="secondary" disabled={loading || Boolean(busy)} onClick={() => void loadAll()}>{loading ? (th ? 'กำลังโหลด...' : 'Loading...') : (th ? 'รีเฟรช' : 'Refresh')}</AdminButton>}
  >
    <AdminWorkspaceTabs
      ariaLabel={th ? 'เมนูสิทธิ์และความปลอดภัย' : 'Access and security navigation'}
      activeId="roles"
      tabs={accessTabs(locale).filter((tab) => canAccessPath(tab.href, heldPermissions))}
    />

    <div className={styles.workspace}>
      {notice && <AdminNotice tone={notice.tone}>{notice.text}</AdminNotice>}

      <AdminMetricGrid>
        <AdminMetric title={th ? 'บทบาท' : 'Roles'} value={String(overview.summary.roleCount)} />
        <AdminMetric title={th ? 'ผู้ดูแล' : 'Administrators'} value={String(overview.summary.adminUserCount)} />
        <AdminMetric title={th ? 'ทีม' : 'Teams'} value={String(teams.teams.length)} />
        <AdminMetric title={th ? 'สิทธิ์ทั้งหมด' : 'Permissions'} value={String(overview.summary.permissionCount)} tone="warning" />
      </AdminMetricGrid>

      <AdminCard title={th ? 'เลือกบัญชีผู้ดูแล' : 'Select administrator'} description={th ? 'การแก้ทุกอย่างด้านล่างจะผูกกับบัญชีที่เลือกและบันทึก Audit' : 'All changes below target the selected account and are audited.'}>
        <div className={styles.toolbar}>
          <label className={styles.field}><span>{th ? 'บัญชีผู้ดูแล' : 'Administrator'}</span><select value={selectedAdminId} onChange={(event) => setSelectedAdminId(event.target.value)} disabled={loading || Boolean(busy)}><option value="">{th ? 'เลือกบัญชี' : 'Select account'}</option>{overview.adminUsers.map((admin) => <option key={admin.id} value={admin.id}>{admin.username} · {admin.email}</option>)}</select></label>
          {selectedAdmin && <div className={styles.badges}><AdminBadge tone={selectedAdmin.protected ? 'danger' : 'neutral'}>{selectedAdmin.protected ? (th ? 'บัญชีป้องกัน' : 'Protected') : selectedAdmin.status}</AdminBadge>{selectedAdmin.roles.map((role) => <AdminBadge key={role.id}>{role.code}</AdminBadge>)}</div>}
        </div>
      </AdminCard>

      <div className={styles.editorGrid}>
        <AdminCard title={th ? 'Multi-role และ Primary role' : 'Multi-role and primary role'} description={th ? 'เลือกได้สูงสุด 8 บทบาท ตรวจสิทธิ์ก่อนบันทึก และเพิกถอนเซสชันเดิมหลังเปลี่ยน' : 'Select up to 8 roles, preview grants, and revoke prior sessions after changes.'}>
          {!selectedAdmin && <AdminEmpty>{th ? 'เลือกบัญชีก่อน' : 'Select an account first.'}</AdminEmpty>}
          {selectedAdmin && <AdminStack>
            <div className={styles.roleGrid}>{overview.roles.filter((role) => !role.hasWildcard && !['owner', 'super_admin'].includes(role.code)).map((role) => <label key={role.id} className={styles.roleOption}><input type="checkbox" checked={selectedRoleIds.includes(role.id)} onChange={() => toggleRole(role.id)} disabled={!canManageRoles || selectedAdmin.protected || Boolean(busy)} /><span><strong>{role.name}</strong><small>{role.code} · {th ? 'ระดับ' : 'Level'} {role.level} · {role.permissionCount} {th ? 'สิทธิ์' : 'permissions'}</small></span></label>)}</div>
            <label className={styles.field}><span>{th ? 'บทบาทหลัก' : 'Primary role'}</span><select value={primaryRoleId} onChange={(event) => { setPrimaryRoleId(event.target.value); setRolePreview(null); }} disabled={!canManageRoles || selectedAdmin.protected || Boolean(busy)}><option value="">{th ? 'เลือกบทบาทหลัก' : 'Select primary role'}</option>{overview.roles.filter((role) => selectedRoleIds.includes(role.id)).map((role) => <option key={role.id} value={role.id}>{role.name} ({role.code})</option>)}</select></label>
            <label className={styles.field}><span>{th ? 'เหตุผลการเปลี่ยน' : 'Change reason'}</span><input value={roleReason} onChange={(event) => setRoleReason(event.target.value)} maxLength={500} disabled={!canManageRoles || selectedAdmin.protected || Boolean(busy)} placeholder={th ? 'อย่างน้อย 5 ตัวอักษร' : 'At least 5 characters'} /></label>
            <div className={styles.actions}><AdminButton tone="secondary" disabled={!canManageRoles || selectedAdmin.protected || selectedRoleIds.length === 0 || Boolean(busy)} onClick={() => void previewRoles()}>{busy === 'preview' ? (th ? 'กำลังตรวจ...' : 'Checking...') : (th ? 'ตรวจสิทธิ์' : 'Preview access')}</AdminButton><AdminButton disabled={!canManageRoles || selectedAdmin.protected || Boolean(busy)} onClick={() => void saveRoles()}>{busy === 'roles' ? (th ? 'กำลังบันทึก...' : 'Saving...') : (th ? 'บันทึกบทบาท' : 'Save roles')}</AdminButton></div>
            {rolePreview && <div className={styles.summaryBox}><div className={styles.badges}><AdminBadge tone={rolePreview.grantable ? 'success' : 'danger'}>{rolePreview.grantable ? (th ? 'มอบได้' : 'Grantable') : (th ? 'มอบไม่ได้' : 'Blocked')}</AdminBadge><AdminBadge>{rolePreview.permissionCount} {th ? 'สิทธิ์' : 'permissions'}</AdminBadge></div><strong>{th ? 'บทบาทหลัก' : 'Primary'}: {rolePreview.primaryRole.name}</strong><span className={styles.muted}>{rolePreview.modules.join(', ') || '-'}</span></div>}
          </AdminStack>}
        </AdminCard>

        <AdminCard title={th ? 'สิทธิ์ที่มีผลจริง' : 'Effective access'} description={th ? 'DENY ชนะ Role, Delegation, ALLOW และ Wildcard เสมอ' : 'DENY always wins over roles, delegations, ALLOW, and wildcard access.'}>
          {!effective && <AdminEmpty>{busy === 'effective' ? (th ? 'กำลังโหลด...' : 'Loading...') : (th ? 'ยังไม่มีข้อมูล' : 'No data yet.')}</AdminEmpty>}
          {effective && <AdminStack>
            <div className={styles.badges}><AdminBadge tone={effective.hasWildcard ? 'danger' : 'neutral'}>{effective.hasWildcard ? 'WILDCARD' : (th ? 'จำกัดสิทธิ์' : 'Scoped')}</AdminBadge><AdminBadge>{effective.permissions.length} {th ? 'สิทธิ์ใช้งาน' : 'active permissions'}</AdminBadge><AdminBadge tone="danger">{effective.deniedPermissions.length} DENY</AdminBadge></div>
            <div><strong>{th ? 'สิทธิ์ที่ใช้ได้' : 'Allowed permissions'}</strong><div className={styles.permissionList}>{effective.permissions.map((code) => <span key={code} className={styles.permissionChip}>{code}</span>)}</div></div>
            <div><strong>{th ? 'สิทธิ์ที่ถูกปฏิเสธ' : 'Denied permissions'}</strong><div className={styles.permissionList}>{effective.deniedPermissions.map((code) => <span key={code} className={`${styles.permissionChip} ${styles.permissionChipDenied}`}>{code}</span>)}{effective.deniedPermissions.length === 0 && <span className={styles.muted}>-</span>}</div></div>
            <div className={styles.teamMeta}>{effective.teams.map((team) => <AdminBadge key={team.teamId}>{team.teamName}{team.isLead ? ` · ${th ? 'หัวหน้าทีม' : 'Lead'}` : ''}</AdminBadge>)}</div>
          </AdminStack>}
        </AdminCard>
      </div>

      <div className={styles.editorGrid}>
        <AdminCard title={th ? 'สายบังคับบัญชาและ Override' : 'Reporting line and overrides'} description={th ? 'กำหนดผู้จัดการโดยตรง และเพิ่ม ALLOW/DENY รายบุคคล' : 'Set a direct manager and per-user ALLOW/DENY overrides.'}>
          {!selectedAdmin && <AdminEmpty>{th ? 'เลือกบัญชีก่อน' : 'Select an account first.'}</AdminEmpty>}
          {selectedAdmin && <AdminStack>
            <label className={styles.field}><span>{th ? 'ผู้จัดการโดยตรง' : 'Direct manager'}</span><select value={reportingManagerId} onChange={(event) => setReportingManagerId(event.target.value)} disabled={!canManageSubordinates || selectedAdmin.protected || Boolean(busy)}><option value="">{th ? 'ไม่มีผู้จัดการ' : 'No manager'}</option>{overview.adminUsers.filter((admin) => admin.id !== selectedAdmin.id && !admin.protected).map((admin) => <option key={admin.id} value={admin.id}>{admin.username}</option>)}</select></label>
            <AdminButton tone="secondary" disabled={!canManageSubordinates || selectedAdmin.protected || Boolean(busy)} onClick={() => void saveReportingLine()}>{busy === 'reporting' ? (th ? 'กำลังบันทึก...' : 'Saving...') : (th ? 'บันทึกสายบังคับบัญชา' : 'Save reporting line')}</AdminButton>
            <div className={styles.detailGrid}>
              <label className={styles.field}><span>{th ? 'รหัสสิทธิ์' : 'Permission code'}</span><input value={overrideCode} onChange={(event) => setOverrideCode(event.target.value)} placeholder="withdraw.approve" disabled={!canOverride || selectedAdmin.protected || Boolean(busy)} /></label>
              <label className={styles.field}><span>{th ? 'ผล' : 'Effect'}</span><select value={overrideEffect} onChange={(event) => setOverrideEffect(event.target.value as 'ALLOW' | 'DENY')} disabled={!canOverride || selectedAdmin.protected || Boolean(busy)}><option value="DENY">DENY</option><option value="ALLOW">ALLOW</option></select></label>
              <label className={styles.field}><span>{th ? 'หมดอายุ' : 'Expires at'}</span><input type="datetime-local" value={overrideExpiresAt} onChange={(event) => setOverrideExpiresAt(event.target.value)} disabled={!canOverride || selectedAdmin.protected || Boolean(busy)} /></label>
              <label className={styles.field}><span>{th ? 'เหตุผล' : 'Reason'}</span><input value={overrideReason} onChange={(event) => setOverrideReason(event.target.value)} maxLength={500} disabled={!canOverride || selectedAdmin.protected || Boolean(busy)} /></label>
            </div>
            <AdminButton disabled={!canOverride || selectedAdmin.protected || Boolean(busy)} onClick={() => void saveOverride()}>{busy === 'override' ? (th ? 'กำลังบันทึก...' : 'Saving...') : (th ? 'บันทึก Override' : 'Save override')}</AdminButton>
            {effective?.overrides.map((item) => <div key={item.id} className={styles.teamMember}><span><strong>{item.permissionCode}</strong> · <AdminBadge tone={item.effect === 'DENY' ? 'danger' : 'success'}>{item.effect}</AdminBadge><small className={styles.muted}> {item.reason}</small></span><AdminButton size="compact" tone="danger" disabled={!canOverride || Boolean(busy)} onClick={() => void deleteOverride(item.permissionCode)}>{th ? 'ลบ' : 'Remove'}</AdminButton></div>)}
          </AdminStack>}
        </AdminCard>

        <AdminCard title={th ? 'Scope และวงเงินอนุมัติ' : 'Scope and approval limits'} description={th ? 'เก็บเป็น JSON เพื่อรองรับขอบเขตทีม สาขา ผู้ให้บริการ และวงเงินหลายประเภท' : 'JSON profiles support team, branch, provider, and multiple approval limits.'}>
          {!selectedAdmin && <AdminEmpty>{th ? 'เลือกบัญชีก่อน' : 'Select an account first.'}</AdminEmpty>}
          {selectedAdmin && <AdminStack>
            <label className={styles.textarea}><span>Scope JSON</span><textarea value={scopeJson} onChange={(event) => setScopeJson(event.target.value)} disabled={!canManageRoles || selectedAdmin.protected || Boolean(busy)} /></label>
            <label className={styles.textarea}><span>Approval limits JSON</span><textarea value={limitsJson} onChange={(event) => setLimitsJson(event.target.value)} disabled={!canManageRoles || selectedAdmin.protected || Boolean(busy)} /></label>
            <label className={styles.field}><span>{th ? 'เหตุผล' : 'Reason'}</span><input value={profileReason} onChange={(event) => setProfileReason(event.target.value)} maxLength={500} disabled={!canManageRoles || selectedAdmin.protected || Boolean(busy)} /></label>
            <AdminButton disabled={!canManageRoles || selectedAdmin.protected || Boolean(busy)} onClick={() => void saveProfile()}>{busy === 'profile' ? (th ? 'กำลังบันทึก...' : 'Saving...') : (th ? 'บันทึก Access Profile' : 'Save access profile')}</AdminButton>
          </AdminStack>}
        </AdminCard>
      </div>

      <AdminCard title={th ? 'โครงสร้างทีม' : 'Team hierarchy'} description={th ? 'สร้างทีมซ้อนทีม กำหนดผู้จัดการ หัวหน้าทีม และสมาชิก' : 'Create nested teams and assign managers, leads, and members.'}>
        {canManageTeams && <AdminStack>
          <div className={styles.detailGrid}>
            <label className={styles.field}><span>{th ? 'รหัสทีม' : 'Team code'}</span><input value={teamCode} onChange={(event) => setTeamCode(event.target.value.toLowerCase())} placeholder="finance_ops" /></label>
            <label className={styles.field}><span>{th ? 'ชื่อทีม' : 'Team name'}</span><input value={teamName} onChange={(event) => setTeamName(event.target.value)} /></label>
            <label className={styles.field}><span>{th ? 'ทีมแม่' : 'Parent team'}</span><select value={teamParentId} onChange={(event) => setTeamParentId(event.target.value)}><option value="">{th ? 'ไม่มีทีมแม่' : 'No parent'}</option>{teams.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
            <label className={styles.field}><span>{th ? 'ผู้จัดการทีม' : 'Team manager'}</span><select value={teamManagerId} onChange={(event) => setTeamManagerId(event.target.value)}><option value="">{th ? 'ยังไม่กำหนด' : 'Unassigned'}</option>{overview.adminUsers.filter((admin) => !admin.protected).map((admin) => <option key={admin.id} value={admin.id}>{admin.username}</option>)}</select></label>
          </div>
          <label className={styles.field}><span>{th ? 'คำอธิบาย' : 'Description'}</span><input value={teamDescription} onChange={(event) => setTeamDescription(event.target.value)} maxLength={1000} /></label>
          <AdminButton disabled={Boolean(busy)} onClick={() => void createTeam()}>{busy === 'team:create' ? (th ? 'กำลังสร้าง...' : 'Creating...') : (th ? 'สร้างทีม' : 'Create team')}</AdminButton>
        </AdminStack>}

        <div className={styles.teamGrid}>
          {teams.teams.map((team) => <article key={team.id} className={styles.teamCard}>
            <header><div className={styles.badges}><AdminBadge>{team.code}</AdminBadge>{team.parentTeamId && <AdminBadge>{th ? 'ทีมย่อย' : 'Child team'}</AdminBadge>}</div><strong>{team.name}</strong><span className={styles.muted}>{team.description || '-'}</span><small>{th ? 'ผู้จัดการ' : 'Manager'}: {team.managerUsername || '-'}</small></header>
            <div className={styles.teamMembers}>{team.members.map((member) => <div key={member.adminUserId} className={styles.teamMember}><span><strong>{member.username}</strong><small className={styles.muted}> {member.email}</small>{member.isLead && <AdminBadge tone="warning">{th ? 'หัวหน้าทีม' : 'Lead'}</AdminBadge>}</span>{canManageTeams && <AdminButton size="compact" tone="danger" disabled={Boolean(busy)} onClick={() => void removeTeamMember(team.id, member.adminUserId)}>{th ? 'นำออก' : 'Remove'}</AdminButton>}</div>)}{team.members.length === 0 && <span className={styles.muted}>{th ? 'ยังไม่มีสมาชิก' : 'No members yet.'}</span>}</div>
            {canManageTeams && <AdminButton size="compact" tone="secondary" onClick={() => setSelectedTeamId(team.id)}>{selectedTeamId === team.id ? (th ? 'กำลังจัดการ' : 'Selected') : (th ? 'จัดการสมาชิก' : 'Manage members')}</AdminButton>}
          </article>)}
          {teams.teams.length === 0 && <AdminEmpty>{th ? 'ยังไม่มีทีม' : 'No teams yet.'}</AdminEmpty>}
        </div>

        {canManageTeams && selectedTeam && <div className={styles.summaryBox}>
          <strong>{th ? 'เพิ่มสมาชิกให้' : 'Add member to'} {selectedTeam.name}</strong>
          <div className={styles.toolbar}><label className={styles.field}><span>{th ? 'ผู้ดูแล' : 'Administrator'}</span><select value={teamMemberId} onChange={(event) => setTeamMemberId(event.target.value)}><option value="">{th ? 'เลือกผู้ดูแล' : 'Select administrator'}</option>{overview.adminUsers.filter((admin) => !admin.protected && !selectedTeam.members.some((member) => member.adminUserId === admin.id)).map((admin) => <option key={admin.id} value={admin.id}>{admin.username}</option>)}</select></label><label className={styles.roleOption}><input type="checkbox" checked={teamLead} onChange={(event) => setTeamLead(event.target.checked)} /><span><strong>{th ? 'เป็นหัวหน้าทีม' : 'Team lead'}</strong></span></label><AdminButton disabled={!teamMemberId || Boolean(busy)} onClick={() => void addTeamMember()}>{busy === 'team:member' ? (th ? 'กำลังเพิ่ม...' : 'Adding...') : (th ? 'เพิ่มสมาชิก' : 'Add member')}</AdminButton></div>
        </div>}
      </AdminCard>

      <AdminCard title={th ? 'รายการสิทธิ์' : 'Permission catalog'} description={th ? 'ค้นหาและตรวจรายละเอียดสิทธิ์ทั้งหมด' : 'Search and inspect all permission definitions.'}>
        <div className={styles.toolbar}><label className={styles.field}><span>{th ? 'ค้นหา' : 'Search'}</span><input value={permissionQuery} onChange={(event) => setPermissionQuery(event.target.value)} placeholder={th ? 'รหัส ชื่อ โมดูล หรือคำอธิบาย' : 'Code, name, module, or description'} /></label></div>
        <AdminDataTable
          ariaLabel={th ? 'รายการสิทธิ์' : 'Permission catalog'}
          columns={permissionColumns}
          rows={visiblePermissions}
          rowKey={(permission) => permission.id}
          loading={loading}
          emptyTitle={th ? 'ไม่พบสิทธิ์' : 'No permissions found'}
          emptyDescription={th ? 'ลองเปลี่ยนคำค้นหา' : 'Try another search.'}
          page={permissionPage}
          pageSize={permissionPageSize}
          totalItems={filteredPermissions.length}
          pageSizeOptions={[20, 50, 100]}
          onPageChange={setPermissionPage}
          onPageSizeChange={setPermissionPageSize}
        />
      </AdminCard>
    </div>

    <AdminDrawer open={Boolean(drawerPermission)} title={drawerPermission?.code ?? ''} description={drawerPermission?.name} closeLabel={th ? 'ปิด' : 'Close'} size="compact" onClose={() => setDrawerPermission(null)}>
      {drawerPermission && <AdminStack><AdminBadge>{drawerPermission.module}</AdminBadge><strong>{drawerPermission.name}</strong><p>{drawerPermission.description || (th ? 'ไม่มีคำอธิบาย' : 'No description')}</p></AdminStack>}
    </AdminDrawer>
  </AdminPage>;
}

function accessTabs(locale: AdminLocale) {
  const th = locale === 'th';
  return [
    { id: 'accounts', label: th ? 'บัญชีผู้ดูแล' : 'Admin accounts', href: '/admin-accounts' },
    { id: 'roles', label: th ? 'บทบาท ทีม และสิทธิ์' : 'Roles, teams & access', shortLabel: th ? 'สิทธิ์' : 'Roles', href: '/admin-roles' },
    { id: 'invitations', label: th ? 'คำเชิญ' : 'Invitations', href: '/admin-invitations' },
    { id: 'audit', label: th ? 'บันทึกการใช้งาน' : 'Audit logs', href: '/audit' },
    { id: 'security', label: th ? 'ความปลอดภัย' : 'Security', href: '/security' },
    { id: 'anti-bot', label: th ? 'ป้องกันบอต' : 'Bot protection', href: '/anti-bot' },
  ];
}

function parseJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed: unknown = JSON.parse(value);
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }
function isPermission(value: unknown): value is Permission { return isRecord(value) && typeof value.id === 'string' && typeof value.code === 'string' && typeof value.name === 'string' && typeof value.module === 'string'; }
function isAdminRole(value: unknown): value is AdminRole { return isRecord(value) && typeof value.id === 'string' && typeof value.code === 'string' && typeof value.name === 'string' && typeof value.level === 'number'; }
function isRole(value: unknown): value is Role { return isRecord(value) && typeof value.id === 'string' && typeof value.code === 'string' && typeof value.name === 'string' && typeof value.level === 'number' && typeof value.adminUserCount === 'number' && typeof value.permissionCount === 'number' && typeof value.hasWildcard === 'boolean' && Array.isArray(value.permissions) && value.permissions.every(isPermission); }
function isAdminUser(value: unknown): value is AdminUser { return isRecord(value) && typeof value.id === 'string' && typeof value.username === 'string' && typeof value.email === 'string' && typeof value.status === 'string' && Array.isArray(value.roles) && value.roles.every(isAdminRole); }
function isAccessOverview(value: unknown): value is AccessOverview { return isRecord(value) && isRecord(value.summary) && Array.isArray(value.roles) && value.roles.every(isRole) && Array.isArray(value.permissions) && value.permissions.every(isPermission) && Array.isArray(value.adminUsers) && value.adminUsers.every(isAdminUser); }
function isTeamMember(value: unknown): value is TeamMember { return isRecord(value) && typeof value.adminUserId === 'string' && typeof value.username === 'string' && typeof value.email === 'string' && typeof value.isLead === 'boolean'; }
function isTeam(value: unknown): value is Team { return isRecord(value) && typeof value.id === 'string' && typeof value.code === 'string' && typeof value.name === 'string' && typeof value.memberCount === 'number' && Array.isArray(value.members) && value.members.every(isTeamMember); }
function isReportingLine(value: unknown): value is ReportingLine { return isRecord(value) && typeof value.managerAdminId === 'string' && typeof value.subordinateAdminId === 'string' && typeof value.managerUsername === 'string' && typeof value.subordinateUsername === 'string'; }
function isTeamOverview(value: unknown): value is TeamOverview { return isRecord(value) && Array.isArray(value.teams) && value.teams.every(isTeam) && Array.isArray(value.reportingLines) && value.reportingLines.every(isReportingLine); }
function isPermissionOverride(value: unknown): value is PermissionOverride { return isRecord(value) && typeof value.id === 'string' && typeof value.permissionCode === 'string' && (value.effect === 'ALLOW' || value.effect === 'DENY') && typeof value.reason === 'string'; }
function isEffectiveAccess(value: unknown): value is EffectiveAccess { return isRecord(value) && isRecord(value.admin) && typeof value.admin.id === 'string' && Array.isArray(value.roles) && value.roles.every(isAdminRole) && Array.isArray(value.rolePermissionCodes) && value.rolePermissionCodes.every((item) => typeof item === 'string') && Array.isArray(value.permissions) && value.permissions.every((item) => typeof item === 'string') && Array.isArray(value.deniedPermissions) && value.deniedPermissions.every((item) => typeof item === 'string') && Array.isArray(value.overrides) && value.overrides.every(isPermissionOverride) && isRecord(value.profile) && Array.isArray(value.teams) && Array.isArray(value.subordinateAdminIds); }
function isCurrentAdmin(value: unknown): value is CurrentAdmin { return isRecord(value) && (value.permissions === undefined || (Array.isArray(value.permissions) && value.permissions.every((item) => typeof item === 'string'))); }
function isRolePreview(value: unknown): value is RolePreview { return isRecord(value) && typeof value.grantable === 'boolean' && isAdminRole(value.primaryRole) && Array.isArray(value.roles) && value.roles.every(isAdminRole) && Array.isArray(value.permissionCodes) && value.permissionCodes.every((item) => typeof item === 'string') && Array.isArray(value.modules) && value.modules.every((item) => typeof item === 'string') && typeof value.permissionCount === 'number'; }
