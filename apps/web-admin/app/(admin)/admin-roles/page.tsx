'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminDrawer } from '../_components/admin-drawer';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminStack } from '../_components/admin-ui';
import { useAdminLocale, type AdminLocale } from '../admin-locale';
import { AdminDataTable, type AdminDataColumn } from '../../../src/features/admin-modernization/data-table';
import { AdminWorkspaceTabs } from '../../../src/features/admin-modernization/workspace-tabs';

type Permission = { id: string; code: string; name: string; module: string; description?: string | null };
type Role = { id: string; code: string; name: string; description?: string | null; level: number; adminUserCount: number; permissionCount: number; hasWildcard: boolean; permissions: Permission[] };
type AccessResponse = { roles: Role[]; permissions: Permission[] };

type Copy = {
  eyebrow: string;
  title: string;
  description: string;
  loading: string;
  loadFailed: string;
  connectionFailed: string;
  refresh: string;
  search: string;
  searchPlaceholder: string;
  module: string;
  allModules: string;
  clearFilters: string;
  roleCount: string;
  permissionCount: string;
  moduleCount: string;
  wildcardRoles: string;
  roles: string;
  roleDescription: (count: number) => string;
  permissions: string;
  permissionDescription: (count: number) => string;
  level: string;
  users: string;
  permissionItems: string;
  showPermissions: string;
  hidePermissions: string;
  noRoles: string;
  noPermissions: string;
  noPermissionsHelp: string;
  code: string;
  name: string;
  details: string;
  descriptionLabel: string;
  noDescription: string;
  close: string;
  readOnly: string;
  previousPage: string;
  nextPage: string;
  page: string;
  rowsPerPage: string;
};

const copyByLocale: Record<AdminLocale, Copy> = {
  th: {
    eyebrow: 'สิทธิ์และความปลอดภัย',
    title: 'บทบาทและสิทธิ์',
    description: 'ตรวจโครงสร้างสิทธิ์แบบกระชับ แยกตามบทบาทและโมดูล',
    loading: 'กำลังโหลดบทบาทและสิทธิ์...',
    loadFailed: 'โหลดข้อมูลสิทธิ์ไม่สำเร็จ',
    connectionFailed: 'เชื่อมต่อระบบสิทธิ์ไม่สำเร็จ',
    refresh: 'รีเฟรช',
    search: 'ค้นหา',
    searchPlaceholder: 'ชื่อ บทบาท รหัสสิทธิ์ หรือโมดูล',
    module: 'โมดูล',
    allModules: 'ทุกโมดูล',
    clearFilters: 'ล้างตัวกรอง',
    roleCount: 'บทบาท',
    permissionCount: 'สิทธิ์ทั้งหมด',
    moduleCount: 'โมดูล',
    wildcardRoles: 'บทบาทสิทธิ์ทั้งหมด',
    roles: 'บทบาท',
    roleDescription: (count) => `${count.toLocaleString('th-TH')} บทบาทตามเงื่อนไข`,
    permissions: 'รายการสิทธิ์',
    permissionDescription: (count) => `${count.toLocaleString('th-TH')} รายการตามเงื่อนไข`,
    level: 'ระดับ',
    users: 'ผู้ดูแล',
    permissionItems: 'สิทธิ์',
    showPermissions: 'เปิดรายการสิทธิ์',
    hidePermissions: 'ซ่อนรายการสิทธิ์',
    noRoles: 'ไม่พบบทบาทตามคำค้นหา',
    noPermissions: 'ไม่พบสิทธิ์ตามเงื่อนไข',
    noPermissionsHelp: 'ลองเปลี่ยนคำค้นหาหรือเลือกโมดูลอื่น',
    code: 'รหัสสิทธิ์',
    name: 'ชื่อ',
    details: 'รายละเอียด',
    descriptionLabel: 'คำอธิบาย',
    noDescription: 'ไม่มีคำอธิบาย',
    close: 'ปิด',
    readOnly: 'หน้านี้เป็นข้อมูลแบบอ่านอย่างเดียว การแก้บทบาทหรือสิทธิ์ต้องใช้ขั้นตอนเฉพาะและบันทึก Audit',
    previousPage: 'หน้าก่อนหน้า',
    nextPage: 'หน้าถัดไป',
    page: 'หน้า',
    rowsPerPage: 'รายการต่อหน้า',
  },
  en: {
    eyebrow: 'Access & security',
    title: 'Roles & permissions',
    description: 'Review access structure by role and module without an endless permission list',
    loading: 'Loading roles and permissions...',
    loadFailed: 'Unable to load access data',
    connectionFailed: 'Unable to connect to the access service',
    refresh: 'Refresh',
    search: 'Search',
    searchPlaceholder: 'Name, role, permission code, or module',
    module: 'Module',
    allModules: 'All modules',
    clearFilters: 'Clear filters',
    roleCount: 'Roles',
    permissionCount: 'Permissions',
    moduleCount: 'Modules',
    wildcardRoles: 'Wildcard roles',
    roles: 'Roles',
    roleDescription: (count) => `${count.toLocaleString('en-US')} roles match the filters`,
    permissions: 'Permission catalog',
    permissionDescription: (count) => `${count.toLocaleString('en-US')} permissions match the filters`,
    level: 'Level',
    users: 'Administrators',
    permissionItems: 'Permissions',
    showPermissions: 'Show permissions',
    hidePermissions: 'Hide permissions',
    noRoles: 'No roles match the search',
    noPermissions: 'No permissions match the filters',
    noPermissionsHelp: 'Try another search or module.',
    code: 'Permission code',
    name: 'Name',
    details: 'Details',
    descriptionLabel: 'Description',
    noDescription: 'No description',
    close: 'Close',
    readOnly: 'This is a read-only catalog. Role and permission changes require a dedicated audited workflow.',
    previousPage: 'Previous page',
    nextPage: 'Next page',
    page: 'Page',
    rowsPerPage: 'Rows per page',
  },
};

