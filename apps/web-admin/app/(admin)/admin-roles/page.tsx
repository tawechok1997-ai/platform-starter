'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminEmpty,
  AdminMetric,
  AdminMetricGrid,
  AdminNotice,
  AdminPage,
} from '../_components/admin-ui';
import { useAdminLocale, type AdminLocale } from '../admin-locale';
import { canAccessPath } from '../admin-nav';
import { AdminWorkspaceTabs } from '../../../src/features/admin-modernization/workspace-tabs';
import styles from './admin-role-governance.module.css';

type Permission = {
  id: string;
  code: string;
  name: string;
  module: string;
  description?: string | null;
};

type Role = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  level: number;
  adminUserCount: number;
  permissionCount: number;
  hasWildcard: boolean;
  permissions: Permission[];
};

type AdminRole = { id: string; code: string; name: string; level: number };

type AdminUser = {
  id: string;
  username: string;
  email: string;
  status: string;
  protected?: boolean;
  roles: AdminRole[];
};

type AccessOverview = {
  summary: {
    roleCount: number;
    permissionCount: number;
    adminUserCount: number;
    wildcardRoleCount: number;
  };
  roles: Role[];
  permissions: Permission[];
  adminUsers: AdminUser[];
};

type TeamMember = {
  adminUserId: string;
  username: string;
  email: string;
  isLead: boolean;
};

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

type TeamOverview = {
  teams: Team[];
  reportingLines: Array<{
    managerAdminId: string;
    subordinateAdminId: string;
    managerUsername: string;
    subordinateUsername: string;
  }>;
};

type PermissionOverride = {
  id: string;
  permissionCode: string;
  effect: 'ALLOW' | 'DENY';
  reason: string;
  expiresAt?: string | null;
};

type EffectiveAccess = {
  admin: {
    id: string;
    username: string;
    email: string;
    status: string;
    position?: string | null;
    department?: string | null;
  };
  roles: AdminRole[];
  rolePermissionCodes: string[];
  permissions: string[];
  deniedPermissions: string[];
  allowedOverrides: string[];
  deniedOverrides: string[];
  hasWildcard: boolean;
  overrides: PermissionOverride[];
  profile: {
    scope: Record<string, unknown>;
    approvalLimits: Record<string, unknown>;
  };
  teams: Array<{
    teamId: string;
    teamCode: string;
    teamName: string;
    isLead: boolean;
  }>;
  managerAdminId?: string | null;
  subordinateAdminIds: string[];
};

type RolePreview = {
  grantable: boolean;
  reason?: string | null;
  primaryRole: AdminRole;
  roles: AdminRole[];
  permissionCodes: string[];
  modules: string[];
  permissionCount: number;
};

type CurrentAdmin = { permissions?: string[] };
type Workspace = 'roles' | 'teams' | 'effective' | 'overrides';
type Notice = { tone: 'neutral' | 'success' | 'warning' | 'danger'; text: string };

const EMPTY_OVERVIEW: AccessOverview = {
  summary: {
    roleCount: 0,
    permissionCount: 0,
    adminUserCount: 0,
    wildcardRoleCount: 0,
  },
  roles: [],
  permissions: [],
  adminUsers: [],
};

const WORKSPACES: Array<{ id: Workspace; th: string; en: string }> = [
  { id: 'roles', th: 'บทบาท', en: 'Roles' },
  { id: 'teams', th: 'ทีมและสายงาน', en: 'Teams & reporting' },
  { id: 'effective', th: 'สิทธิ์ที่มีผลจริง', en: 'Effective access' },
  { id: 'overrides', th: 'ขอบเขตและ Overrides', en: 'Scope & overrides' },
];

