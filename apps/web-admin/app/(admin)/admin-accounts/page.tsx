'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminCard, AdminEmpty, AdminNotice, AdminPage, AdminSectionRow, AdminStack } from '../_components/admin-ui';

type AdminUser = { id: string; username: string; email: string; status: string; twoFactorEnabled: boolean; lastLoginAt?: string | null; protected?: boolean; roles: { id: string; code: string; name: string }[] };
type AccessResponse = { adminUsers: AdminUser[] };

export default function AdminAccountsPage() {
  const [data, setData] = useState<AccessResponse | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [message, setMessage] = useState('กำลังโหลดบัญชีผู้ดูแล...');

  useEffect(() => { void load(); }, []);

  async function load() {
    try {
      const response = await adminApiFetch('/admin/access/overview');
      const payload = await response.json().catch(() => null);
      if (!response.ok) { setMessage(payload?.message ?? 'โหลดบัญชีผู้ดูแลไม่สำเร็จ'); return; }
      setData(payload);
      setMessage('');
    } catch {
      setMessage('เชื่อมต่อระบบบัญชีผู้ดูแลไม่สำเร็จ');
    }
  }

  const users = useMemo(() => (data?.adminUsers ?? []).filter((user) => {
    const matchesStatus = status === 'ALL' || user.status === status;
    const needle = query.trim().toLowerCase();
    const matchesQuery = !needle || user.username.toLowerCase().includes(needle) || user.email.toLowerCase().includes(needle) || user.roles.some((role) => role.code.toLowerCase().includes(needle));
    return matchesStatus && matchesQuery;
  }), [data, query, status]);

  return <AdminPage eyebrow="Security" title="บัญชีผู้ดูแล" description="ค้นหาและตรวจสถานะบัญชีผู้ดูแล แยกจากหน้าจัดการ Role เพื่อให้ตรวจสอบได้ง่ายขึ้น">
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
      <AdminStack>{users.map((user) => <AdminSectionRow key={user.id}><div style={userStyle}><div style={badgeStyle}><AdminBadge tone={user.status === 'ACTIVE' ? 'success' : 'danger'}>{user.status}</AdminBadge><AdminBadge tone={user.twoFactorEnabled ? 'success' : 'warning'}>{user.twoFactorEnabled ? '2FA ON' : '2FA OFF'}</AdminBadge>{user.protected && <AdminBadge tone="danger">PROTECTED</AdminBadge>}</div><strong>{user.username}</strong><span>{user.email}</span><div style={badgeStyle}>{user.roles.map((role) => <AdminBadge key={role.id}>{role.code}</AdminBadge>)}</div><small>เข้าสู่ระบบล่าสุด: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('th-TH') : 'ยังไม่มีข้อมูล'}</small></div></AdminSectionRow>)}{users.length === 0 && <AdminEmpty>ไม่พบบัญชีที่ตรงกับตัวกรอง</AdminEmpty>}</AdminStack>
    </AdminCard>
  </AdminPage>;
}

const filterStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 10 } as const;
const inputStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', width: '100%', boxSizing: 'border-box' as const };
const userStyle = { display: 'grid', gap: 8, minWidth: 0 } as const;
const badgeStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
