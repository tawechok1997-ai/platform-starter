'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminNotice, AdminPage, AdminSectionRow, AdminStack } from '../_components/admin-ui';

type AdminStatus = 'ACTIVE' | 'LOCKED' | 'SUSPENDED';
type AdminUser = { id: string; username: string; email: string; status: AdminStatus; twoFactorEnabled: boolean; lastLoginAt?: string | null; protected?: boolean; roles: { id: string; code: string; name: string }[] };
type AccessResponse = { adminUsers: AdminUser[] };
type CurrentAdmin = { id?: string; permissions?: string[] };
type SecurityOverview = {
  admin: { id: string; username: string; email: string; status: AdminStatus; twoFactorEnabled: boolean; lastLoginAt?: string | null; createdAt: string; roles: { code: string; name: string }[] };
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
      setData(accessPayload);
      setCurrentAdminId(typeof (mePayload as CurrentAdmin | null)?.id === 'string' ? (mePayload as CurrentAdmin).id ?? '' : '');
      setPermissions(Array.isArray((mePayload as CurrentAdmin | null)?.permissions) ? (mePayload as CurrentAdmin).permissions ?? [] : []);
      setMessage('');
    } catch {
      setMessage('เชื่อมต่อระบบบัญชีผู้ดูแลไม่สำเร็จ');
    }
  }

  const canManage = permissions.includes('*') || permissions.includes('admin.access.manage');

  const users = useMemo(() => (data?.adminUsers ?? []).filter((user) => {
    const matchesStatus = status === 'ALL' || user.status === status;
    const needle = query.trim().toLowerCase();
    const matchesQuery = !needle || user.username.toLowerCase().includes(needle) || user.email.toLowerCase().includes(needle) || user.roles.some((role) => role.code.toLowerCase().includes(needle));
    return matchesStatus && matchesQuery;
  }), [data, query, status]);

  async function changeStatus(user: AdminUser, nextStatus: AdminStatus) {
    if (!canManage || user.protected || user.id === currentAdminId || user.status === nextStatus) return;
    const reason = (reasons[user.id] ?? '').trim();
    if (reason.length < 5) {
      setMessage('กรุณาระบุเหตุผลอย่างน้อย 5 ตัวอักษรก่อนเปลี่ยนสถานะ');
      return;
    }
    const actionLabel = nextStatus === 'ACTIVE' ? 'เปิดใช้งาน' : nextStatus === 'LOCKED' ? 'ล็อก' : 'ระงับ';
    if (!window.confirm(`ยืนยัน${actionLabel}บัญชี ${user.username}? ระบบจะยกเลิก session ที่กำลังใช้งานทั้งหมด`)) return;

    setBusyId(user.id);
    setMessage('กำลังเปลี่ยนสถานะบัญชี...');
    try {
      const response = await adminApiFetch(`/admin/access/admin-users/${user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus, reason }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(typeof payload?.message === 'string' ? payload.message : 'เปลี่ยนสถานะบัญชีไม่สำเร็จ');
        return;
      }
      setReasons((current) => ({ ...current, [user.id]: '' }));
      setMessage(`เปลี่ยนสถานะ ${user.username} เป็น ${nextStatus} แล้ว และยกเลิก session เดิมเรียบร้อย`);
      await load();
    } catch {
      setMessage('เชื่อมต่อระบบเปลี่ยนสถานะไม่สำเร็จ');
    } finally {
      setBusyId('');
    }
  }

  async function toggleSecurity(userId: string) {
    if (securityById[userId]) {
      setSecurityById((current) => {
        const next = { ...current };
        delete next[userId];
        return next;
      });
      return;
    }
    setSecurityBusyId(userId);
    try {
      const response = await adminApiFetch(`/admin/access/admin-users/${userId}/security`);
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.admin) {
        setMessage(payload?.message ?? 'โหลดประวัติความปลอดภัยไม่สำเร็จ');
        return;
      }
      setSecurityById((current) => ({ ...current, [userId]: payload as SecurityOverview }));
    } catch {
      setMessage('เชื่อมต่อข้อมูลความปลอดภัยไม่สำเร็จ');
    } finally {
      setSecurityBusyId('');
    }
  }

  async function revokeSession(userId: string, sessionId: string) {
    const reason = window.prompt('ระบุเหตุผลในการยกเลิก session อย่างน้อย 5 ตัวอักษร')?.trim() ?? '';
    if (reason.length < 5) {
      setMessage('ต้องระบุเหตุผลอย่างน้อย 5 ตัวอักษร');
      return;
    }
    if (!window.confirm('ยืนยันยกเลิก session นี้?')) return;
    setSessionBusyId(sessionId);
    try {
      const response = await adminApiFetch(`/admin/access/admin-users/${userId}/sessions/${sessionId}`, {
        method: 'DELETE',
        body: JSON.stringify({ reason }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(payload?.message ?? 'ยกเลิก session ไม่สำเร็จ');
        return;
      }
      setSecurityById((current) => {
        const item = current[userId];
        if (!item) return current;
        return {
          ...current,
          [userId]: {
            ...item,
            sessions: item.sessions.map((session) => session.id === sessionId ? { ...session, active: false, revokedAt: new Date().toISOString() } : session),
          },
        };
      });
      setMessage('ยกเลิก session แล้วและบันทึก audit log เรียบร้อย');
    } catch {
      setMessage('เชื่อมต่อระบบยกเลิก session ไม่สำเร็จ');
    } finally {
      setSessionBusyId('');
    }
  }

  return <AdminPage eyebrow="Security" title="บัญชีผู้ดูแล" description="ค้นหา ตรวจสถานะ และควบคุมการเข้าใช้งานของบัญชีผู้ดูแลอย่างปลอดภัย">
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminCard title="ตัวกรอง" description="ค้นหาจากชื่อผู้ใช้ อีเมล หรือ Role">
      <div style={filterStyle}>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาบัญชีผู้ดูแล" style={inputStyle} />
        <select value={status} onChange={(event) => setStatus(event.target.value)} style={inputStyle}>
          <option value="ALL">ทุกสถานะ</option><option value="ACTIVE">ACTIVE</option><option value="LOCKED">LOCKED</option><option value="SUSPENDED">SUSPENDED</option>
        </select>
      </div>
    </AdminCard>
    <AdminCard title="บัญชีทั้งหมด" description={`${users.length} บัญชี`}>
      <AdminStack>{users.map((user) => {
        const isSelf = user.id === currentAdminId;
        const canAct = canManage && !user.protected && !isSelf;
        return <AdminSectionRow key={user.id}>
          <div style={userStyle}>
            <div style={badgeStyle}><AdminBadge tone={user.status === 'ACTIVE' ? 'success' : 'danger'}>{user.status}</AdminBadge><AdminBadge tone={user.twoFactorEnabled ? 'success' : 'warning'}>{user.twoFactorEnabled ? '2FA ON' : '2FA OFF'}</AdminBadge>{user.protected && <AdminBadge tone="danger">PROTECTED</AdminBadge>}{isSelf && <AdminBadge>บัญชีของคุณ</AdminBadge>}</div>
            <strong>{user.username}</strong>
            <span>{user.email}</span>
            <div style={badgeStyle}>{user.roles.map((role) => <AdminBadge key={role.id}>{role.code}</AdminBadge>)}</div>
            <small>เข้าสู่ระบบล่าสุด: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('th-TH') : 'ยังไม่มีข้อมูล'}</small>
            <AdminButton tone="secondary" disabled={securityBusyId === user.id} onClick={() => toggleSecurity(user.id)}>{securityBusyId === user.id ? 'กำลังโหลด...' : securityById[user.id] ? 'ซ่อนข้อมูลความปลอดภัย' : 'ดู session / login history'}</AdminButton>
            {securityById[user.id] && <div style={securityPanelStyle}>
              <strong>Sessions ({securityById[user.id].sessions.length})</strong>
              {securityById[user.id].sessions.map((session) => <div key={session.id} style={securityItemStyle}>
                <div><AdminBadge tone={session.active ? 'success' : 'neutral'}>{session.active ? 'ACTIVE' : session.revokedAt ? 'REVOKED' : 'EXPIRED'}</AdminBadge> {session.deviceId ?? 'ไม่ระบุอุปกรณ์'}</div>
                <small>{session.ipAddress ?? 'ไม่ทราบ IP'} · {session.createdAt ? new Date(session.createdAt).toLocaleString('th-TH') : '-'}{session.userAgent ? ` · ${session.userAgent.slice(0, 100)}` : ''}</small>
                {session.active && <AdminButton tone="secondary" disabled={sessionBusyId === session.id} onClick={() => revokeSession(user.id, session.id)}>{sessionBusyId === session.id ? 'กำลังยกเลิก...' : 'ยกเลิก session'}</AdminButton>}
              </div>)}
              {securityById[user.id].sessions.length === 0 && <small>ยังไม่มี session</small>}
              <strong>Login history ({securityById[user.id].loginHistory.length})</strong>
              {securityById[user.id].loginHistory.slice(0, 10).map((item) => <div key={item.id} style={securityItemStyle}>
                <div><AdminBadge tone={item.success ? 'success' : 'danger'}>{item.success ? 'SUCCESS' : 'FAILED'}</AdminBadge> {item.reason ?? 'เข้าสู่ระบบ'}</div>
                <small>{item.ipAddress ?? 'ไม่ทราบ IP'} · {new Date(item.createdAt).toLocaleString('th-TH')}{item.userAgent ? ` · ${item.userAgent.slice(0, 100)}` : ''}</small>
              </div>)}
              {securityById[user.id].loginHistory.length === 0 && <small>ยังไม่มีประวัติ login</small>}
              <strong>Status timeline ({securityById[user.id].statusTimeline.length})</strong>
              {securityById[user.id].statusTimeline.slice(0, 10).map((item) => <div key={item.id} style={securityItemStyle}>
                <div><AdminBadge tone={item.toStatus === 'ACTIVE' ? 'success' : 'warning'}>{item.fromStatus ?? '-'} → {item.toStatus ?? '-'}</AdminBadge></div>
                <small>{item.reason ?? 'ไม่มีเหตุผลระบุ'} · {new Date(item.createdAt).toLocaleString('th-TH')}</small>
              </div>)}
              {securityById[user.id].statusTimeline.length === 0 && <small>ยังไม่มีประวัติเปลี่ยนสถานะ</small>}
            </div>}
            {canAct && <div style={actionPanelStyle}>
              <label style={reasonFieldStyle}>เหตุผลในการเปลี่ยนสถานะ
                <textarea value={reasons[user.id] ?? ''} onChange={(event) => setReasons((current) => ({ ...current, [user.id]: event.target.value }))} rows={2} maxLength={500} placeholder="ระบุเหตุผลอย่างน้อย 5 ตัวอักษร" disabled={busyId === user.id} style={reasonInputStyle} />
              </label>
              <div style={actionRowStyle}>
                {user.status !== 'ACTIVE' && <AdminButton disabled={Boolean(busyId)} onClick={() => changeStatus(user, 'ACTIVE')}>เปิดใช้งาน</AdminButton>}
                {user.status !== 'LOCKED' && <AdminButton disabled={Boolean(busyId)} onClick={() => changeStatus(user, 'LOCKED')}>ล็อกบัญชี</AdminButton>}
                {user.status !== 'SUSPENDED' && <AdminButton disabled={Boolean(busyId)} onClick={() => changeStatus(user, 'SUSPENDED')}>ระงับบัญชี</AdminButton>}
              </div>
            </div>}
            {!canAct && canManage && <small style={protectedHintStyle}>{user.protected ? 'บัญชี Owner/Super Admin ต้องใช้ขั้นตอนป้องกันเฉพาะ' : isSelf ? 'ไม่สามารถเปลี่ยนสถานะบัญชีตัวเองได้' : ''}</small>}
          </div>
        </AdminSectionRow>;
      })}{users.length === 0 && <AdminEmpty>ไม่พบบัญชีที่ตรงกับตัวกรอง</AdminEmpty>}</AdminStack>
    </AdminCard>
  </AdminPage>;
}

const filterStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 10 } as const;
const inputStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', width: '100%', boxSizing: 'border-box' as const };
const userStyle = { display: 'grid', gap: 8, minWidth: 0, width: '100%' } as const;
const badgeStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const actionPanelStyle = { marginTop: 4, display: 'grid', gap: 10, borderTop: '1px solid rgba(148,163,184,.16)', paddingTop: 12 } as const;
const reasonFieldStyle = { display: 'grid', gap: 7, fontSize: 13, fontWeight: 800, color: '#cbd5e1' } as const;
const reasonInputStyle = { width: '100%', resize: 'vertical' as const, minHeight: 68, borderRadius: 12, border: '1px solid rgba(148,163,184,.24)', background: '#0b1220', color: '#f8fafc', padding: 10, boxSizing: 'border-box' as const };
const actionRowStyle = { display: 'flex', flexWrap: 'wrap' as const, gap: 8 };
const protectedHintStyle = { color: '#fbbf24', fontWeight: 750 } as const;

const securityPanelStyle = { display: 'grid', gap: 8, marginTop: 8, padding: 12, borderRadius: 12, background: 'rgba(15,23,42,.72)', border: '1px solid rgba(148,163,184,.18)' } as const;
const securityItemStyle = { display: 'grid', gap: 4, padding: '8px 0', borderTop: '1px solid rgba(148,163,184,.12)' } as const;