export default function AdminRolesPage() {
  const [locale] = useAdminLocale();
  const th = locale === 'th';
  const [workspace, setWorkspace] = useState<Workspace>('roles');
  const [overview, setOverview] = useState<AccessOverview>(EMPTY_OVERVIEW);
  const [teamOverview, setTeamOverview] = useState<TeamOverview>({
    teams: [],
    reportingLines: [],
  });
  const [heldPermissions, setHeldPermissions] = useState<string[]>(['admin.access.view']);
  const [selectedAdminId, setSelectedAdminId] = useState('');
  const [effective, setEffective] = useState<EffectiveAccess | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [primaryRoleId, setPrimaryRoleId] = useState('');
  const [roleReason, setRoleReason] = useState('');
  const [rolePreview, setRolePreview] = useState<RolePreview | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamManagerId, setTeamManagerId] = useState('');
  const [teamParentId, setTeamParentId] = useState('');
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
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);

  const has = (permission: string) =>
    heldPermissions.includes('*') || heldPermissions.includes(permission);
  const canManageRoles = has('admin.access.manage');
  const canManageTeams = has('admin.teams.manage');
  const canManageSubordinates = has('admin.subordinates.manage');
  const canOverride = has('admin.permissions.override');

  const selectedAdmin =
    overview.adminUsers.find((admin) => admin.id === selectedAdminId) ?? null;
  const selectedTeam =
    teamOverview.teams.find((team) => team.id === selectedTeamId) ?? null;

  const normalizedQuery = query.trim().toLowerCase();
  const visibleRoles = useMemo(
    () =>
      overview.roles.filter((role) =>
        normalizedQuery
          ? [
              role.name,
              role.code,
              role.description ?? '',
              ...role.permissions.flatMap((permission) => [
                permission.code,
                permission.name,
                permission.module,
              ]),
            ].some((value) => value.toLowerCase().includes(normalizedQuery))
          : true,
      ),
    [overview.roles, normalizedQuery],
  );

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    if (!selectedAdmin) {
      setSelectedRoleIds([]);
      setPrimaryRoleId('');
      setEffective(null);
      return;
    }
    setSelectedRoleIds(selectedAdmin.roles.map((role) => role.id));
    setPrimaryRoleId(selectedAdmin.roles[0]?.id ?? '');
    setRolePreview(null);
    void loadEffective(selectedAdmin.id);
  }, [selectedAdminId]);

  async function loadAll() {
    setLoading(true);
    setNotice(null);
    try {
      const [overviewResponse, teamsResponse, currentResponse] = await Promise.all([
        adminApiFetch('/admin/access/overview'),
        adminApiFetch('/admin/access/teams'),
        adminApiFetch('/admin/auth/me'),
      ]);
      const [overviewPayload, teamsPayload, currentPayload]: [unknown, unknown, unknown] =
        await Promise.all([
          overviewResponse.json().catch(() => null),
          teamsResponse.json().catch(() => null),
          currentResponse.json().catch(() => null),
        ]);
      if (!overviewResponse.ok || !isAccessOverview(overviewPayload)) {
        throw new Error('Invalid access overview');
      }
      setOverview(overviewPayload);
      setTeamOverview(
        teamsResponse.ok && isTeamOverview(teamsPayload)
          ? teamsPayload
          : { teams: [], reportingLines: [] },
      );
      setHeldPermissions(
        currentResponse.ok && isCurrentAdmin(currentPayload)
          ? currentPayload.permissions ?? []
          : ['admin.access.view'],
      );
      const nextAdminId = selectedAdminId || overviewPayload.adminUsers[0]?.id || '';
      setSelectedAdminId(nextAdminId);
      if (!selectedTeamId && isTeamOverview(teamsPayload)) {
        setSelectedTeamId(teamsPayload.teams[0]?.id ?? '');
      }
    } catch {
      setNotice({
        tone: 'danger',
        text: th
          ? 'โหลดข้อมูลบทบาท ทีม และสิทธิ์ไม่สำเร็จ'
          : 'Unable to load role, team, and access governance data.',
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadEffective(adminUserId: string) {
    setBusy('effective');
    try {
      const response = await adminApiFetch(
        `/admin/access/admin-users/${adminUserId}/effective-access`,
      );
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok || !isEffectiveAccess(payload)) {
        throw new Error('Invalid effective access');
      }
      setEffective(payload);
      const primary =
        payload.roles.find((role) => role.code === payload.admin.position) ??
        payload.roles[0];
      setPrimaryRoleId(primary?.id ?? '');
      setReportingManagerId(payload.managerAdminId ?? '');
      setScopeJson(JSON.stringify(payload.profile.scope ?? {}, null, 2));
      setLimitsJson(JSON.stringify(payload.profile.approvalLimits ?? {}, null, 2));
    } catch {
      setEffective(null);
      setNotice({
        tone: 'warning',
        text: th ? 'โหลดสิทธิ์ที่มีผลจริงไม่สำเร็จ' : 'Unable to load effective access.',
      });
    } finally {
      setBusy('');
    }
  }

  function toggleRole(roleId: string) {
    if (!canManageRoles || selectedAdmin?.protected || busy) return;
    setRolePreview(null);
    setSelectedRoleIds((current) => {
      if (current.includes(roleId)) return current.filter((id) => id !== roleId);
      return current.length >= 8 ? current : [...current, roleId];
    });
  }

  async function previewRoles(): Promise<RolePreview | null> {
    if (!selectedAdmin || selectedRoleIds.length === 0) {
      setNotice({
        tone: 'danger',
        text: th ? 'เลือกอย่างน้อยหนึ่งบทบาท' : 'Select at least one role.',
      });
      return null;
    }
    if (!primaryRoleId || !selectedRoleIds.includes(primaryRoleId)) {
      setNotice({
        tone: 'danger',
        text: th
          ? 'เลือกบทบาทหลักจากรายการที่เลือก'
          : 'Choose a primary role from the selected roles.',
      });
      return null;
    }

    setBusy('preview');
    try {
      const response = await adminApiFetch('/admin/access/role-preview', {
        method: 'POST',
        body: JSON.stringify({ roleIds: selectedRoleIds, primaryRoleId }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok || !isRolePreview(payload)) throw new Error('Invalid preview');
      setRolePreview(payload);
      setNotice({
        tone: payload.grantable ? 'success' : 'danger',
        text: payload.grantable
          ? th
            ? 'ตรวจแล้ว สามารถบันทึกบทบาทชุดนี้ได้'
            : 'This role selection can be granted.'
          : payload.reason ||
            (th ? 'ไม่สามารถมอบบทบาทชุดนี้ได้' : 'This role selection cannot be granted.'),
      });
      return payload;
    } catch {
      setRolePreview(null);
      setNotice({
        tone: 'danger',
        text: th ? 'ตรวจสิทธิ์บทบาทไม่สำเร็จ' : 'Role preview failed.',
      });
      return null;
    } finally {
      setBusy('');
    }
  }

  async function saveRoles() {
    if (!selectedAdmin || !canManageRoles || selectedAdmin.protected) return;
    if (roleReason.trim().length < 5) {
      setNotice({
        tone: 'danger',
        text: th
          ? 'ระบุเหตุผลอย่างน้อย 5 ตัวอักษร'
          : 'Provide a reason of at least 5 characters.',
      });
      return;
    }
    const checkedPreview = rolePreview?.grantable ? rolePreview : await previewRoles();
    if (!checkedPreview?.grantable) return;

    setBusy('roles');
    try {
      const response = await adminApiFetch(
        `/admin/access/admin-users/${selectedAdmin.id}/roles`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            roleIds: selectedRoleIds,
            primaryRoleId,
            reason: roleReason.trim(),
          }),
        },
      );
      if (!response.ok) throw new Error('Unable to sync roles');
      setRoleReason('');
      setRolePreview(null);
      setNotice({
        tone: 'success',
        text: th
          ? 'บันทึกบทบาทและเพิกถอนเซสชันเดิมแล้ว'
          : 'Roles saved and prior sessions revoked.',
      });
      await loadAll();
      await loadEffective(selectedAdmin.id);
    } catch {
      setNotice({
        tone: 'danger',
        text: th ? 'บันทึกบทบาทไม่สำเร็จ' : 'Unable to save roles.',
      });
    } finally {
      setBusy('');
    }
  }

  async function createTeam() {
    if (!canManageTeams) return;
    if (!/^[a-z0-9][a-z0-9_-]{1,79}$/.test(teamCode) || !teamName.trim()) {
      setNotice({
        tone: 'danger',
        text: th ? 'กรอกรหัสและชื่อทีมให้ถูกต้อง' : 'Enter a valid team code and name.',
      });
      return;
    }
    setBusy('team:create');
    try {
      const response = await adminApiFetch('/admin/access/teams', {
        method: 'POST',
        body: JSON.stringify({
          code: teamCode,
          name: teamName.trim(),
          managerAdminId: teamManagerId || undefined,
          parentTeamId: teamParentId || undefined,
        }),
      });
      if (!response.ok) throw new Error('Unable to create team');
      setTeamCode('');
      setTeamName('');
      setTeamManagerId('');
      setTeamParentId('');
      setNotice({ tone: 'success', text: th ? 'สร้างทีมแล้ว' : 'Team created.' });
      await loadAll();
    } catch {
      setNotice({
        tone: 'danger',
        text: th ? 'สร้างทีมไม่สำเร็จ' : 'Unable to create team.',
      });
    } finally {
      setBusy('');
    }
  }

  async function addTeamMember() {
    if (!canManageTeams || !selectedTeam || !teamMemberId) return;
    setBusy('team:member');
    try {
      const response = await adminApiFetch(
        `/admin/access/teams/${selectedTeam.id}/members`,
        {
          method: 'POST',
          body: JSON.stringify({ adminUserId: teamMemberId, isLead: teamLead }),
        },
      );
      if (!response.ok) throw new Error('Unable to add member');
      setTeamMemberId('');
      setTeamLead(false);
      setNotice({
        tone: 'success',
        text: th ? 'เพิ่มสมาชิกทีมแล้ว' : 'Team member added.',
      });
      await loadAll();
      if (selectedAdminId) await loadEffective(selectedAdminId);
    } catch {
      setNotice({
        tone: 'danger',
        text: th ? 'เพิ่มสมาชิกทีมไม่สำเร็จ' : 'Unable to add team member.',
      });
    } finally {
      setBusy('');
    }
  }

  async function saveReportingLine() {
    if (!canManageSubordinates || !selectedAdmin) return;
    setBusy('reporting');
    try {
      const response = await adminApiFetch(
        `/admin/access/admin-users/${selectedAdmin.id}/reporting-line`,
        {
          method: 'PATCH',
          body: JSON.stringify({ managerAdminId: reportingManagerId || null }),
        },
      );
      if (!response.ok) throw new Error('Unable to update reporting line');
      setNotice({
        tone: 'success',
        text: th ? 'อัปเดตสายบังคับบัญชาแล้ว' : 'Reporting line updated.',
      });
      await loadAll();
      await loadEffective(selectedAdmin.id);
    } catch {
      setNotice({
        tone: 'danger',
        text: th
          ? 'อัปเดตสายบังคับบัญชาไม่สำเร็จ'
          : 'Unable to update reporting line.',
      });
    } finally {
      setBusy('');
    }
  }

  async function saveOverride() {
    if (!canOverride || !selectedAdmin) return;
    if (!overrideCode.trim() || overrideReason.trim().length < 5) {
      setNotice({
        tone: 'danger',
        text: th
          ? 'ระบุรหัสสิทธิ์และเหตุผลอย่างน้อย 5 ตัวอักษร'
          : 'Provide a permission code and an audited reason.',
      });
      return;
    }
    setBusy('override');
    try {
      const response = await adminApiFetch(
        `/admin/access/admin-users/${selectedAdmin.id}/permission-overrides`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            permissionCode: overrideCode.trim(),
            effect: overrideEffect,
            reason: overrideReason.trim(),
            expiresAt: overrideExpiresAt || undefined,
          }),
        },
      );
      if (!response.ok) throw new Error('Unable to save override');
      setOverrideCode('');
      setOverrideReason('');
      setOverrideExpiresAt('');
      setNotice({
        tone: 'success',
        text: th
          ? 'บันทึก Override แล้ว โดย DENY ชนะ ALLOW และ Role เสมอ'
          : 'Override saved. DENY always wins over ALLOW and role access.',
      });
      await loadEffective(selectedAdmin.id);
    } catch {
      setNotice({
        tone: 'danger',
        text: th ? 'บันทึก Override ไม่สำเร็จ' : 'Unable to save override.',
      });
    } finally {
      setBusy('');
    }
  }

  async function saveProfile() {
    if (!canManageRoles || !selectedAdmin) return;
    if (profileReason.trim().length < 5) {
      setNotice({
        tone: 'danger',
        text: th
          ? 'ระบุเหตุผลอย่างน้อย 5 ตัวอักษร'
          : 'Provide a reason of at least 5 characters.',
      });
      return;
    }
    try {
      const scope = parseJsonObject(scopeJson);
      const approvalLimits = parseJsonObject(limitsJson);
      setBusy('profile');
      const response = await adminApiFetch(
        `/admin/access/admin-users/${selectedAdmin.id}/access-profile`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            scope,
            approvalLimits,
            reason: profileReason.trim(),
          }),
        },
      );
      if (!response.ok) throw new Error('Unable to save profile');
      setProfileReason('');
      setNotice({
        tone: 'success',
        text: th
          ? 'บันทึกขอบเขตและวงเงินอนุมัติแล้ว'
          : 'Scope and approval limits saved.',
      });
      await loadEffective(selectedAdmin.id);
    } catch {
      setNotice({
        tone: 'danger',
        text: th
          ? 'JSON ไม่ถูกต้องหรือบันทึกโปรไฟล์ไม่สำเร็จ'
          : 'Invalid JSON or unable to save the access profile.',
      });
    } finally {
      setBusy('');
    }
  }

  return (
    <AdminPage
      eyebrow={th ? 'สิทธิ์และความปลอดภัย' : 'Access & security'}
      title={th ? 'บทบาท ทีม และสิทธิ์ที่มีผลจริง' : 'Roles, teams, and effective access'}
      description={
        th
          ? 'จัดการหลายบทบาท สายบังคับบัญชา ขอบเขต และ DENY-first overrides โดยมี Audit ทุก mutation'
          : 'Manage multi-role access, reporting lines, scopes, and DENY-first overrides with audited mutations.'
      }
      actions={
        <AdminButton onClick={() => void loadAll()} disabled={loading || Boolean(busy)}>
          {th ? 'รีเฟรช' : 'Refresh'}
        </AdminButton>
      }
    >
      <AdminWorkspaceTabs
        ariaLabel={th ? 'เมนูสิทธิ์และความปลอดภัย' : 'Access and security navigation'}
        activeId="roles"
        tabs={accessTabs(locale).filter((tab) => canAccessPath(tab.href, heldPermissions))}
      />

      <div className={styles.page}>
        {notice && <AdminNotice tone={notice.tone}>{notice.text}</AdminNotice>}
        <AdminMetricGrid>
          <AdminMetric title={th ? 'บทบาท' : 'Roles'} value={overview.summary.roleCount} />
          <AdminMetric
            title={th ? 'ผู้ดูแล' : 'Administrators'}
            value={overview.summary.adminUserCount}
          />
          <AdminMetric title={th ? 'ทีม' : 'Teams'} value={teamOverview.teams.length} />
          <AdminMetric
            title={th ? 'สิทธิ์ DENY' : 'Denied permissions'}
            value={effective?.deniedPermissions.length ?? 0}
            tone="warning"
          />
        </AdminMetricGrid>

        <div className={styles.selectorBar}>
          <label>
            <span>{th ? 'ผู้ดูแลระบบ' : 'Administrator'}</span>
            <select value={selectedAdminId} onChange={(event) => setSelectedAdminId(event.target.value)}>
              <option value="">{th ? 'เลือกผู้ดูแล' : 'Select an administrator'}</option>
              {overview.adminUsers.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.username} · {admin.email}
                </option>
              ))}
            </select>
          </label>
          <div className={styles.workspaceSwitch} role="tablist">
            {WORKSPACES.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={workspace === item.id}
                className={workspace === item.id ? styles.workspaceActive : undefined}
                onClick={() => setWorkspace(item.id)}
              >
                {th ? item.th : item.en}
              </button>
            ))}
          </div>
        </div>

        {workspace === 'roles' && (
          <section className={styles.twoColumn}>
            <AdminCard
              title={th ? 'เลือกหลายบทบาท' : 'Multi-role assignment'}
              description={
                th
                  ? 'เลือกได้สูงสุด 8 บทบาท และกำหนดบทบาทหลักหนึ่งรายการ'
                  : 'Select a maximum of 8 roles and one primary role.'
              }
            >
              <label className={styles.searchField}>
                <span>{th ? 'ค้นหาบทบาทหรือสิทธิ์' : 'Search roles or permissions'}</span>
                <input value={query} onChange={(event) => setQuery(event.target.value)} />
              </label>
              <div className={styles.roleGrid}>
                {visibleRoles.map((role) => {
                  const checked = selectedRoleIds.includes(role.id);
                  return (
                    <label key={role.id} className={checked ? styles.roleSelected : styles.roleCard}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!canManageRoles || selectedAdmin?.protected || Boolean(busy)}
                        onChange={() => toggleRole(role.id)}
                      />
                      <span>
                        <strong>{role.name}</strong>
                        <small>{role.code} · {role.permissionCount} permissions</small>
                      </span>
                      {role.hasWildcard && <AdminBadge tone="warning">*</AdminBadge>}
                    </label>
                  );
                })}
              </div>
              {visibleRoles.length === 0 && <AdminEmpty>{th ? 'ไม่พบบทบาท' : 'No roles found.'}</AdminEmpty>}
            </AdminCard>

            <AdminCard
              title={th ? 'ตรวจและบันทึก' : 'Preview and save'}
              description={
                selectedAdmin?.protected
                  ? th
                    ? 'บัญชี Owner/Super Admin ถูกป้องกันจาก workflow นี้'
                    : 'Owner and Super Admin accounts are protected from this workflow.'
                  : th
                    ? 'ระบบจะตรวจ privilege escalation ก่อนบันทึกทุกครั้ง'
                    : 'Privilege escalation is evaluated before every save.'
              }
            >
              <div className={styles.formStack}>
                <label>
                  <span>{th ? 'บทบาทหลัก' : 'Primary role'}</span>
                  <select
                    value={primaryRoleId}
                    onChange={(event) => {
                      setPrimaryRoleId(event.target.value);
                      setRolePreview(null);
                    }}
                  >
                    <option value="">{th ? 'เลือกบทบาทหลัก' : 'Select primary role'}</option>
                    {overview.roles
                      .filter((role) => selectedRoleIds.includes(role.id))
                      .map((role) => (
                        <option key={role.id} value={role.id}>{role.name}</option>
                      ))}
                  </select>
                </label>
                <label>
                  <span>{th ? 'เหตุผล' : 'Audited reason'}</span>
                  <textarea value={roleReason} onChange={(event) => setRoleReason(event.target.value)} />
                </label>
                {rolePreview && (
                  <AdminNotice tone={rolePreview.grantable ? 'success' : 'danger'}>
                    {rolePreview.grantable
                      ? `${rolePreview.permissionCount} permissions · ${rolePreview.modules.join(', ')}`
                      : rolePreview.reason || 'Denied'}
                  </AdminNotice>
                )}
                <div className={styles.actions}>
                  <AdminButton tone="secondary" onClick={() => void previewRoles()} disabled={Boolean(busy)}>
                    {th ? 'ตรวจสิทธิ์' : 'Preview'}
                  </AdminButton>
                  <AdminButton onClick={() => void saveRoles()} disabled={Boolean(busy) || !canManageRoles}>
                    {th ? 'บันทึกบทบาท' : 'Save roles'}
                  </AdminButton>
                </div>
              </div>
            </AdminCard>
          </section>
        )}

        {workspace === 'teams' && (
          <section className={styles.twoColumn}>
            <AdminCard title={th ? 'โครงสร้างทีม' : 'Team hierarchy'}>
              <div className={styles.teamList}>
                {teamOverview.teams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    className={selectedTeamId === team.id ? styles.teamActive : styles.teamButton}
                    onClick={() => setSelectedTeamId(team.id)}
                  >
                    <span><strong>{team.name}</strong><small>{team.code}</small></span>
                    <AdminBadge>{team.memberCount}</AdminBadge>
                  </button>
                ))}
                {teamOverview.teams.length === 0 && <AdminEmpty>{th ? 'ยังไม่มีทีม' : 'No teams yet.'}</AdminEmpty>}
              </div>
              {canManageTeams && (
                <div className={styles.formGrid}>
                  <label><span>{th ? 'รหัสทีม' : 'Team code'}</span><input value={teamCode} onChange={(event) => setTeamCode(event.target.value.toLowerCase())} /></label>
                  <label><span>{th ? 'ชื่อทีม' : 'Team name'}</span><input value={teamName} onChange={(event) => setTeamName(event.target.value)} /></label>
                  <label><span>{th ? 'ผู้จัดการ' : 'Manager'}</span><select value={teamManagerId} onChange={(event) => setTeamManagerId(event.target.value)}><option value="">{th ? 'ผู้สร้างทีม' : 'Current administrator'}</option>{overview.adminUsers.map((admin) => <option key={admin.id} value={admin.id}>{admin.username}</option>)}</select></label>
                  <label><span>{th ? 'ทีมแม่' : 'Parent team'}</span><select value={teamParentId} onChange={(event) => setTeamParentId(event.target.value)}><option value="">{th ? 'ไม่มี' : 'None'}</option>{teamOverview.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}</select></label>
                  <AdminButton onClick={() => void createTeam()} disabled={Boolean(busy)}>{th ? 'สร้างทีม' : 'Create team'}</AdminButton>
                </div>
              )}
            </AdminCard>

            <AdminCard title={selectedTeam?.name ?? (th ? 'สมาชิกและสายงาน' : 'Members & reporting')}>
              {selectedTeam ? (
                <>
                  <div className={styles.memberList}>
                    {selectedTeam.members.map((member) => (
                      <div key={member.adminUserId}>
                        <span><strong>{member.username}</strong><small>{member.email}</small></span>
                        {member.isLead && <AdminBadge tone="success">Lead</AdminBadge>}
                      </div>
                    ))}
                    {selectedTeam.members.length === 0 && <AdminEmpty>{th ? 'ยังไม่มีสมาชิก' : 'No members.'}</AdminEmpty>}
                  </div>
                  {canManageTeams && (
                    <div className={styles.formStack}>
                      <label><span>{th ? 'สมาชิก' : 'Member'}</span><select value={teamMemberId} onChange={(event) => setTeamMemberId(event.target.value)}><option value="">{th ? 'เลือกผู้ดูแล' : 'Select administrator'}</option>{overview.adminUsers.map((admin) => <option key={admin.id} value={admin.id}>{admin.username}</option>)}</select></label>
                      <label className={styles.inlineCheck}><input type="checkbox" checked={teamLead} onChange={(event) => setTeamLead(event.target.checked)} /><span>{th ? 'หัวหน้าทีม' : 'Team lead'}</span></label>
                      <AdminButton onClick={() => void addTeamMember()} disabled={Boolean(busy)}>{th ? 'เพิ่มสมาชิก' : 'Add member'}</AdminButton>
                    </div>
                  )}
                </>
              ) : <AdminEmpty>{th ? 'เลือกทีม' : 'Select a team.'}</AdminEmpty>}

              {selectedAdmin && canManageSubordinates && (
                <div className={styles.reportingBox}>
                  <label><span>{th ? 'ผู้บังคับบัญชาของผู้ดูแลที่เลือก' : 'Manager of selected administrator'}</span><select value={reportingManagerId} onChange={(event) => setReportingManagerId(event.target.value)}><option value="">{th ? 'ไม่มี' : 'None'}</option>{overview.adminUsers.filter((admin) => admin.id !== selectedAdmin.id).map((admin) => <option key={admin.id} value={admin.id}>{admin.username}</option>)}</select></label>
                  <AdminButton tone="secondary" onClick={() => void saveReportingLine()} disabled={Boolean(busy)}>{th ? 'บันทึกสายงาน' : 'Save reporting line'}</AdminButton>
                </div>
              )}
            </AdminCard>
          </section>
        )}

        {workspace === 'effective' && (
          <section className={styles.twoColumn}>
            <AdminCard title={th ? 'สิทธิ์ที่อนุญาต' : 'Allowed access'}>
              {effective ? (
                <div className={styles.permissionCloud}>
                  {effective.permissions.map((permission) => <AdminBadge key={permission}>{permission}</AdminBadge>)}
                  {effective.permissions.length === 0 && <AdminEmpty>{th ? 'ไม่มีสิทธิ์ที่อนุญาต' : 'No allowed permissions.'}</AdminEmpty>}
                </div>
              ) : <AdminEmpty>{busy === 'effective' ? (th ? 'กำลังโหลด...' : 'Loading...') : (th ? 'เลือกผู้ดูแล' : 'Select an administrator.')}</AdminEmpty>}
            </AdminCard>
            <AdminCard title={th ? 'DENY ชนะเสมอ' : 'DENY always wins'} description={th ? 'DENY ชนะ Role, Delegation, ALLOW และ Wildcard' : 'DENY always wins over role, delegation, ALLOW, and wildcard access.'}>
              <div className={styles.permissionCloud}>
                {effective?.deniedPermissions.map((permission) => <AdminBadge key={permission} tone="danger">{permission}</AdminBadge>)}
                {!effective?.deniedPermissions.length && <AdminEmpty>{th ? 'ไม่มีสิทธิ์ที่ถูกปฏิเสธ' : 'No denied permissions.'}</AdminEmpty>}
              </div>
              {effective && (
                <dl className={styles.definitionGrid}>
                  <div><dt>{th ? 'บทบาท' : 'Roles'}</dt><dd>{effective.roles.map((role) => role.name).join(', ') || '-'}</dd></div>
                  <div><dt>{th ? 'ทีม' : 'Teams'}</dt><dd>{effective.teams.map((team) => team.teamName).join(', ') || '-'}</dd></div>
                  <div><dt>{th ? 'ผู้บังคับบัญชา' : 'Manager'}</dt><dd>{overview.adminUsers.find((admin) => admin.id === effective.managerAdminId)?.username ?? '-'}</dd></div>
                  <div><dt>{th ? 'ผู้ใต้บังคับบัญชา' : 'Subordinates'}</dt><dd>{effective.subordinateAdminIds.length}</dd></div>
                </dl>
              )}
            </AdminCard>
          </section>
        )}

        {workspace === 'overrides' && (
          <section className={styles.twoColumn}>
            <AdminCard title={th ? 'Permission Override' : 'Permission override'} description={th ? 'ใช้ DENY เป็นค่าเริ่มต้นสำหรับการลดสิทธิ์ชั่วคราว' : 'Use DENY by default for temporary access reduction.'}>
              <div className={styles.formStack}>
                <label><span>{th ? 'รหัสสิทธิ์' : 'Permission code'}</span><input value={overrideCode} onChange={(event) => setOverrideCode(event.target.value)} list="permission-codes" /></label>
                <datalist id="permission-codes">{overview.permissions.map((permission) => <option key={permission.id} value={permission.code} />)}</datalist>
                <label><span>{th ? 'ผล' : 'Effect'}</span><select value={overrideEffect} onChange={(event) => setOverrideEffect(event.target.value as 'ALLOW' | 'DENY')}><option value="DENY">DENY</option><option value="ALLOW">ALLOW</option></select></label>
                <label><span>{th ? 'หมดอายุ' : 'Expires at'}</span><input type="datetime-local" value={overrideExpiresAt} onChange={(event) => setOverrideExpiresAt(event.target.value)} /></label>
                <label><span>{th ? 'เหตุผล Audit' : 'Audited reason'}</span><textarea value={overrideReason} onChange={(event) => setOverrideReason(event.target.value)} /></label>
                <AdminButton onClick={() => void saveOverride()} disabled={Boolean(busy) || !canOverride}>{th ? 'บันทึก Override' : 'Save override'}</AdminButton>
                <div className={styles.overrideList}>{effective?.overrides.map((override) => <div key={override.id}><AdminBadge tone={override.effect === 'DENY' ? 'danger' : 'success'}>{override.effect}</AdminBadge><span><strong>{override.permissionCode}</strong><small>{override.reason}</small></span></div>)}</div>
              </div>
            </AdminCard>

            <AdminCard title={th ? 'Scope และ Approval Limits' : 'Scope and approval limits'}>
              <div className={styles.formStack}>
                <label><span>Scope JSON</span><textarea className={styles.codeArea} value={scopeJson} onChange={(event) => setScopeJson(event.target.value)} /></label>
                <label><span>Approval Limits JSON</span><textarea className={styles.codeArea} value={limitsJson} onChange={(event) => setLimitsJson(event.target.value)} /></label>
                <label><span>{th ? 'เหตุผล Audit' : 'Audited reason'}</span><textarea value={profileReason} onChange={(event) => setProfileReason(event.target.value)} /></label>
                <AdminButton onClick={() => void saveProfile()} disabled={Boolean(busy) || !canManageRoles}>{th ? 'บันทึกโปรไฟล์สิทธิ์' : 'Save access profile'}</AdminButton>
              </div>
            </AdminCard>
          </section>
        )}
      </div>
    </AdminPage>
  );
}

