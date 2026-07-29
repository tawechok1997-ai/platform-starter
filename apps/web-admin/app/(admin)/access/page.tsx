'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import {
  AdminBadge,
  AdminButton,
  AdminCard,
  AdminCode,
  AdminConfirmDialog,
  AdminEmpty,
  AdminFilterBar,
  AdminGrid,
  AdminMetric,
  AdminMetricGrid,
  AdminNotice,
  AdminPage,
  AdminPagination,
  AdminSectionRow,
  AdminSkeleton,
  AdminStack,
} from '../_components/admin-ui';
import AdminInvitationList from './admin-invitation-list';
import InviteAdminPanel from './invite-admin-panel';
import styles from './access-overview.module.css';

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
type NoticeState = { text: string; tone: 'neutral' | 'success' | 'warning' | 'danger'; retry?: boolean };
type LoadResult = { overviewOk: boolean; profileOk: boolean; delegationsOk: boolean };
type FetchResult = { ok: boolean; payload: unknown };

const PAGE_SIZES = [25, 50, 100] as const;

export default function AccessOverviewPage() {
  const requestSequence = useRef(0);
  const dataRef = useRef<AccessResponse | null>(null);
  const noticeRef = useRef<NoticeState | null>(null);
  const [data, setData] = useState<AccessResponse | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [permissionQuery, setPermissionQuery] = useState('');
  const [permissionPage, setPermissionPage] = useState(1);
  const [permissionPageSize, setPermissionPageSize] = useState(25);
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

  const updateNotice = useCallback((next: NoticeState | null) => {
    noticeRef.current = next;
    setNotice(next);
  }, []);

  const load = useCallback(async (announce = true): Promise<LoadResult> => {
    const requestId = ++requestSequence.current;
    setLoading(true);

    const [overviewResult, profileResult, delegationResult] = await Promise.all([
      fetchAdminPayload('/admin/access/overview'),
      fetchAdminPayload('/admin/auth/me'),
      fetchAdminPayload('/admin/access/delegations'),
    ]);

    if (requestId !== requestSequence.current) {
      return { overviewOk: false, profileOk: false, delegationsOk: false };
    }

    const overview = overviewResult.ok && isAccessResponse(overviewResult.payload) ? overviewResult.payload : null;
    const profile = profileResult.ok && isRecord(profileResult.payload) ? profileResult.payload : null;
    const delegationItems = delegationResult.ok && Array.isArray(delegationResult.payload)
      ? delegationResult.payload.filter(isDelegation)
      : null;
    const overviewOk = overview !== null;
    const profileOk = profile !== null;
    const delegationsOk = delegationItems !== null;

    if (overview) {
      dataRef.current = overview;
      setData(overview);
    }
    if (profile) {
      setCurrentAdminId(typeof profile.id === 'string' ? profile.id : '');
      setPermissionsHeld(Array.isArray(profile.permissions)
        ? profile.permissions.filter((item): item is string => typeof item === 'string')
        : []);
    }
    if (delegationItems) {
      setDelegations(delegationItems);
    }

    if (announce) {
      if (!overviewOk) {
        updateNotice({
          text: dataRef.current ? 'รีเฟรชข้อมูลสิทธิ์ไม่สำเร็จ ข้อมูลเดิมยังแสดงอยู่' : 'โหลดข้อมูลสิทธิ์ไม่สำเร็จ กรุณาลองใหม่',
          tone: 'danger',
          retry: true,
        });
      } else if (!profileOk || !delegationsOk) {
        updateNotice({ text: 'โหลดข้อมูลหลักแล้ว แต่ข้อมูลความปลอดภัยบางส่วนไม่ครบ กรุณารีเฟรชอีกครั้ง', tone: 'warning', retry: true });
      } else if (noticeRef.current?.tone !== 'success') {
        updateNotice(null);
      }
    }

    setLoading(false);
    return { overviewOk, profileOk, delegationsOk };
  }, [updateNotice]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => { setPermissionPage(1); }, [permissionQuery, moduleFilter, permissionPageSize]);

  const canManage = permissionsHeld.includes('*') || permissionsHeld.includes('admin.access.manage');
  const canInvite = permissionsHeld.includes('*') || permissionsHeld.includes('admin.create');
  const canDelegate = permissionsHeld.includes('*') || permissionsHeld.includes('admin.access.delegate');
  const pageBusy = loading || Boolean(busyKey);

  async function handleInvitationCreated(): Promise<boolean> {
    const result = await load(false);
    return result.overviewOk && result.profileOk && result.delegationsOk;
  }

  async function createDelegation() {
    if (pageBusy || !canDelegate) return;
    const target = data?.adminUsers.find((user) => user.id === delegateAdminId);
    const permissionCodes = Array.from(new Set(delegationPermissionCodes.split(/[,\n ]+/).map((item) => item.trim()).filter(Boolean)));
    const hours = Number(delegationHours);
    const reason = delegationReason.trim();

    if (!target || target.status !== 'ACTIVE' || target.protected || target.id === currentAdminId) {
      updateNotice({ text: 'กรุณาเลือกผู้รับสิทธิ์ที่ใช้งานได้และไม่ใช่บัญชีของคุณ', tone: 'danger' });
      return;
    }
    if (permissionCodes.length === 0 || permissionCodes.length > 40) {
      updateNotice({ text: 'กรุณาระบุรหัสสิทธิ์ตั้งแต่ 1 ถึง 40 รายการ', tone: 'danger' });
      return;
    }
    if (!Number.isInteger(hours) || hours < 1 || hours > 168) {
      updateNotice({ text: 'ระยะเวลาต้องเป็นจำนวนเต็มระหว่าง 1 ถึง 168 ชั่วโมง', tone: 'danger' });
      return;
    }
    if (reason.length < 5) {
      updateNotice({ text: 'กรุณาระบุเหตุผลอย่างน้อย 5 ตัวอักษร', tone: 'danger' });
      return;
    }

    setBusyKey('delegation:create');
    updateNotice(null);
    try {
      const response = await adminApiFetch('/admin/access/delegations', {
        method: 'POST',
        body: JSON.stringify({ delegateAdminId, permissionCodes, expiresInHours: hours, reason }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isRecord(payload) || !isDelegation(payload.delegation)) throw new Error('create');
      const delegation = payload.delegation;
      setDelegations((current) => [delegation, ...current.filter((item) => item.id !== delegation.id)]);
      setDelegateAdminId('');
      setDelegationPermissionCodes('');
      setDelegationReason('');
      updateNotice({ text: 'มอบสิทธิ์ชั่วคราวแล้ว', tone: 'success' });
    } catch {
      updateNotice({ text: 'มอบสิทธิ์ชั่วคราวไม่สำเร็จ กรุณาลองใหม่', tone: 'danger' });
    } finally {
      setBusyKey('');
    }
  }

  function requestAssignRole(adminUser: AdminUser) {
    if (pageBusy || !canManage || adminUser.protected) return;
    const roleId = selectedRoles[adminUser.id];
    const role = data?.roles.find((item) => item.id === roleId);
    const reason = (roleReasons[adminUser.id] ?? '').trim();
    if (!roleId || !role) {
      updateNotice({ text: 'กรุณาเลือกบทบาทก่อน', tone: 'danger' });
      return;
    }
    if (adminUser.roles.some((item) => item.id === roleId)) {
      updateNotice({ text: 'ผู้ดูแลคนนี้มีบทบาทดังกล่าวอยู่แล้ว', tone: 'warning' });
      return;
    }
    if (reason.length < 5) {
      updateNotice({ text: 'กรุณาระบุเหตุผลอย่างน้อย 5 ตัวอักษร', tone: 'danger' });
      return;
    }
    setPendingAction({ type: 'assign-role', user: adminUser, role: { id: role.id, code: role.code }, reason });
  }

  function requestRemoveRole(adminUser: AdminUser, role: AdminRole) {
    if (pageBusy || !canManage || adminUser.protected) return;
    const reason = (roleReasons[adminUser.id] ?? '').trim();
    if (reason.length < 5) {
      updateNotice({ text: 'กรุณาระบุเหตุผลอย่างน้อย 5 ตัวอักษร', tone: 'danger' });
      return;
    }
    setPendingAction({ type: 'remove-role', user: adminUser, role: { id: role.id, code: role.code }, reason });
  }

  function requestRevokeDelegation(item: Delegation) {
    if (pageBusy || !canDelegate || item.status !== 'ACTIVE') return;
    const reason = (delegationRevokeReasons[item.id] ?? '').trim();
    if (reason.length < 5) {
      updateNotice({ text: 'กรุณาระบุเหตุผลยกเลิกอย่างน้อย 5 ตัวอักษร', tone: 'danger' });
      return;
    }
    setPendingAction({ type: 'revoke-delegation', delegation: item, reason });
  }

  async function executeAction() {
    if (!pendingAction || pageBusy) return;
    const action = pendingAction;
    const key = action.type === 'revoke-delegation' ? `delegation:${action.delegation.id}` : `${action.user.id}:${action.type}`;
    setBusyKey(key);
    updateNotice(null);

    try {
      if (action.type === 'assign-role') {
        const response = await adminApiFetch(`/admin/access/admin-users/${action.user.id}/roles`, {
          method: 'POST',
          body: JSON.stringify({ roleId: action.role.id, reason: action.reason }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !isAccessResponse(payload)) throw new Error('assign');
        dataRef.current = payload;
        setData(payload);
        setSelectedRoles((current) => ({ ...current, [action.user.id]: '' }));
        setRoleReasons((current) => ({ ...current, [action.user.id]: '' }));
        updateNotice({ text: 'เพิ่มบทบาทแล้ว', tone: 'success' });
      } else if (action.type === 'remove-role') {
        const response = await adminApiFetch(`/admin/access/admin-users/${action.user.id}/roles/${action.role.id}`, {
          method: 'DELETE',
          body: JSON.stringify({ reason: action.reason }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !isAccessResponse(payload)) throw new Error('remove');
        dataRef.current = payload;
        setData(payload);
        setRoleReasons((current) => ({ ...current, [action.user.id]: '' }));
        updateNotice({ text: 'ถอดบทบาทแล้ว', tone: 'success' });
      } else {
        const response = await adminApiFetch(`/admin/access/delegations/${action.delegation.id}/revoke`, {
          method: 'POST',
          body: JSON.stringify({ reason: action.reason }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok || !isRecord(payload) || !isDelegation(payload.delegation)) throw new Error('revoke');
        const delegation = payload.delegation;
        setDelegations((current) => current.map((item) => item.id === action.delegation.id ? delegation : item));
        setDelegationRevokeReasons((current) => ({ ...current, [action.delegation.id]: '' }));
        updateNotice({ text: 'ยกเลิกสิทธิ์ชั่วคราวแล้ว', tone: 'success' });
      }
      setPendingAction(null);
    } catch {
      updateNotice({
        text: action.type === 'assign-role'
          ? 'เพิ่มบทบาทไม่สำเร็จ กรุณาลองใหม่'
          : action.type === 'remove-role'
            ? 'ถอดบทบาทไม่สำเร็จ กรุณาลองใหม่'
            : 'ยกเลิกสิทธิ์ชั่วคราวไม่สำเร็จ กรุณาลองใหม่',
        tone: 'danger',
      });
    } finally {
      setBusyKey('');
    }
  }

  const modules = useMemo(
    () => ['ALL', ...Array.from(new Set((data?.permissions ?? []).map((item) => item.module))).sort()],
    [data],
  );
  const normalizedPermissionQuery = permissionQuery.trim().toLowerCase();
  const filteredPermissions = useMemo(() => (data?.permissions ?? []).filter((permission) => {
    const moduleMatches = moduleFilter === 'ALL' || permission.module === moduleFilter;
    const queryMatches = !normalizedPermissionQuery || [permission.code, permission.name, permission.module, permission.description ?? '']
      .some((value) => value.toLowerCase().includes(normalizedPermissionQuery));
    return moduleMatches && queryMatches;
  }), [data, moduleFilter, normalizedPermissionQuery]);
  const permissionTotalPages = Math.max(1, Math.ceil(filteredPermissions.length / permissionPageSize));
  const safePermissionPage = Math.min(permissionPage, permissionTotalPages);
  const visiblePermissions = useMemo(
    () => filteredPermissions.slice((safePermissionPage - 1) * permissionPageSize, safePermissionPage * permissionPageSize),
    [filteredPermissions, permissionPageSize, safePermissionPage],
  );
  const confirmation = pendingAction ? confirmationFor(pendingAction) : null;
  const initialLoading = loading && !data && !notice;

  return <AdminPage
    eyebrow="สิทธิ์และความปลอดภัย"
    title="ควบคุมสิทธิ์ผู้ดูแล"
    description="ตรวจบทบาท บัญชีผู้ดูแล และสิทธิ์ชั่วคราวจากจุดเดียว"
    actions={<AdminButton tone="secondary" disabled={pageBusy} onClick={() => void load()}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton>}
  >
    {notice && <AdminNotice tone={notice.tone}>
      <div className={styles.noticeRow}>
        <span>{notice.text}</span>
        {notice.retry && <div className={styles.noticeActions}><AdminButton size="compact" tone="secondary" disabled={pageBusy} onClick={() => void load()}>ลองใหม่</AdminButton></div>}
      </div>
    </AdminNotice>}

    {initialLoading && <AdminCard title="กำลังโหลดข้อมูลสิทธิ์" description="กำลังตรวจบทบาท บัญชีผู้ดูแล และสิทธิ์ชั่วคราว"><AdminSkeleton lines={8} /></AdminCard>}

    {!initialLoading && !data && <AdminCard title="ยังแสดงข้อมูลไม่ได้" description="ระบบไม่สามารถโหลดข้อมูลสิทธิ์หลักได้" tone="danger">
      <div className={styles.errorCard}><AdminButton onClick={() => void load()} disabled={pageBusy}>ลองใหม่</AdminButton></div>
    </AdminCard>}

    {data && <>
      <AdminMetricGrid>
        <AdminMetric title="บทบาท" value={String(data.summary.roleCount)} helper={`${data.summary.wildcardRoleCount} บทบาทมีสิทธิ์ทั้งหมด`} />
        <AdminMetric title="สิทธิ์ทั้งหมด" value={String(data.summary.permissionCount)} helper="รหัสสิทธิ์ในระบบ" />
        <AdminMetric title="ผู้ดูแล" value={String(data.summary.adminUserCount)} helper="บัญชีที่อยู่ในระบบ" />
        <AdminMetric title="สิทธิ์ชั่วคราว" value={String(delegations.filter((item) => item.status === 'ACTIVE').length)} helper="รายการที่ยังใช้งาน" tone="warning" />
      </AdminMetricGrid>

      <InviteAdminPanel roles={data.roles} onCreated={handleInvitationCreated} />
      <AdminInvitationList allowed={canInvite} />

      <AdminGrid>
        <AdminCard title="บทบาท" description="บทบาทและจำนวนสิทธิ์ที่ผูกอยู่">
          <AdminStack>
            {data.roles.map((role) => <AdminSectionRow key={role.id}>
              <div className={styles.entity}>
                <div className={styles.badges}>
                  <AdminBadge tone={role.hasWildcard ? 'danger' : 'neutral'}>{role.hasWildcard ? 'สิทธิ์ทั้งหมด' : 'บทบาททั่วไป'}</AdminBadge>
                  <AdminBadge>ระดับ {role.level}</AdminBadge>
                </div>
                <strong>{role.name}</strong>
                <AdminCode>{role.code}</AdminCode>
                {role.description && <p>{role.description}</p>}
              </div>
              <div className={styles.meta}><span>{role.permissionCount} สิทธิ์</span><span>{role.adminUserCount} ผู้ดูแล</span></div>
            </AdminSectionRow>)}
            {data.roles.length === 0 && <AdminEmpty>ยังไม่มีบทบาท</AdminEmpty>}
          </AdminStack>
        </AdminCard>

        <AdminCard title="บัญชีผู้ดูแล" description={canManage ? 'เพิ่มหรือถอดบทบาท พร้อมบันทึกเหตุผลทุกครั้ง' : 'แสดงข้อมูลแบบอ่านอย่างเดียว'}>
          <AdminStack>
            {data.adminUsers.map((user) => <AdminSectionRow key={user.id}>
              <div className={styles.entity}>
                <div className={styles.badges}>
                  <AdminBadge tone={adminStatusTone(user.status)}>{adminStatusLabel(user.status)}</AdminBadge>
                  <AdminBadge tone={user.twoFactorEnabled ? 'success' : 'warning'}>{user.twoFactorEnabled ? 'เปิด 2FA' : 'ยังไม่เปิด 2FA'}</AdminBadge>
                  {user.protected && <AdminBadge tone="danger">บัญชีป้องกัน</AdminBadge>}
                </div>
                <strong>{user.username}</strong>
                <p>{user.email}</p>
                <div className={styles.pills}>
                  {user.roles.map((role) => <span key={role.id} className={styles.pill}>
                    {role.code}
                    {canManage && !user.protected && <button
                      type="button"
                      disabled={pageBusy}
                      onClick={() => requestRemoveRole(user, role)}
                      className={styles.removeRole}
                      aria-label={`ถอดบทบาท ${role.code} จาก ${user.username}`}
                    >×</button>}
                  </span>)}
                  {user.roles.length === 0 && <span className={styles.emptyRole}>ยังไม่มีบทบาท</span>}
                </div>
              </div>
              {canManage && !user.protected && <div className={styles.assignPanel}>
                <select
                  disabled={pageBusy}
                  value={selectedRoles[user.id] ?? ''}
                  onChange={(event) => setSelectedRoles((current) => ({ ...current, [user.id]: event.target.value }))}
                  className={styles.field}
                  aria-label={`เลือกบทบาทให้ ${user.username}`}
                >
                  <option value="">เลือกบทบาท</option>
                  {data.roles.filter((role) => !role.hasWildcard && !['owner', 'super_admin'].includes(role.code)).map((role) => <option key={role.id} value={role.id}>{role.code}</option>)}
                </select>
                <textarea
                  disabled={pageBusy}
                  value={roleReasons[user.id] ?? ''}
                  onChange={(event) => setRoleReasons((current) => ({ ...current, [user.id]: event.target.value }))}
                  maxLength={500}
                  placeholder="เหตุผลอย่างน้อย 5 ตัวอักษร"
                  className={styles.textarea}
                  aria-label={`เหตุผลเปลี่ยนบทบาทของ ${user.username}`}
                />
                <AdminButton disabled={pageBusy} onClick={() => requestAssignRole(user)}>เพิ่มบทบาท</AdminButton>
              </div>}
            </AdminSectionRow>)}
            {data.adminUsers.length === 0 && <AdminEmpty>ยังไม่มีบัญชีผู้ดูแล</AdminEmpty>}
          </AdminStack>
        </AdminCard>
      </AdminGrid>

      <AdminCard title="สิทธิ์ชั่วคราว" description="มอบสิทธิ์แบบจำกัดเวลา พร้อมเหตุผลและประวัติตรวจสอบ">
        {canDelegate && <div className={styles.delegationForm}>
          <select disabled={pageBusy} value={delegateAdminId} onChange={(event) => setDelegateAdminId(event.target.value)} className={styles.field} aria-label="เลือกผู้รับสิทธิ์">
            <option value="">เลือกผู้รับสิทธิ์</option>
            {data.adminUsers.filter((user) => user.status === 'ACTIVE' && !user.protected && user.id !== currentAdminId).map((user) => <option key={user.id} value={user.id}>{user.username} · {user.email}</option>)}
          </select>
          <input disabled={pageBusy} value={delegationPermissionCodes} onChange={(event) => setDelegationPermissionCodes(event.target.value)} placeholder="เช่น reports.view, risk.view" className={styles.field} aria-label="รหัสสิทธิ์" />
          <input disabled={pageBusy} value={delegationHours} onChange={(event) => setDelegationHours(event.target.value)} type="number" min="1" max="168" step="1" placeholder="จำนวนชั่วโมง" className={styles.field} aria-label="ระยะเวลาเป็นชั่วโมง" />
          <input disabled={pageBusy} value={delegationReason} onChange={(event) => setDelegationReason(event.target.value)} maxLength={500} placeholder="เหตุผลการมอบสิทธิ์" className={styles.field} aria-label="เหตุผลการมอบสิทธิ์" />
          <AdminButton disabled={pageBusy} onClick={() => void createDelegation()}>{busyKey === 'delegation:create' ? 'กำลังมอบสิทธิ์...' : 'มอบสิทธิ์'}</AdminButton>
        </div>}
        <AdminStack>
          {delegations.map((item) => <AdminSectionRow key={item.id}>
            <div className={styles.entity}>
              <div className={styles.badges}>
                <AdminBadge tone={delegationStatusTone(item.status)}>{delegationStatusLabel(item.status)}</AdminBadge>
                <AdminBadge>หมดอายุ {formatDate(item.expiresAt)}</AdminBadge>
              </div>
              <strong>{item.delegate.username}</strong>
              <p>ผู้มอบ: {item.grantor.username} · {item.reason ?? 'ไม่ได้ระบุเหตุผล'}</p>
              <div className={styles.pills}>{item.permissionCodes.map((code) => <span key={code} className={styles.pill}>{code}</span>)}</div>
            </div>
            {item.status === 'ACTIVE' && canDelegate && <div className={styles.revokePanel}>
              <input
                disabled={pageBusy}
                value={delegationRevokeReasons[item.id] ?? ''}
                onChange={(event) => setDelegationRevokeReasons((current) => ({ ...current, [item.id]: event.target.value }))}
                maxLength={500}
                placeholder="เหตุผลยกเลิกอย่างน้อย 5 ตัวอักษร"
                className={styles.field}
                aria-label={`เหตุผลยกเลิกสิทธิ์ของ ${item.delegate.username}`}
              />
              <AdminButton tone="danger" disabled={pageBusy} onClick={() => requestRevokeDelegation(item)}>ยกเลิกสิทธิ์</AdminButton>
            </div>}
          </AdminSectionRow>)}
          {delegations.length === 0 && <AdminEmpty>ยังไม่มีสิทธิ์ชั่วคราว</AdminEmpty>}
        </AdminStack>
      </AdminCard>

      <AdminCard title="รายการสิทธิ์" description="ค้นหาและตรวจรหัสสิทธิ์ทั้งหมดในระบบ">
        <AdminFilterBar resultText={loading ? 'กำลังอัปเดต...' : `${filteredPermissions.length} รายการ`}>
          <input
            disabled={pageBusy}
            value={permissionQuery}
            onChange={(event) => setPermissionQuery(event.target.value)}
            placeholder="ค้นหารหัส ชื่อ โมดูล หรือคำอธิบาย"
            className={styles.filterSearch}
            aria-label="ค้นหาสิทธิ์"
          />
          <select disabled={pageBusy} value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)} aria-label="กรองตามโมดูล">
            {modules.map((item) => <option key={item} value={item}>{item === 'ALL' ? 'ทุกโมดูล' : item}</option>)}
          </select>
          <select disabled={pageBusy} value={permissionPageSize} onChange={(event) => setPermissionPageSize(Number(event.target.value))} aria-label="จำนวนรายการต่อหน้า">
            {PAGE_SIZES.map((size) => <option key={size} value={size}>{size} / หน้า</option>)}
          </select>
          {(permissionQuery || moduleFilter !== 'ALL') && <AdminButton size="compact" tone="ghost" disabled={pageBusy} onClick={() => { setPermissionQuery(''); setModuleFilter('ALL'); }}>ล้างตัวกรอง</AdminButton>}
        </AdminFilterBar>
        <AdminStack>
          {visiblePermissions.map((permission) => <AdminSectionRow key={permission.id}>
            <div className={styles.permission}>
              <div className={styles.badges}><AdminBadge>{permission.module}</AdminBadge></div>
              <AdminCode>{permission.code}</AdminCode>
              <strong>{permission.name}</strong>
              {permission.description && <p>{permission.description}</p>}
            </div>
          </AdminSectionRow>)}
          {filteredPermissions.length === 0 && <AdminEmpty>ไม่พบสิทธิ์ตามตัวกรอง</AdminEmpty>}
        </AdminStack>
        {filteredPermissions.length > 0 && <AdminPagination
          page={safePermissionPage}
          totalPages={permissionTotalPages}
          onPrevious={() => setPermissionPage(Math.max(1, safePermissionPage - 1))}
          onNext={() => setPermissionPage(Math.min(permissionTotalPages, safePermissionPage + 1))}
          disabled={pageBusy}
        />}
      </AdminCard>
    </>}

    <AdminConfirmDialog
      open={Boolean(pendingAction)}
      title={confirmation?.title ?? 'ยืนยันการเปลี่ยนสิทธิ์'}
      description={confirmation?.description ?? 'ตรวจสอบข้อมูลก่อนดำเนินการ'}
      confirmLabel={confirmation?.label ?? 'ยืนยัน'}
      tone={confirmation?.tone ?? 'primary'}
      busy={Boolean(busyKey)}
      details={confirmation ? <p className={styles.confirmReason}>เหตุผล: {confirmation.reason}</p> : null}
      onCancel={() => { if (!busyKey) setPendingAction(null); }}
      onConfirm={() => void executeAction()}
    />
  </AdminPage>;
}

async function fetchAdminPayload(path: string): Promise<FetchResult> {
  try {
    const response = await adminApiFetch(path);
    return { ok: response.ok, payload: await response.json().catch(() => null) };
  } catch {
    return { ok: false, payload: null };
  }
}

function confirmationFor(action: Exclude<PendingAction, null>): Confirmation {
  if (action.type === 'assign-role') return { title: 'ยืนยันเพิ่มบทบาท', description: `เพิ่ม ${action.role.code} ให้ ${action.user.username}`, label: 'เพิ่มบทบาท', tone: 'primary', reason: action.reason };
  if (action.type === 'remove-role') return { title: 'ยืนยันถอดบทบาท', description: `ถอด ${action.role.code} ออกจาก ${action.user.username}`, label: 'ถอดบทบาท', tone: 'danger', reason: action.reason };
  return { title: 'ยืนยันยกเลิกสิทธิ์ชั่วคราว', description: `ยกเลิกสิทธิ์ของ ${action.delegation.delegate.username}`, label: 'ยกเลิกสิทธิ์', tone: 'danger', reason: action.reason };
}

function adminStatusLabel(status: string) {
  return ({ ACTIVE: 'ใช้งาน', LOCKED: 'ล็อก', SUSPENDED: 'ระงับ', DISABLED: 'ปิดใช้งาน' } as Record<string, string>)[status] ?? status;
}

function adminStatusTone(status: string): 'neutral' | 'success' | 'warning' | 'danger' {
  return status === 'ACTIVE' ? 'success' : status === 'LOCKED' ? 'warning' : status === 'SUSPENDED' || status === 'DISABLED' ? 'danger' : 'neutral';
}

function delegationStatusLabel(status: string) {
  return ({ ACTIVE: 'ใช้งาน', REVOKED: 'ยกเลิกแล้ว', EXPIRED: 'หมดอายุ' } as Record<string, string>)[status] ?? status;
}

function delegationStatusTone(status: string): 'neutral' | 'success' | 'warning' | 'danger' {
  return status === 'ACTIVE' ? 'success' : status === 'EXPIRED' ? 'warning' : status === 'REVOKED' ? 'neutral' : 'danger';
}

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }
function isPermission(value: unknown): value is Permission { return isRecord(value) && typeof value.id === 'string' && typeof value.code === 'string' && typeof value.name === 'string' && typeof value.module === 'string'; }
function isAdminRole(value: unknown): value is AdminRole { return isRecord(value) && typeof value.id === 'string' && typeof value.code === 'string' && typeof value.name === 'string' && Number.isFinite(Number(value.level)); }
function isRole(value: unknown): value is Role { return isRecord(value) && typeof value.id === 'string' && typeof value.code === 'string' && typeof value.name === 'string' && Number.isFinite(Number(value.level)) && Number.isFinite(Number(value.adminUserCount)) && Number.isFinite(Number(value.permissionCount)) && typeof value.hasWildcard === 'boolean' && Array.isArray(value.permissions) && value.permissions.every(isPermission); }
function isAdminUser(value: unknown): value is AdminUser { return isRecord(value) && typeof value.id === 'string' && typeof value.username === 'string' && typeof value.email === 'string' && typeof value.status === 'string' && typeof value.twoFactorEnabled === 'boolean' && typeof value.createdAt === 'string' && Array.isArray(value.roles) && value.roles.every(isAdminRole); }
function isDelegation(value: unknown): value is Delegation { return isRecord(value) && typeof value.id === 'string' && typeof value.grantorAdminId === 'string' && typeof value.delegateAdminId === 'string' && Array.isArray(value.permissionCodes) && value.permissionCodes.every((item) => typeof item === 'string') && typeof value.status === 'string' && typeof value.expiresAt === 'string' && isRecord(value.grantor) && typeof value.grantor.username === 'string' && isRecord(value.delegate) && typeof value.delegate.username === 'string' && typeof value.delegate.email === 'string' && typeof value.delegate.status === 'string'; }
function isAccessResponse(value: unknown): value is AccessResponse { return isRecord(value) && isRecord(value.summary) && Number.isFinite(Number(value.summary.roleCount)) && Number.isFinite(Number(value.summary.permissionCount)) && Number.isFinite(Number(value.summary.adminUserCount)) && Number.isFinite(Number(value.summary.wildcardRoleCount)) && Array.isArray(value.roles) && value.roles.every(isRole) && Array.isArray(value.permissions) && value.permissions.every(isPermission) && Array.isArray(value.adminUsers) && value.adminUsers.every(isAdminUser); }
function formatDate(value: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('th-TH'); }
