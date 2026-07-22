'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminNotice, AdminPage, AdminSectionRow, AdminStack, AdminToolbar } from '../_components/admin-ui';

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
    {message && <AdminNotice>{message}</AdminNotice>}
    <AdminToolbar>
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหา Role, Permission หรือ Module" aria-label="ค้นหา Role และ Permission" style={inputStyle} />
      <select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)} style={selectStyle} aria-label="กรอง Permission ตามโมดูล">{modules.map((item) => <option key={item} value={item}>{item}</option>)}</select>
      {(query || moduleFilter !== 'ALL') && <AdminButton size="compact" tone="ghost" onClick={() => { setQuery(''); setModuleFilter('ALL'); }}>ล้างตัวกรอง</AdminButton>}
    </AdminToolbar>

    <AdminCard title="Roles" description={`${roles.length} Roles`}>
      <AdminStack>{roles.map((role) => { const expanded = expandedRoleId === role.id; return <AdminSectionRow key={role.id}><div style={roleStyle}><div style={badgeStyle}><AdminBadge tone={role.hasWildcard ? 'danger' : 'neutral'}>{role.hasWildcard ? 'WILDCARD' : 'ROLE'}</AdminBadge><AdminBadge>Level {role.level}</AdminBadge></div><strong>{role.name}</strong><span>{role.code}</span>{role.description && <small>{role.description}</small>}{expanded && <div style={permissionGridStyle}>{role.permissions.map((permission) => <button type="button" key={permission.id} style={permissionButtonStyle} onClick={() => setPreviewPermission(permission)}><AdminBadge>{permission.module}</AdminBadge><span>{permission.code}</span></button>)}</div>}</div><div style={metaStyle}><span>{role.permissionCount} permissions</span><span>{role.adminUserCount} users</span><AdminButton size="compact" tone="secondary" onClick={() => setExpandedRoleId(expanded ? '' : role.id)}>{expanded ? 'ย่อ' : 'ดู Permission'}</AdminButton></div></AdminSectionRow>; })}{roles.length === 0 && <AdminEmpty>ไม่พบ Role ตามคำค้นหา</AdminEmpty>}</AdminStack>
    </AdminCard>

    <AdminCard title="Permissions" description={`${permissions.length} รายการ`}>
      <AdminStack>{permissions.map((permission) => <AdminSectionRow key={permission.id}><div style={roleStyle}><AdminBadge>{permission.module}</AdminBadge><strong>{permission.code}</strong><span>{permission.name}</span>{permission.description && <small>{permission.description}</small>}</div><AdminButton size="compact" tone="secondary" onClick={() => setPreviewPermission(permission)}>ดูรายละเอียด</AdminButton></AdminSectionRow>)}{permissions.length === 0 && <AdminEmpty>ไม่มี Permission ตามเงื่อนไข</AdminEmpty>}</AdminStack>
    </AdminCard>

    {previewPermission && <div style={drawerLayerStyle} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewPermission(null); }}><aside role="dialog" aria-modal="true" aria-label="Permission preview" style={drawerStyle}><AdminStack><div style={drawerHeaderStyle}><div><AdminBadge>{previewPermission.module}</AdminBadge><h2 style={drawerTitleStyle}>{previewPermission.code}</h2></div><AdminButton size="compact" tone="ghost" onClick={() => setPreviewPermission(null)}>ปิด</AdminButton></div><div style={detailStyle}><span>ชื่อ</span><strong>{previewPermission.name}</strong></div><div style={detailStyle}><span>โมดูล</span><strong>{previewPermission.module}</strong></div><div style={detailStyle}><span>คำอธิบาย</span><strong>{previewPermission.description || 'ไม่มีคำอธิบาย'}</strong></div><AdminNotice tone="warning">หน้านี้เป็น read-only preview ยังไม่มีการแก้ไขสิทธิ์หรือบันทึก Role</AdminNotice></AdminStack></aside></div>}
  </AdminPage>;
}

const roleStyle = { display: 'grid', gap: 8, minWidth: 0 } as const;
const badgeStyle = { display: 'flex', gap: 8, flexWrap: 'wrap' as const };
const metaStyle = { display: 'grid', gap: 6, color: '#94a3b8', fontWeight: 800, justifyItems: 'end' as const };
const inputStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 260, flex: 1 } as const;
const selectStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.22)', background: '#0b1220', color: '#f8fafc', padding: '0 12px', minWidth: 220 } as const;
const permissionGridStyle = { display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))' } as const;
const permissionButtonStyle = { minHeight: 44, borderRadius: 12, border: '1px solid rgba(148,163,184,.18)', background: 'rgba(15,23,42,.72)', color: '#f8fafc', padding: 10, display: 'flex', gap: 8, alignItems: 'center', cursor: 'pointer', textAlign: 'left' as const } as const;
const drawerLayerStyle = { position: 'fixed' as const, inset: 0, zIndex: 9000, display: 'flex', justifyContent: 'flex-end', background: 'rgba(2,6,23,.62)', backdropFilter: 'blur(5px)' };
const drawerStyle = { width: 'min(480px, 100%)', height: '100%', overflow: 'auto' as const, padding: 24, background: '#111823', borderLeft: '1px solid rgba(148,163,184,.22)' };
const drawerHeaderStyle = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' } as const;
const drawerTitleStyle = { margin: '10px 0 0', fontSize: 24 } as const;
const detailStyle = { display: 'grid', gap: 6, padding: 12, borderRadius: 12, background: 'rgba(148,163,184,.08)' } as const;
