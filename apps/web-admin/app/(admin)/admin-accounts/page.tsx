'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminNotice, AdminPage } from '../_components/admin-ui';

type AdminStatus = 'ACTIVE' | 'LOCKED' | 'SUSPENDED';
type AdminRole = { id?: string; code: string; name: string };
type AdminUser = {
  id: string;
  username: string;
  email: string;
  status: AdminStatus;
  twoFactorEnabled: boolean;
  lastLoginAt?: string | null;
  protected?: boolean;
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  position?: string | null;
  department?: string | null;
  avatarUrl?: string | null;
  roles: AdminRole[];
};
type AccessResponse = { adminUsers: AdminUser[] };
type CurrentAdmin = { id?: string; permissions?: string[] };
type SecurityOverview = {
  admin: { id: string; username: string; email: string; status: AdminStatus; twoFactorEnabled: boolean; lastLoginAt?: string | null; createdAt: string; roles: AdminRole[] };
  sessions: { id: string; deviceId?: string | null; ipAddress?: string | null; userAgent?: string | null; createdAt: string; expiresAt: string; revokedAt?: string | null; active: boolean }[];
  loginHistory: { id: string; success: boolean; reason?: string | null; ipAddress?: string | null; userAgent?: string | null; createdAt: string }[];
  statusTimeline: { id: string; actorAdminId?: string | null; fromStatus?: string | null; toStatus?: string | null; reason?: string | null; createdAt: string }[];
};

