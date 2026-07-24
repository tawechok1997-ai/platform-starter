'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminConfirmDialog, AdminDrawer, AdminEmpty, AdminNotice, AdminPage } from '../_components/admin-ui';

type AdminStatus = 'ACTIVE' | 'LOCKED' | 'SUSPENDED';
type AdminRole = { id?: string; code: string; name: string };
type AdminUser = { id: string; username: string; email: string; status: AdminStatus; twoFactorEnabled: boolean; lastLoginAt?: string | null; protected?: boolean; displayName?: string | null; firstName?: string | null; lastName?: string | null; position?: string | null; department?: string | null; avatarUrl?: string | null; roles: AdminRole[] };
type AccessResponse = { adminUsers: AdminUser[] };
type SecurityOverview = { admin: AdminUser & { createdAt: string }; sessions: { id: string; deviceId?: string | null; ipAddress?: string | null; userAgent?: string | null; createdAt: string; expiresAt: string; revokedAt?: string | null; active: boolean }[]; loginHistory: { id: string; success: boolean; reason?: string | null; ipAddress?: string | null; userAgent?: string | null; createdAt: string }[]; statusTimeline: { id: string; actorAdminId?: string | null; fromStatus?: string | null; toStatus?: string | null; reason?: string | null; createdAt: string }[] };
type PendingAction = { type: 'status'; user: AdminUser; nextStatus: AdminStatus } | { type: 'session'; userId: string; sessionId: string } | null;

