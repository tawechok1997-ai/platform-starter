'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminCard, AdminEmpty, AdminNotice, AdminPage, AdminSectionRow, AdminStack } from '../_components/admin-ui';

type Permission = { id: string; code: string; name: string; module: string; description?: string | null };
type Role = { id: string; code: string; name: string; description?: string | null; level: number; adminUserCount: number; permissionCount: number; hasWildcard: boolean; permissions: Permission[] };
type AccessResponse = { roles: Role[]; permissions: Permission[] };

export default function AdminRolesPage() {
  const [data, setData] = useState<AccessResponse | null>(null);
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [message, setMessage] = useState('กำลังโหลด Roles และ Permissions...');

  useEffect(() => { void load(); }, []);

  async function load() {
    try {
      const response = await adminApiFetch('/admin/access/overview');
      const payload = await response.json().catch(() => null);
      if (!response.ok) { setMessage(payload?.message ?? 'โหลดข้อมูลสิทธิ์ไม่สำเร็จ'); return; }
      setData(payload);
      setMessage('');
    } catch {
      setMessage('เชื่อมต่อระบบสิทธิ์ไม่สำเร็จ');
    }
  }

  const modules = useMemo(() => ['ALL', ...Array.from(new Set((data?.permissions ?? []).map((item) => item.module))).sort()], [data]);
  const permissions = useMemo(() => moduleFilter === 'ALL' ? data?.permissions ?? [] : (data?.permissions ?? []).filter((item) => item.module === moduleFilter), [data, moduleFilter]);

  return <AdminPage eyebrow="Security" title="Roles & Permissions" description="ตรวจโครงสร้าง Role และ Permission โดยไม่ปะปนกับหน้าบัญชีผู้ดูแล">
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminCard title="Roles" description={`${data?.roles.length ?? 0} Roles`}>
      <AdminStack>{(data?.roles ?? []).map((role) => <AdminSectionRow key={role.id}><div style={roleStyle}><div style={badgeStyle}><AdminBadge tone={role.hasWildcard ? 'danger' : 'neutral'}>{role.hasWildcard ? 'WILDCARD' : 'ROLE'}</AdminBadge><AdminBadge>Level {role.level}</AdminBadge></div><strong>{role.name}</strong><span>{role.code}</span>{role.description && <small>{role.description}</small>}<div style={badgeStyle}>{role.permissions.slice(0, 8).map((permission) => <AdminBadge key={permission.id}>{permission.code}</AdminBadge>)}{role.permissions.length > 8 && <AdminBadge>+{role.permissions.length - 8}</AdminBadge>}</div></div><div style={metaStyle}><span>{role.permissionCount} permissions</span><span>{role.adminUserCount} users</span></div></AdminSectionRow>)}{(data?.roles.length ?? 0) === 0 && <AdminEmpty>ยังไม่มี Role</AdminEmpty>}</AdminStack>
    </AdminCard>
    <AdminCard title="Permissions" description="กรองตามโมดูล">
      <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)} style={selectStyle}>{modules.map((item) => <option key={item} value={item}>{item}</option>)}</select>
      <div style={{ height: 12 }} />
      <AdminStack>{permissions.map((permission) => <AdminSectionRow key={permission.id}><div style={roleStyle}><AdminBadge>{permission.module}</AdminBadge><strong>{permission.code}</strong><span>{permission.name}</span>{permission.description && <small>{permission.description}</small>}</div></AdminSectionRow>)}{permissions.length === 0 && <AdminEmpty>ไม่มี Permission ในโมดูลนี้</AdminEmpty>}</AdminStack>
    </AdminCard>
  </AdminPage>;
}

const roleStyle = { display: 'grid', gap: 8, minWidth: 0 } as const;
const badgeStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const metaStyle = { display: 'grid', gap: 6, color: '#94a3b8', fontWeight: 800 } as const;
const selectStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 220 } as const;