export default function AdminAccountsPage() {
  const [data, setData] = useState<AccessResponse | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [message, setMessage] = useState('กำลังโหลดบัญชีผู้ดูแล...');
  const [currentAdminId, setCurrentAdminId] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState('');
  const [securityById, setSecurityById] = useState<Record<string, SecurityOverview>>({});
  const [securityBusyId, setSecurityBusyId] = useState('');
  const [sessionBusyId, setSessionBusyId] = useState('');

  useEffect(() => { void load(); }, []);

  async function load() {
    try {
      const [accessResponse, meResponse] = await Promise.all([
        adminApiFetch('/admin/access/overview'),
        adminApiFetch('/admin/auth/me'),
      ]);
      const [accessPayload, mePayload] = await Promise.all([
        accessResponse.json().catch(() => null),
        meResponse.json().catch(() => null),
      ]);
      if (!accessResponse.ok) { setMessage(accessPayload?.message ?? 'โหลดบัญชีผู้ดูแลไม่สำเร็จ'); return; }
      setData(accessPayload as AccessResponse);
      const me = mePayload as CurrentAdmin | null;
      setCurrentAdminId(typeof me?.id === 'string' ? me.id : '');
      setPermissions(Array.isArray(me?.permissions) ? me.permissions : []);
      setMessage('');
    } catch {
      setMessage('เชื่อมต่อระบบบัญชีผู้ดูแลไม่สำเร็จ');
    }
  }

  const canManage = permissions.includes('*') || permissions.includes('admin.access.manage');
  const users = useMemo(() => (data?.adminUsers ?? []).filter((user) => {
    const needle = query.trim().toLowerCase();
    const searchable = [user.username, user.email, displayNameFor(user), user.position, user.department, ...user.roles.flatMap((role) => [role.code, role.name])]
      .filter(Boolean).join(' ').toLowerCase();
    return (status === 'ALL' || user.status === status) && (!needle || searchable.includes(needle));
  }), [data, query, status]);

  async function changeStatus(user: AdminUser, nextStatus: AdminStatus) {
    if (!canManage || user.protected || user.id === currentAdminId || user.status === nextStatus) return;
    const reason = (reasons[user.id] ?? '').trim();
    if (reason.length < 5) { setMessage('กรุณาระบุเหตุผลอย่างน้อย 5 ตัวอักษรก่อนเปลี่ยนสถานะ'); return; }
    if (!window.confirm(`ยืนยันเปลี่ยนสถานะบัญชี ${user.username} เป็น ${nextStatus}?`)) return;
    setBusyId(user.id);
    try {
      const response = await adminApiFetch(`/admin/access/admin-users/${user.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: nextStatus, reason }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok) { setMessage(payload?.message ?? 'เปลี่ยนสถานะบัญชีไม่สำเร็จ'); return; }
      setReasons((current) => ({ ...current, [user.id]: '' }));
      setMessage(`อัปเดตสถานะ ${user.username} แล้ว`);
      await load();
    } catch { setMessage('เชื่อมต่อระบบเปลี่ยนสถานะไม่สำเร็จ'); }
    finally { setBusyId(''); }
  }

  async function toggleSecurity(userId: string) {
    if (securityById[userId]) {
      setSecurityById((current) => { const next = { ...current }; delete next[userId]; return next; });
      return;
    }
    setSecurityBusyId(userId);
    try {
      const response = await adminApiFetch(`/admin/access/admin-users/${userId}/security`);
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.admin) { setMessage(payload?.message ?? 'โหลดประวัติความปลอดภัยไม่สำเร็จ'); return; }
      setSecurityById((current) => ({ ...current, [userId]: payload as SecurityOverview }));
    } catch { setMessage('เชื่อมต่อข้อมูลความปลอดภัยไม่สำเร็จ'); }
    finally { setSecurityBusyId(''); }
  }

  async function revokeSession(userId: string, sessionId: string) {
    const reason = window.prompt('ระบุเหตุผลในการยกเลิก session อย่างน้อย 5 ตัวอักษร')?.trim() ?? '';
    if (reason.length < 5 || !window.confirm('ยืนยันยกเลิก session นี้?')) return;
    setSessionBusyId(sessionId);
    try {
      const response = await adminApiFetch(`/admin/access/admin-users/${userId}/sessions/${sessionId}`, { method: 'DELETE', body: JSON.stringify({ reason }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok) { setMessage(payload?.message ?? 'ยกเลิก session ไม่สำเร็จ'); return; }
      setSecurityById((current) => {
        const item = current[userId];
        if (!item) return current;
        return { ...current, [userId]: { ...item, sessions: item.sessions.map((session) => session.id === sessionId ? { ...session, active: false, revokedAt: new Date().toISOString() } : session) } };
      });
      setMessage('ยกเลิก session และบันทึก audit log แล้ว');
    } catch { setMessage('เชื่อมต่อระบบยกเลิก session ไม่สำเร็จ'); }
    finally { setSessionBusyId(''); }
  }

  return <AdminPage eyebrow="Security" title="บัญชีผู้ดูแล" description="ตรวจตัวตน ตำแหน่ง สิทธิ์ และสถานะความปลอดภัยของผู้ดูแลจากพื้นที่เดียว">
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminCard title="ค้นหาและกรอง" description="ค้นหาจากชื่อ อีเมล ตำแหน่ง แผนก หรือ Role">
      <div className="admin-directory-toolbar">
        <label className="admin-directory-field"><span>ค้นหา</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ชื่อผู้ดูแล / ตำแหน่ง / Role" /></label>
        <label className="admin-directory-field"><span>สถานะ</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">ทุกสถานะ</option><option value="ACTIVE">ACTIVE</option><option value="LOCKED">LOCKED</option><option value="SUSPENDED">SUSPENDED</option></select></label>
        <AdminButton tone="secondary" onClick={() => void load()}>รีเฟรช</AdminButton>
      </div>
    </AdminCard>
    <AdminCard title="Admin Directory" description={`${users.length} บัญชี`}>
      <div className="admin-directory-grid">
        {users.map((user) => {
          const isSelf = user.id === currentAdminId;
          const canAct = canManage && !user.protected && !isSelf;
          const security = securityById[user.id];
          const displayName = displayNameFor(user);
          const primaryRole = user.roles[0];
          const position = user.position || primaryRole?.name || 'Admin';
          const department = user.department || departmentFor(primaryRole?.code);
          return <article className="admin-directory-card" key={user.id}>
            <div className="admin-directory-main">
              <span className="admin-directory-avatar">{user.avatarUrl ? <img src={user.avatarUrl} alt={`รูปโปรไฟล์ ${displayName}`} /> : initials(displayName)}</span>
              <div className="admin-directory-identity"><h3>{displayName}</h3><p>@{user.username} · {user.email}</p><small>{position} · {department}</small><div className="admin-directory-meta">{user.roles.map((role) => <AdminBadge key={role.id ?? role.code}>{role.name || role.code}</AdminBadge>)}{isSelf && <AdminBadge>บัญชีของคุณ</AdminBadge>}{user.protected && <AdminBadge tone="danger">PROTECTED</AdminBadge>}</div></div>
              <div className="admin-directory-status"><AdminBadge tone={user.status === 'ACTIVE' ? 'success' : 'danger'}>{user.status}</AdminBadge><AdminBadge tone={user.twoFactorEnabled ? 'success' : 'warning'}>{user.twoFactorEnabled ? '2FA ON' : '2FA OFF'}</AdminBadge></div>
            </div>
            <div className="admin-directory-facts">
              <div className="admin-directory-fact"><span>ตำแหน่ง</span><strong>{position}</strong></div>
              <div className="admin-directory-fact"><span>แผนก</span><strong>{department}</strong></div>
              <div className="admin-directory-fact"><span>Role</span><strong>{primaryRole?.code || 'ไม่ระบุ'}</strong></div>
              <div className="admin-directory-fact"><span>เข้าสู่ระบบล่าสุด</span><strong>{formatDate(user.lastLoginAt)}</strong></div>
            </div>
            <div className="admin-directory-actions"><AdminButton tone="secondary" disabled={securityBusyId === user.id} onClick={() => void toggleSecurity(user.id)}>{securityBusyId === user.id ? 'กำลังโหลด...' : security ? 'ซ่อนข้อมูลความปลอดภัย' : 'Session และ Login history'}</AdminButton></div>
            {security && <SecurityPanel security={security} userId={user.id} sessionBusyId={sessionBusyId} onRevoke={revokeSession} />}
            {canAct && <div className="admin-directory-reason"><span>เหตุผลในการเปลี่ยนสถานะ</span><textarea value={reasons[user.id] ?? ''} onChange={(event) => setReasons((current) => ({ ...current, [user.id]: event.target.value }))} maxLength={500} placeholder="ระบุอย่างน้อย 5 ตัวอักษร" disabled={busyId === user.id} /><div className="admin-directory-actions">{user.status !== 'ACTIVE' && <AdminButton disabled={Boolean(busyId)} onClick={() => void changeStatus(user, 'ACTIVE')}>เปิดใช้งาน</AdminButton>}{user.status !== 'LOCKED' && <AdminButton disabled={Boolean(busyId)} tone="danger" onClick={() => void changeStatus(user, 'LOCKED')}>ล็อกบัญชี</AdminButton>}{user.status !== 'SUSPENDED' && <AdminButton disabled={Boolean(busyId)} tone="danger" onClick={() => void changeStatus(user, 'SUSPENDED')}>ระงับบัญชี</AdminButton>}</div></div>}
          </article>;
        })}
        {users.length === 0 && <AdminEmpty>ไม่พบบัญชีที่ตรงกับตัวกรอง</AdminEmpty>}
      </div>
    </AdminCard>
  </AdminPage>;
}

function SecurityPanel({ security, userId, sessionBusyId, onRevoke }: { security: SecurityOverview; userId: string; sessionBusyId: string; onRevoke: (userId: string, sessionId: string) => Promise<void> }) {
  return <div className="admin-directory-security">
    <section className="admin-directory-security-section"><strong>Sessions ({security.sessions.length})</strong>{security.sessions.map((session) => <div className="admin-directory-security-item" key={session.id}><div><AdminBadge tone={session.active ? 'success' : 'neutral'}>{session.active ? 'ACTIVE' : session.revokedAt ? 'REVOKED' : 'EXPIRED'}</AdminBadge> {session.deviceId ?? 'ไม่ระบุอุปกรณ์'}</div><small>{session.ipAddress ?? 'ไม่ทราบ IP'} · {formatDate(session.createdAt)}{session.userAgent ? ` · ${session.userAgent.slice(0, 100)}` : ''}</small>{session.active && <AdminButton tone="secondary" disabled={sessionBusyId === session.id} onClick={() => void onRevoke(userId, session.id)}>{sessionBusyId === session.id ? 'กำลังยกเลิก...' : 'ยกเลิก session'}</AdminButton>}</div>)}</section>
    <section className="admin-directory-security-section"><strong>Login history ({security.loginHistory.length})</strong>{security.loginHistory.slice(0, 10).map((item) => <div className="admin-directory-security-item" key={item.id}><div><AdminBadge tone={item.success ? 'success' : 'danger'}>{item.success ? 'SUCCESS' : 'FAILED'}</AdminBadge> {item.reason ?? 'เข้าสู่ระบบ'}</div><small>{item.ipAddress ?? 'ไม่ทราบ IP'} · {formatDate(item.createdAt)}</small></div>)}</section>
  </div>;
}

function displayNameFor(user: AdminUser) { return user.displayName || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username; }
function initials(value: string) { return value.trim().split(/\s+/).slice(0, 2).map((part) => part.slice(0, 1).toLocaleUpperCase('th')).join('') || 'AD'; }
function formatDate(value?: string | null) { if (!value) return 'ยังไม่มีข้อมูล'; const date = new Date(value); return Number.isNaN(date.getTime()) ? 'ยังไม่มีข้อมูล' : date.toLocaleString('th-TH'); }
function departmentFor(roleCode?: string) { const code = String(roleCode ?? '').toLowerCase(); if (code.includes('finance')) return 'Finance Operations'; if (code.includes('risk') || code.includes('audit')) return 'Risk & Compliance'; if (code.includes('support')) return 'Customer Operations'; if (code.includes('content') || code.includes('marketing')) return 'Growth & Content'; if (code.includes('super') || code.includes('owner')) return 'Platform Administration'; return 'Operations'; }