export default function AdminAccountsPage() {
  const [data, setData] = useState<AccessResponse | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [message, setMessage] = useState('กำลังโหลดบัญชีผู้ดูแล...');
  const [currentAdminId, setCurrentAdminId] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [sessionReasons, setSessionReasons] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState('');
  const [selected, setSelected] = useState<{ user: AdminUser; security: SecurityOverview } | null>(null);
  const [securityBusyId, setSecurityBusyId] = useState('');
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { void load(); }, []);

  async function load() {
    setLoading(true);
    setMessage('');
    try {
      const [accessResponse, meResponse] = await Promise.all([adminApiFetch('/admin/access/overview'), adminApiFetch('/admin/auth/me')]);
      const [accessPayload, mePayload] = await Promise.all([accessResponse.json().catch(() => null), meResponse.json().catch(() => null)]);
      if (!accessResponse.ok || !accessPayload || !Array.isArray(accessPayload.adminUsers)) throw new Error('load');
      setData(accessPayload as AccessResponse);
      setCurrentAdminId(typeof mePayload?.id === 'string' ? mePayload.id : '');
      setPermissions(Array.isArray(mePayload?.permissions) ? mePayload.permissions : []);
    } catch {
      setData({ adminUsers: [] });
      setMessage('โหลดบัญชีผู้ดูแลไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setLoading(false);
    }
  }

  const canManage = permissions.includes('*') || permissions.includes('admin.access.manage');
  const users = useMemo(() => (data?.adminUsers ?? []).filter((user) => {
    const needle = query.trim().toLowerCase();
    const searchable = [user.username, user.email, displayNameFor(user), user.position, user.department, ...user.roles.flatMap((role) => [role.code, role.name])].filter(Boolean).join(' ').toLowerCase();
    return (status === 'ALL' || user.status === status) && (!needle || searchable.includes(needle));
  }), [data, query, status]);

  async function openSecurity(user: AdminUser) {
    if (securityBusyId || busyId) return;
    setSecurityBusyId(user.id);
    setMessage('');
    try {
      const response = await adminApiFetch(`/admin/access/admin-users/${user.id}/security`);
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.admin || !Array.isArray(payload.sessions)) throw new Error('security');
      setSelected({ user, security: payload as SecurityOverview });
    } catch {
      setMessage('โหลดประวัติความปลอดภัยไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setSecurityBusyId('');
    }
  }

  function requestStatus(user: AdminUser, nextStatus: AdminStatus) {
    if (busyId) return;
    const reason = (reasons[user.id] ?? '').trim();
    if (reason.length < 5) { setMessage('กรุณาระบุเหตุผลอย่างน้อย 5 ตัวอักษรก่อนเปลี่ยนสถานะ'); return; }
    setPendingAction({ type: 'status', user, nextStatus });
  }

  function requestSession(userId: string, sessionId: string) {
    if (busyId) return;
    const reason = (sessionReasons[sessionId] ?? '').trim();
    if (reason.length < 5) { setMessage('กรุณาระบุเหตุผลอย่างน้อย 5 ตัวอักษรก่อนยกเลิก session'); return; }
    setPendingAction({ type: 'session', userId, sessionId });
  }

  async function executeAction() {
    if (!pendingAction || busyId) return;
    const action = pendingAction;
    const key = action.type === 'status' ? action.user.id : action.sessionId;
    setBusyId(key);
    setMessage('');
    try {
      if (action.type === 'status') {
        const reason = (reasons[action.user.id] ?? '').trim();
        const response = await adminApiFetch(`/admin/access/admin-users/${action.user.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: action.nextStatus, reason }) });
        if (!response.ok) throw new Error('status');
        setReasons((current) => ({ ...current, [action.user.id]: '' }));
        setMessage(`อัปเดตสถานะ ${action.user.username} แล้ว`);
        await load();
      } else {
        const reason = (sessionReasons[action.sessionId] ?? '').trim();
        const response = await adminApiFetch(`/admin/access/admin-users/${action.userId}/sessions/${action.sessionId}`, { method: 'DELETE', body: JSON.stringify({ reason }) });
        if (!response.ok) throw new Error('session');
        setSessionReasons((current) => ({ ...current, [action.sessionId]: '' }));
        setSelected((current) => current ? { ...current, security: { ...current.security, sessions: current.security.sessions.map((session) => session.id === action.sessionId ? { ...session, active: false, revokedAt: new Date().toISOString() } : session) } } : current);
        setMessage('ยกเลิก session และบันทึก audit log แล้ว');
      }
      setPendingAction(null);
    } catch {
      setMessage(action.type === 'status' ? 'เปลี่ยนสถานะบัญชีไม่สำเร็จ กรุณาลองใหม่' : 'ยกเลิก session ไม่สำเร็จ กรุณาลองใหม่');
    } finally {
      setBusyId('');
    }
  }

  const pageBusy = loading || Boolean(busyId) || Boolean(securityBusyId);
  return <AdminPage eyebrow="Security" title="บัญชีผู้ดูแล" description="ตรวจตัวตน ตำแหน่ง สิทธิ์ และสถานะความปลอดภัยของผู้ดูแลจากพื้นที่เดียว" actions={<AdminButton tone="secondary" disabled={pageBusy} onClick={() => void load()}>{loading ? 'กำลังโหลด...' : 'รีเฟรช'}</AdminButton>}>
    {message && <AdminNotice tone={message.includes('ไม่สำเร็จ') ? 'danger' : 'neutral'}>{message}</AdminNotice>}
    <AdminCard title="ค้นหาและกรอง" description="ค้นหาจากชื่อ อีเมล ตำแหน่ง แผนก หรือ Role"><div className="admin-directory-toolbar"><label className="admin-directory-field"><span>ค้นหา</span><input disabled={pageBusy} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ชื่อผู้ดูแล / ตำแหน่ง / Role" /></label><label className="admin-directory-field"><span>สถานะ</span><select disabled={pageBusy} value={status} onChange={(event) => setStatus(event.target.value)}><option value="ALL">ทุกสถานะ</option><option value="ACTIVE">ACTIVE</option><option value="LOCKED">LOCKED</option><option value="SUSPENDED">SUSPENDED</option></select></label></div></AdminCard>
    <AdminCard title="Admin Directory" description={`${users.length} บัญชี`}><div className="admin-directory-grid">
      {users.map((user) => {
        const isSelf = user.id === currentAdminId;
        const canAct = canManage && !user.protected && !isSelf;
        const displayName = displayNameFor(user);
        const primaryRole = user.roles[0];
        const position = user.position || primaryRole?.name || 'Admin';
        const department = user.department || departmentFor(primaryRole?.code);
        return <article className="admin-directory-card" key={user.id}>
          <div className="admin-directory-main"><span className="admin-directory-avatar">{user.avatarUrl ? <img src={user.avatarUrl} alt={`รูปโปรไฟล์ ${displayName}`} /> : initials(displayName)}</span><div className="admin-directory-identity"><h3>{displayName}</h3><p>@{user.username} · {user.email}</p><small>{position} · {department}</small><div className="admin-directory-meta">{user.roles.map((role) => <AdminBadge key={role.id ?? role.code}>{role.name || role.code}</AdminBadge>)}{isSelf && <AdminBadge>บัญชีของคุณ</AdminBadge>}{user.protected && <AdminBadge tone="danger">PROTECTED</AdminBadge>}</div></div><div className="admin-directory-status"><AdminBadge tone={user.status === 'ACTIVE' ? 'success' : 'danger'}>{user.status}</AdminBadge><AdminBadge tone={user.twoFactorEnabled ? 'success' : 'warning'}>{user.twoFactorEnabled ? '2FA ON' : '2FA OFF'}</AdminBadge></div></div>
          <div className="admin-directory-facts"><div className="admin-directory-fact"><span>ตำแหน่ง</span><strong>{position}</strong></div><div className="admin-directory-fact"><span>แผนก</span><strong>{department}</strong></div><div className="admin-directory-fact"><span>Role</span><strong>{primaryRole?.code || 'ไม่ระบุ'}</strong></div><div className="admin-directory-fact"><span>เข้าสู่ระบบล่าสุด</span><strong>{formatDate(user.lastLoginAt)}</strong></div></div>
          <div className="admin-directory-actions"><AdminButton tone="secondary" disabled={pageBusy} onClick={() => void openSecurity(user)}>{securityBusyId === user.id ? 'กำลังโหลด...' : 'รายละเอียดความปลอดภัย'}</AdminButton></div>
          {canAct && <div className="admin-directory-reason"><span>เหตุผลในการเปลี่ยนสถานะ</span><textarea value={reasons[user.id] ?? ''} onChange={(event) => setReasons((current) => ({ ...current, [user.id]: event.target.value }))} maxLength={500} placeholder="ระบุอย่างน้อย 5 ตัวอักษร" disabled={pageBusy} /><div className="admin-directory-actions">{user.status !== 'ACTIVE' && <AdminButton disabled={pageBusy} onClick={() => requestStatus(user, 'ACTIVE')}>เปิดใช้งาน</AdminButton>}{user.status !== 'LOCKED' && <AdminButton disabled={pageBusy} tone="danger" onClick={() => requestStatus(user, 'LOCKED')}>ล็อกบัญชี</AdminButton>}{user.status !== 'SUSPENDED' && <AdminButton disabled={pageBusy} tone="danger" onClick={() => requestStatus(user, 'SUSPENDED')}>ระงับบัญชี</AdminButton>}</div></div>}
        </article>;
      })}
      {!loading && users.length === 0 && <AdminEmpty>ไม่พบบัญชีที่ตรงกับตัวกรอง</AdminEmpty>}
    </div></AdminCard>
    <AdminDrawer open={Boolean(selected)} title={selected ? displayNameFor(selected.user) : 'รายละเอียดความปลอดภัย'} description={selected ? `@${selected.user.username} · ประวัติ Session, Login และสถานะบัญชี` : undefined} busy={Boolean(busyId)} onClose={() => { if (!busyId) setSelected(null); }}>
      {selected && <SecurityPanel security={selected.security} sessionReasons={sessionReasons} setSessionReasons={setSessionReasons} busyId={busyId} onRevoke={requestSession} />}
    </AdminDrawer>
    <AdminConfirmDialog open={Boolean(pendingAction)} title={pendingAction?.type === 'status' ? 'ยืนยันเปลี่ยนสถานะบัญชี' : 'ยืนยันยกเลิก Session'} description={pendingAction?.type === 'status' ? `เปลี่ยน ${pendingAction.user.username} เป็น ${pendingAction.nextStatus}` : 'Session นี้จะถูกยกเลิกทันทีและบันทึกใน Audit Log'} confirmLabel="ยืนยัน" tone="danger" busy={Boolean(busyId)} onCancel={() => { if (!busyId) setPendingAction(null); }} onConfirm={() => void executeAction()} />
  </AdminPage>;
}

function SecurityPanel({ security, sessionReasons, setSessionReasons, busyId, onRevoke }: { security: SecurityOverview; sessionReasons: Record<string, string>; setSessionReasons: React.Dispatch<React.SetStateAction<Record<string, string>>>; busyId: string; onRevoke: (userId: string, sessionId: string) => void }) {
  return <div className="admin-directory-security">
    <section className="admin-directory-security-section"><strong>Sessions ({security.sessions.length})</strong>{security.sessions.map((session) => <div className="admin-directory-security-item" key={session.id}><div><AdminBadge tone={session.active ? 'success' : 'neutral'}>{session.active ? 'ACTIVE' : session.revokedAt ? 'REVOKED' : 'EXPIRED'}</AdminBadge> {session.deviceId ?? 'ไม่ระบุอุปกรณ์'}</div><small>{session.ipAddress ?? 'ไม่ทราบ IP'} · {formatDate(session.createdAt)}{session.userAgent ? ` · ${session.userAgent.slice(0, 100)}` : ''}</small>{session.active && <><textarea disabled={Boolean(busyId)} value={sessionReasons[session.id] ?? ''} onChange={(event) => setSessionReasons((current) => ({ ...current, [session.id]: event.target.value }))} placeholder="เหตุผลอย่างน้อย 5 ตัวอักษร" /><AdminButton tone="danger" disabled={Boolean(busyId)} onClick={() => onRevoke(security.admin.id, session.id)}>ยกเลิก Session</AdminButton></>}</div>)}</section>
    <section className="admin-directory-security-section"><strong>Login history ({security.loginHistory.length})</strong>{security.loginHistory.slice(0, 10).map((item) => <div className="admin-directory-security-item" key={item.id}><div><AdminBadge tone={item.success ? 'success' : 'danger'}>{item.success ? 'SUCCESS' : 'FAILED'}</AdminBadge> {item.reason ?? 'เข้าสู่ระบบ'}</div><small>{item.ipAddress ?? 'ไม่ทราบ IP'} · {formatDate(item.createdAt)}</small></div>)}</section>
    <section className="admin-directory-security-section"><strong>Status timeline ({security.statusTimeline.length})</strong>{security.statusTimeline.slice(0, 10).map((item) => <div className="admin-directory-security-item" key={item.id}><div>{item.fromStatus ?? '-'} → {item.toStatus ?? '-'}</div><small>{item.reason ?? 'ไม่มีเหตุผล'} · {formatDate(item.createdAt)}</small></div>)}</section>
  </div>;
}

function displayNameFor(user: AdminUser) { return user.displayName || [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username; }
function initials(value: string) { return value.trim().split(/\s+/).slice(0, 2).map((part) => part.slice(0, 1).toLocaleUpperCase('th')).join('') || 'AD'; }
function formatDate(value?: string | null) { if (!value) return 'ยังไม่มีข้อมูล'; const date = new Date(value); return Number.isNaN(date.getTime()) ? 'ยังไม่มีข้อมูล' : date.toLocaleString('th-TH'); }
function departmentFor(roleCode?: string) { const code = String(roleCode ?? '').toLowerCase(); if (code.includes('finance')) return 'Finance Operations'; if (code.includes('risk') || code.includes('audit')) return 'Risk & Compliance'; if (code.includes('support')) return 'Customer Operations'; if (code.includes('content') || code.includes('marketing')) return 'Growth & Content'; if (code.includes('super') || code.includes('owner')) return 'Platform Administration'; return 'Operations'; }
