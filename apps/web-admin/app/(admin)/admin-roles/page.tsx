'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminDrawer } from '../_components/admin-drawer';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminNotice, AdminPage, AdminSectionRow, AdminStack } from '../_components/admin-ui';

type Permission = { id: string; code: string; name: string; module: string; description?: string | null };
type Role = { id: string; code: string; name: string; description?: string | null; level: number; adminUserCount: number; permissionCount: number; hasWildcard: boolean; permissions: Permission[] };
type AccessResponse = { roles: Role[]; permissions: Permission[] };

export default function AdminRolesPage() {
  const [data, setData] = useState<AccessResponse | null>(null);
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [expandedRoleId, setExpandedRoleId] = useState('');
  const [previewPermission, setPreviewPermission] = useState<Permission | null>(null);
  const [message, setMessage] = useState('กำลังโหลด Roles และ Permissions...');

  useEffect(() => { void load(); }, []);

  async function load() {
    try {
      const response = await adminApiFetch('/admin/access/overview');
      const payload = await response.json().catch(() => null);
      if (!response.ok) { setMessage('โหลดข้อมูลสิทธิ์ไม่สำเร็จ'); return; }
      setData(payload);
      setMessage('');
    } catch {
      setMessage('เชื่อมต่อระบบสิทธิ์ไม่สำเร็จ');
    }
  }

  const modules = useMemo(() => ['ALL', ...Array.from(new Set((data?.permissions ?? []).map((item) => item.module))).sort()], [data]);
  const normalizedQuery = query.trim().toLowerCase();
  const roles = useMemo(() => (data?.roles ?? []).filter((role) => !normalizedQuery || [role.name, role.code, role.description ?? '', ...role.permissions.flatMap((permission) => [permission.code, permission.name, permission.module])].some((value) => value.toLowerCase().includes(normalizedQuery))), [data, normalizedQuery]);
  const permissions = useMemo(() => (data?.permissions ?? []).filter((item) => (moduleFilter === 'ALL' || item.module === moduleFilter) && (!normalizedQuery || [item.code, item.name, item.module, item.description ?? ''].some((value) => value.toLowerCase().includes(normalizedQuery)))), [data, moduleFilter, normalizedQuery]);

  return <AdminPage eyebrow="Security" title="Roles & Permissions" description="ตรวจโครงสร้าง Role และ Permission โดยไม่ปะปนกับหน้าบัญชีผู้ดูแล">
    <div className="admin-governance-page">
      {message && <AdminNotice>{message}</AdminNotice>}
      <div className="admin-governance-toolbar" role="search">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหา Role, Permission หรือ Module" aria-label="ค้นหา Role และ Permission" />
        <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)} aria-label="กรอง Permission ตามโมดูล">{modules.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        {(query || moduleFilter !== 'ALL') && <AdminButton size="compact" tone="ghost" onClick={() => { setQuery(''); setModuleFilter('ALL'); }}>ล้างตัวกรอง</AdminButton>}
      </div>

      <AdminCard title="Roles" description={`${roles.length} Roles`}>
        <div className="admin-role-list">{roles.map((role) => {
          const expanded = expandedRoleId === role.id;
          return <AdminSectionRow key={role.id}>
            <div className="admin-role-row">
              <div className="admin-role-main">
                <div className="admin-role-badges"><AdminBadge tone={role.hasWildcard ? 'danger' : 'neutral'}>{role.hasWildcard ? 'WILDCARD' : 'ROLE'}</AdminBadge><AdminBadge>Level {role.level}</AdminBadge></div>
                <strong>{role.name}</strong>
                <span>{role.code}</span>
                {role.description && <small>{role.description}</small>}
                {expanded && <div className="admin-permission-grid">{role.permissions.map((permission) => <button type="button" key={permission.id} className="admin-permission-chip" onClick={() => setPreviewPermission(permission)}><AdminBadge>{permission.module}</AdminBadge><span>{permission.code}</span></button>)}</div>}
              </div>
              <div className="admin-role-meta"><span>{role.permissionCount} permissions</span><span>{role.adminUserCount} users</span><AdminButton size="compact" tone="secondary" onClick={() => setExpandedRoleId(expanded ? '' : role.id)}>{expanded ? 'ย่อ' : 'ดู Permission'}</AdminButton></div>
            </div>
          </AdminSectionRow>;
        })}{roles.length === 0 && <AdminEmpty>ไม่พบ Role ตามคำค้นหา</AdminEmpty>}</div>
      </AdminCard>

      <AdminCard title="Permissions" description={`${permissions.length} รายการ`}>
        <div className="admin-permission-list">{permissions.map((permission) => <AdminSectionRow key={permission.id}>
          <div className="admin-permission-row">
            <div className="admin-permission-main"><div className="admin-permission-badges"><AdminBadge>{permission.module}</AdminBadge></div><strong>{permission.code}</strong><span>{permission.name}</span>{permission.description && <small>{permission.description}</small>}</div>
            <AdminButton size="compact" tone="secondary" onClick={() => setPreviewPermission(permission)}>ดูรายละเอียด</AdminButton>
          </div>
        </AdminSectionRow>)}{permissions.length === 0 && <AdminEmpty>ไม่มี Permission ตามเงื่อนไข</AdminEmpty>}</div>
      </AdminCard>

      <AdminDrawer open={Boolean(previewPermission)} title={previewPermission?.code ?? 'Permission preview'} description={previewPermission ? `${previewPermission.module} · ${previewPermission.name}` : undefined} closeLabel="ปิด" size="compact" onClose={() => setPreviewPermission(null)}>
        {previewPermission && <AdminStack><div className="admin-governance-detail"><span>ชื่อ</span><strong>{previewPermission.name}</strong></div><div className="admin-governance-detail"><span>โมดูล</span><strong>{previewPermission.module}</strong></div><div className="admin-governance-detail"><span>คำอธิบาย</span><strong>{previewPermission.description || 'ไม่มีคำอธิบาย'}</strong></div><AdminNotice tone="warning">หน้านี้เป็น read-only preview ยังไม่มีการแก้ไขสิทธิ์หรือบันทึก Role</AdminNotice></AdminStack>}
      </AdminDrawer>
    </div>
  </AdminPage>;
}