function parseJsonObject(value: string) {
  const parsed: unknown = JSON.parse(value);
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new Error('JSON value must be an object');
  }
  return parsed as Record<string, unknown>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isAccessOverview(value: unknown): value is AccessOverview {
  if (!isRecord(value) || !isRecord(value.summary)) return false;
  return Array.isArray(value.roles) && Array.isArray(value.permissions) && Array.isArray(value.adminUsers);
}

function isTeamOverview(value: unknown): value is TeamOverview {
  return isRecord(value) && Array.isArray(value.teams) && Array.isArray(value.reportingLines);
}

function isCurrentAdmin(value: unknown): value is CurrentAdmin {
  return isRecord(value) && (value.permissions === undefined || Array.isArray(value.permissions));
}

function isEffectiveAccess(value: unknown): value is EffectiveAccess {
  return (
    isRecord(value) &&
    isRecord(value.admin) &&
    Array.isArray(value.roles) &&
    Array.isArray(value.permissions) &&
    Array.isArray(value.deniedPermissions) &&
    Array.isArray(value.overrides) &&
    isRecord(value.profile) &&
    Array.isArray(value.teams) &&
    Array.isArray(value.subordinateAdminIds)
  );
}

function isRolePreview(value: unknown): value is RolePreview {
  return (
    isRecord(value) &&
    typeof value.grantable === 'boolean' &&
    isRecord(value.primaryRole) &&
    Array.isArray(value.roles) &&
    Array.isArray(value.permissionCodes) &&
    Array.isArray(value.modules) &&
    typeof value.permissionCount === 'number'
  );
}

function accessTabs(locale: AdminLocale) {
  const th = locale === 'th';
  return [
    { id: 'overview', label: th ? 'ภาพรวมสิทธิ์' : 'Access overview', href: '/access', permission: 'admin.access.view' },
    { id: 'roles', label: th ? 'บทบาทและทีม' : 'Roles & teams', href: '/admin-roles', permission: 'admin.access.view' },
    { id: 'accounts', label: th ? 'บัญชีผู้ดูแล' : 'Admin accounts', href: '/admin-accounts', permission: 'admin.access.view' },
    { id: 'sessions', label: th ? 'เซสชัน' : 'Sessions', href: '/admin-sessions', permission: 'admin.access.view' },
    { id: 'activity', label: th ? 'กิจกรรม' : 'Activity', href: '/admin-activity', permission: 'admin.activity.view' },
  ];
}