export default function AdminRolesPage() {
  const [locale] = useAdminLocale();
  const copy = copyByLocale[locale];
  const numberLocale = locale === 'th' ? 'th-TH' : 'en-US';
  const [data, setData] = useState<AccessResponse | null>(null);
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [expandedRoleId, setExpandedRoleId] = useState('');
  const [previewPermission, setPreviewPermission] = useState<Permission | null>(null);
  const [message, setMessage] = useState(copy.loading);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => { void load(); }, []);
  useEffect(() => { setPage(1); }, [query, moduleFilter, pageSize]);
  useEffect(() => { if (loading) setMessage(copy.loading); }, [copy.loading, loading]);

  async function load() {
    setLoading(true);
    setMessage(copy.loading);
    try {
      const response = await adminApiFetch('/admin/access/overview');
      const payload = await response.json().catch(() => null);
      if (!response.ok || !isAccessResponse(payload)) {
        setData(null);
        setMessage(copy.loadFailed);
        return;
      }
      setData(payload);
      setMessage('');
    } catch {
      setData(null);
      setMessage(copy.connectionFailed);
    } finally {
      setLoading(false);
    }
  }

  const modules = useMemo(() => ['ALL', ...Array.from(new Set((data?.permissions ?? []).map((item) => item.module))).sort()], [data]);
  const normalizedQuery = query.trim().toLowerCase();
  const roles = useMemo(() => (data?.roles ?? []).filter((role) => !normalizedQuery || [
    role.name,
    role.code,
    role.description ?? '',
    ...role.permissions.flatMap((permission) => [permission.code, permission.name, permission.module]),
  ].some((value) => value.toLowerCase().includes(normalizedQuery))), [data, normalizedQuery]);
  const permissions = useMemo(() => (data?.permissions ?? []).filter((item) =>
    (moduleFilter === 'ALL' || item.module === moduleFilter)
    && (!normalizedQuery || [item.code, item.name, item.module, item.description ?? ''].some((value) => value.toLowerCase().includes(normalizedQuery))),
  [data, moduleFilter, normalizedQuery]);
  const visiblePermissions = useMemo(() => permissions.slice((page - 1) * pageSize, page * pageSize), [page, pageSize, permissions]);

  const columns = useMemo<readonly AdminDataColumn<Permission>[]>(() => [
    {
      id: 'module',
      header: copy.module,
      mobileLabel: copy.module,
      priority: 'secondary',
      width: '16%',
      cell: (permission) => <AdminBadge>{permission.module}</AdminBadge>,
    },
    {
      id: 'code',
      header: copy.code,
      mobileLabel: copy.code,
      priority: 'primary',
      width: '30%',
      cell: (permission) => <code className="admin-permission-code">{permission.code}</code>,
    },
    {
      id: 'name',
      header: copy.name,
      mobileLabel: copy.name,
      priority: 'primary',
      width: '22%',
      cell: (permission) => <strong>{permission.name}</strong>,
    },
    {
      id: 'description',
      header: copy.descriptionLabel,
      mobileLabel: copy.descriptionLabel,
      priority: 'tertiary',
      cell: (permission) => permission.description || copy.noDescription,
    },
    {
      id: 'details',
      header: '',
      mobileLabel: copy.details,
      align: 'end',
      priority: 'secondary',
      width: '1%',
      cell: (permission) => <AdminButton size="compact" tone="secondary" onClick={() => setPreviewPermission(permission)}>{copy.details}</AdminButton>,
    },
  ], [copy]);

  return <AdminPage eyebrow={copy.eyebrow} title={copy.title} description={copy.description} actions={<AdminButton onClick={() => void load()} disabled={loading}>{copy.refresh}</AdminButton>}>
    <AdminWorkspaceTabs
      ariaLabel={copy.eyebrow}
      activeId="roles"
      tabs={[
        { id: 'accounts', label: locale === 'th' ? 'บัญชีผู้ดูแล' : 'Admin accounts', href: '/admin-accounts' },
        { id: 'roles', label: copy.title, shortLabel: locale === 'th' ? 'สิทธิ์' : 'Roles', href: '/admin-roles' },
        { id: 'invitations', label: locale === 'th' ? 'คำเชิญ' : 'Invitations', href: '/admin-invitations' },
        { id: 'audit', label: locale === 'th' ? 'บันทึกการใช้งาน' : 'Audit logs', href: '/audit' },
        { id: 'security', label: locale === 'th' ? 'ความปลอดภัย' : 'Security', href: '/security' },
        { id: 'anti-bot', label: locale === 'th' ? 'ป้องกันบอต' : 'Bot protection', href: '/anti-bot' },
      ]}
    />

    <div className="admin-governance-page admin-roles-modernized">
      {message && <AdminNotice tone={message === copy.loading ? 'neutral' : 'danger'}>{message}</AdminNotice>}

      <AdminMetricGrid>
        <AdminMetric title={copy.roleCount} value={(data?.roles.length ?? 0).toLocaleString(numberLocale)} helper={copy.roles} />
        <AdminMetric title={copy.permissionCount} value={(data?.permissions.length ?? 0).toLocaleString(numberLocale)} helper={copy.permissions} />
        <AdminMetric title={copy.moduleCount} value={Math.max(0, modules.length - 1).toLocaleString(numberLocale)} helper={copy.module} />
        <AdminMetric title={copy.wildcardRoles} value={(data?.roles.filter((role) => role.hasWildcard).length ?? 0).toLocaleString(numberLocale)} helper={copy.readOnly} tone="warning" />
      </AdminMetricGrid>

      <div className="admin-governance-toolbar" role="search">
        <label className="admin-modern-filter-field"><span>{copy.search}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.searchPlaceholder} /></label>
        <label className="admin-modern-filter-field"><span>{copy.module}</span><select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)}>{modules.map((item) => <option key={item} value={item}>{item === 'ALL' ? copy.allModules : item}</option>)}</select></label>
        {(query || moduleFilter !== 'ALL') && <AdminButton size="compact" tone="ghost" onClick={() => { setQuery(''); setModuleFilter('ALL'); }}>{copy.clearFilters}</AdminButton>}
      </div>

      <AdminCard title={copy.roles} description={copy.roleDescription(roles.length)}>
        <div className="admin-role-modern-list">{roles.map((role) => {
          const expanded = expandedRoleId === role.id;
          const permissionGroups = groupPermissions(role.permissions);
          return <article className="admin-role-modern-card" key={role.id}>
            <header>
              <div>
                <span className="admin-role-badges"><AdminBadge tone={role.hasWildcard ? 'danger' : 'neutral'}>{role.hasWildcard ? 'WILDCARD' : 'ROLE'}</AdminBadge><AdminBadge>{copy.level} {role.level}</AdminBadge></span>
                <strong>{role.name}</strong>
                <code>{role.code}</code>
                {role.description && <p>{role.description}</p>}
              </div>
              <dl>
                <div><dt>{copy.permissionItems}</dt><dd>{role.permissionCount.toLocaleString(numberLocale)}</dd></div>
                <div><dt>{copy.users}</dt><dd>{role.adminUserCount.toLocaleString(numberLocale)}</dd></div>
              </dl>
            </header>
            <AdminButton size="compact" tone="secondary" onClick={() => setExpandedRoleId(expanded ? '' : role.id)}>{expanded ? copy.hidePermissions : copy.showPermissions}</AdminButton>
            {expanded && <div className="admin-role-permission-groups">{permissionGroups.map(([module, modulePermissions]) => <details key={module}>
              <summary><span>{module}</span><AdminBadge>{modulePermissions.length.toLocaleString(numberLocale)}</AdminBadge></summary>
              <div>{modulePermissions.map((permission) => <button type="button" key={permission.id} onClick={() => setPreviewPermission(permission)}><code>{permission.code}</code><span>{permission.name}</span></button>)}</div>
            </details>)}</div>}
          </article>;
        })}{roles.length === 0 && <AdminEmpty>{copy.noRoles}</AdminEmpty>}</div>
      </AdminCard>

      <AdminCard title={copy.permissions} description={copy.permissionDescription(permissions.length)}>
        <AdminDataTable
          ariaLabel={copy.permissions}
          columns={columns}
          rows={visiblePermissions}
          rowKey={(permission) => permission.id}
          loading={loading}
          emptyTitle={copy.noPermissions}
          emptyDescription={copy.noPermissionsHelp}
          page={page}
          pageSize={pageSize}
          totalItems={permissions.length}
          pageSizeOptions={[20, 50, 100]}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          labels={{
            loading: copy.loading,
            empty: copy.noPermissions,
            previousPage: copy.previousPage,
            nextPage: copy.nextPage,
            page: (pageNumber) => `${copy.page} ${pageNumber.toLocaleString(numberLocale)}`,
            rowsPerPage: copy.rowsPerPage,
            range: (from, to, total) => locale === 'th' ? `${from.toLocaleString(numberLocale)}–${to.toLocaleString(numberLocale)} จาก ${total.toLocaleString(numberLocale)}` : `${from.toLocaleString(numberLocale)}–${to.toLocaleString(numberLocale)} of ${total.toLocaleString(numberLocale)}`,
          }}
        />
      </AdminCard>

      <AdminDrawer open={Boolean(previewPermission)} title={previewPermission?.code ?? copy.details} description={previewPermission ? `${previewPermission.module} · ${previewPermission.name}` : undefined} closeLabel={copy.close} size="compact" onClose={() => setPreviewPermission(null)}>
        {previewPermission && <AdminStack><div className="admin-governance-detail"><span>{copy.name}</span><strong>{previewPermission.name}</strong></div><div className="admin-governance-detail"><span>{copy.module}</span><strong>{previewPermission.module}</strong></div><div className="admin-governance-detail"><span>{copy.descriptionLabel}</span><strong>{previewPermission.description || copy.noDescription}</strong></div><AdminNotice tone="warning">{copy.readOnly}</AdminNotice></AdminStack>}
      </AdminDrawer>
    </div>
  </AdminPage>;
}

function groupPermissions(permissions: readonly Permission[]) {
  const groups = new Map<string, Permission[]>();
  for (const permission of permissions) {
    const current = groups.get(permission.module) ?? [];
    current.push(permission);
    groups.set(permission.module, current);
  }
  return [...groups.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([module, items]) => [module, items.sort((left, right) => left.code.localeCompare(right.code))] as const);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isPermission(value: unknown): value is Permission {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.code === 'string'
    && typeof value.name === 'string'
    && typeof value.module === 'string'
    && (value.description === undefined || value.description === null || typeof value.description === 'string');
}

function isRole(value: unknown): value is Role {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.code === 'string'
    && typeof value.name === 'string'
    && typeof value.level === 'number'
    && typeof value.adminUserCount === 'number'
    && typeof value.permissionCount === 'number'
    && typeof value.hasWildcard === 'boolean'
    && Array.isArray(value.permissions)
    && value.permissions.every(isPermission);
}

function isAccessResponse(value: unknown): value is AccessResponse {
  return isRecord(value)
    && Array.isArray(value.roles)
    && value.roles.every(isRole)
    && Array.isArray(value.permissions)
    && value.permissions.every(isPermission);
}
