'use client';

import { useEffect, useMemo, useState } from 'react';
import { adminApiFetch } from '../../admin-api';
import { AdminDrawer } from '../_components/admin-drawer';
import { AdminBadge, AdminButton, AdminCard, AdminEmpty, AdminMetric, AdminMetricGrid, AdminNotice, AdminPage, AdminStack } from '../_components/admin-ui';
import { useAdminLocale, type AdminLocale } from '../admin-locale';
import { AdminDataTable, type AdminDataColumn } from '../../../src/features/admin-modernization/data-table';
import { AdminWorkspaceTabs } from '../../../src/features/admin-modernization/workspace-tabs';
import { canAccessPath } from '../admin-nav';

type Permission = { id: string; code: string; name: string; module: string; description?: string | null };
type Role = { id: string; code: string; name: string; description?: string | null; level: number; adminUserCount: number; permissionCount: number; hasWildcard: boolean; permissions: Permission[] };
type AccessResponse = { roles: Role[]; permissions: Permission[] };
type CurrentAdminResponse = { permissions?: string[] };
type LoadState = 'loading' | 'ready' | 'error';

type Copy = {
  title: string;
  description: string;
  loading: string;
  error: string;
  refresh: string;
  search: string;
  searchPlaceholder: string;
  module: string;
  allModules: string;
  clear: string;
  roles: string;
  permissions: string;
  modules: string;
  wildcard: string;
  level: string;
  users: string;
  show: string;
  hide: string;
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
  previous: string;
  next: string;
  page: string;
  rowsPerPage: string;
};

const COPY: Record<AdminLocale, Copy> = {
  th: {
    title: 'บทบาทและสิทธิ์',
    description: 'ตรวจโครงสร้างสิทธิ์แบบกระชับ แยกตามบทบาทและโมดูล',
    loading: 'กำลังโหลดบทบาทและสิทธิ์...',
    error: 'โหลดข้อมูลสิทธิ์ไม่สำเร็จ',
    refresh: 'รีเฟรช',
    search: 'ค้นหา',
    searchPlaceholder: 'ชื่อ บทบาท รหัสสิทธิ์ หรือโมดูล',
    module: 'โมดูล',
    allModules: 'ทุกโมดูล',
    clear: 'ล้างตัวกรอง',
    roles: 'บทบาท',
    permissions: 'สิทธิ์ทั้งหมด',
    modules: 'โมดูล',
    wildcard: 'บทบาทสิทธิ์ทั้งหมด',
    level: 'ระดับ',
    users: 'ผู้ดูแล',
    show: 'เปิดรายการสิทธิ์',
    hide: 'ซ่อนรายการสิทธิ์',
    noRoles: 'ไม่พบบทบาทตามคำค้นหา',
    noPermissions: 'ไม่พบสิทธิ์ตามเงื่อนไข',
    noPermissionsHelp: 'ลองเปลี่ยนคำค้นหาหรือเลือกโมดูลอื่น',
    code: 'รหัสสิทธิ์',
    name: 'ชื่อ',
    details: 'รายละเอียด',
    descriptionLabel: 'คำอธิบาย',
    noDescription: 'ไม่มีคำอธิบาย',
    close: 'ปิด',
    readOnly: 'หน้านี้เป็นข้อมูลแบบอ่านอย่างเดียว การแก้บทบาทหรือสิทธิ์ต้องผ่านขั้นตอนเฉพาะและบันทึก Audit',
    previous: 'หน้าก่อนหน้า',
    next: 'หน้าถัดไป',
    page: 'หน้า',
    rowsPerPage: 'รายการต่อหน้า',
  },
  en: {
    title: 'Roles & permissions',
    description: 'Review access by role and module without an endless permission list',
    loading: 'Loading roles and permissions...',
    error: 'Unable to load access data',
    refresh: 'Refresh',
    search: 'Search',
    searchPlaceholder: 'Name, role, permission code, or module',
    module: 'Module',
    allModules: 'All modules',
    clear: 'Clear filters',
    roles: 'Roles',
    permissions: 'Permissions',
    modules: 'Modules',
    wildcard: 'Wildcard roles',
    level: 'Level',
    users: 'Administrators',
    show: 'Show permissions',
    hide: 'Hide permissions',
    noRoles: 'No roles match the search',
    noPermissions: 'No permissions match the filters',
    noPermissionsHelp: 'Try another search or module.',
    code: 'Permission code',
    name: 'Name',
    details: 'Details',
    descriptionLabel: 'Description',
    noDescription: 'No description',
    close: 'Close',
    readOnly: 'This catalog is read-only. Access changes require a dedicated audited workflow.',
    previous: 'Previous page',
    next: 'Next page',
    page: 'Page',
    rowsPerPage: 'Rows per page',
  },
};

export default function AdminRolesPage() {
  const [locale] = useAdminLocale();
  const copy = COPY[locale];
  const numberLocale = locale === 'th' ? 'th-TH' : 'en-US';
  const [data, setData] = useState<AccessResponse>({ roles: [], permissions: [] });
  const [currentPermissions, setCurrentPermissions] = useState<string[]>(['admin.access.view']);
  const [state, setState] = useState<LoadState>('loading');
  const [query, setQuery] = useState('');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [expandedRoleId, setExpandedRoleId] = useState('');
  const [previewPermission, setPreviewPermission] = useState<Permission | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => { void load(); }, []);
  useEffect(() => { setPage(1); }, [query, moduleFilter, pageSize]);

  async function load() {
    setState('loading');
    try {
      const [response, currentAdminResponse] = await Promise.all([
        adminApiFetch('/admin/access/overview'),
        adminApiFetch('/admin/auth/me'),
      ]);
      const [payload, currentAdminPayload]: [unknown, unknown] = await Promise.all([
        response.json().catch(() => null),
        currentAdminResponse.json().catch(() => null),
      ]);
      if (!response.ok || !isAccessResponse(payload)) throw new Error('invalid access response');
      setData(payload);
      setCurrentPermissions(currentAdminResponse.ok && isCurrentAdminResponse(currentAdminPayload)
        ? currentAdminPayload.permissions ?? []
        : ['admin.access.view']);
      setState('ready');
    } catch {
      setData({ roles: [], permissions: [] });
      setState('error');
    }
  }

  const normalizedQuery = query.trim().toLowerCase();
  const moduleOptions = useMemo(() => ['ALL', ...new Set(data.permissions.map((permission) => permission.module))].sort(), [data.permissions]);
  const filteredRoles = useMemo(() => data.roles.filter((role) => !normalizedQuery || [
    role.name,
    role.code,
    role.description ?? '',
    ...role.permissions.flatMap((permission) => [permission.code, permission.name, permission.module]),
  ].some((value) => value.toLowerCase().includes(normalizedQuery))), [data.roles, normalizedQuery]);
  const filteredPermissions = useMemo(() => data.permissions.filter((permission) => {
    const moduleMatches = moduleFilter === 'ALL' || permission.module === moduleFilter;
    const queryMatches = !normalizedQuery || [permission.code, permission.name, permission.module, permission.description ?? '']
      .some((value) => value.toLowerCase().includes(normalizedQuery));
    return moduleMatches && queryMatches;
  }), [data.permissions, moduleFilter, normalizedQuery]);
  const visiblePermissions = useMemo(
    () => filteredPermissions.slice((page - 1) * pageSize, page * pageSize),
    [filteredPermissions, page, pageSize],
  );

  const columns = useMemo<readonly AdminDataColumn<Permission>[]>(() => [
    { id: 'module', header: copy.module, mobileLabel: copy.module, priority: 'secondary', width: '16%', cell: (permission) => <AdminBadge>{permission.module}</AdminBadge> },
    { id: 'code', header: copy.code, mobileLabel: copy.code, priority: 'primary', width: '30%', cell: (permission) => <code className="admin-permission-code">{permission.code}</code> },
    { id: 'name', header: copy.name, mobileLabel: copy.name, priority: 'primary', width: '22%', cell: (permission) => <strong>{permission.name}</strong> },
    { id: 'description', header: copy.descriptionLabel, mobileLabel: copy.descriptionLabel, priority: 'tertiary', cell: (permission) => permission.description || copy.noDescription },
    { id: 'details', header: '', mobileLabel: copy.details, align: 'end', priority: 'secondary', width: '1%', cell: (permission) => <AdminButton size="compact" tone="secondary" onClick={() => setPreviewPermission(permission)}>{copy.details}</AdminButton> },
  ], [copy]);

  return <AdminPage
    eyebrow={locale === 'th' ? 'สิทธิ์และความปลอดภัย' : 'Access & security'}
    title={copy.title}
    description={copy.description}
    actions={<AdminButton onClick={() => void load()} disabled={state === 'loading'}>{copy.refresh}</AdminButton>}
  >
    <AdminWorkspaceTabs
      ariaLabel={locale === 'th' ? 'เมนูสิทธิ์และความปลอดภัย' : 'Access and security navigation'}
      activeId="roles"
      tabs={accessTabs(locale, copy.title).filter((tab) => canAccessPath(tab.href, currentPermissions))}
    />

    <div className="admin-governance-page admin-roles-modernized">
      {state !== 'ready' && <AdminNotice tone={state === 'error' ? 'danger' : 'neutral'}>{state === 'error' ? copy.error : copy.loading}</AdminNotice>}

      <AdminMetricGrid>
        <AdminMetric title={copy.roles} value={data.roles.length.toLocaleString(numberLocale)} />
        <AdminMetric title={copy.permissions} value={data.permissions.length.toLocaleString(numberLocale)} />
        <AdminMetric title={copy.modules} value={Math.max(0, moduleOptions.length - 1).toLocaleString(numberLocale)} />
        <AdminMetric title={copy.wildcard} value={data.roles.filter((role) => role.hasWildcard).length.toLocaleString(numberLocale)} tone="warning" />
      </AdminMetricGrid>

      <div className="admin-governance-toolbar" role="search">
        <label className="admin-modern-filter-field"><span>{copy.search}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.searchPlaceholder} /></label>
        <label className="admin-modern-filter-field"><span>{copy.module}</span><select value={moduleFilter} onChange={(event) => setModuleFilter(event.target.value)}>{moduleOptions.map((module) => <option key={module} value={module}>{module === 'ALL' ? copy.allModules : module}</option>)}</select></label>
        {(query || moduleFilter !== 'ALL') && <AdminButton size="compact" tone="ghost" onClick={() => { setQuery(''); setModuleFilter('ALL'); }}>{copy.clear}</AdminButton>}
      </div>

      <AdminCard title={copy.roles} description={`${filteredRoles.length.toLocaleString(numberLocale)} ${copy.roles}`}>
        <div className="admin-role-modern-list">
          {filteredRoles.map((role) => <RoleCard
            key={role.id}
            role={role}
            copy={copy}
            locale={numberLocale}
            expanded={expandedRoleId === role.id}
            onToggle={() => setExpandedRoleId(expandedRoleId === role.id ? '' : role.id)}
            onPermission={setPreviewPermission}
          />)}
          {filteredRoles.length === 0 && <AdminEmpty>{copy.noRoles}</AdminEmpty>}
        </div>
      </AdminCard>

      <AdminCard title={copy.permissions} description={`${filteredPermissions.length.toLocaleString(numberLocale)} ${copy.permissions}`}>
        <AdminDataTable
          ariaLabel={copy.permissions}
          columns={columns}
          rows={visiblePermissions}
          rowKey={(permission) => permission.id}
          loading={state === 'loading'}
          emptyTitle={copy.noPermissions}
          emptyDescription={copy.noPermissionsHelp}
          page={page}
          pageSize={pageSize}
          totalItems={filteredPermissions.length}
          pageSizeOptions={[20, 50, 100]}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          labels={{
            loading: copy.loading,
            empty: copy.noPermissions,
            previousPage: copy.previous,
            nextPage: copy.next,
            page: (value) => `${copy.page} ${value.toLocaleString(numberLocale)}`,
            rowsPerPage: copy.rowsPerPage,
            range: (from, to, total) => locale === 'th'
              ? `${from.toLocaleString(numberLocale)}–${to.toLocaleString(numberLocale)} จาก ${total.toLocaleString(numberLocale)}`
              : `${from.toLocaleString(numberLocale)}–${to.toLocaleString(numberLocale)} of ${total.toLocaleString(numberLocale)}`,
          }}
        />
      </AdminCard>

      <AdminDrawer
        open={Boolean(previewPermission)}
        title={previewPermission?.code ?? copy.details}
        description={previewPermission ? `${previewPermission.module} · ${previewPermission.name}` : undefined}
        closeLabel={copy.close}
        size="compact"
        onClose={() => setPreviewPermission(null)}
      >
        {previewPermission && <AdminStack>
          <div className="admin-governance-detail"><span>{copy.name}</span><strong>{previewPermission.name}</strong></div>
          <div className="admin-governance-detail"><span>{copy.module}</span><strong>{previewPermission.module}</strong></div>
          <div className="admin-governance-detail"><span>{copy.descriptionLabel}</span><strong>{previewPermission.description || copy.noDescription}</strong></div>
          <AdminNotice tone="warning">{copy.readOnly}</AdminNotice>
        </AdminStack>}
      </AdminDrawer>
    </div>
  </AdminPage>;
}

function RoleCard({ role, copy, locale, expanded, onToggle, onPermission }: {
  role: Role;
  copy: Copy;
  locale: string;
  expanded: boolean;
  onToggle: () => void;
  onPermission: (permission: Permission) => void;
}) {
  return <article className="admin-role-modern-card">
    <header>
      <div>
        <span className="admin-role-badges"><AdminBadge tone={role.hasWildcard ? 'danger' : 'neutral'}>{role.hasWildcard ? 'WILDCARD' : 'ROLE'}</AdminBadge><AdminBadge>{copy.level} {role.level}</AdminBadge></span>
        <strong>{role.name}</strong>
        <code>{role.code}</code>
        {role.description && <p>{role.description}</p>}
      </div>
      <dl>
        <div><dt>{copy.permissions}</dt><dd>{role.permissionCount.toLocaleString(locale)}</dd></div>
        <div><dt>{copy.users}</dt><dd>{role.adminUserCount.toLocaleString(locale)}</dd></div>
      </dl>
    </header>
    <AdminButton size="compact" tone="secondary" onClick={onToggle}>{expanded ? copy.hide : copy.show}</AdminButton>
    {expanded && <div className="admin-role-permission-groups">{groupPermissions(role.permissions).map(([module, permissions]) => <details key={module}>
      <summary><span>{module}</span><AdminBadge>{permissions.length.toLocaleString(locale)}</AdminBadge></summary>
      <div>{permissions.map((permission) => <button type="button" key={permission.id} onClick={() => onPermission(permission)}><code>{permission.code}</code><span>{permission.name}</span></button>)}</div>
    </details>)}</div>}
  </article>;
}

function accessTabs(locale: AdminLocale, roleTitle: string) {
  const th = locale === 'th';
  return [
    { id: 'accounts', label: th ? 'บัญชีผู้ดูแล' : 'Admin accounts', href: '/admin-accounts' },
    { id: 'roles', label: roleTitle, shortLabel: th ? 'สิทธิ์' : 'Roles', href: '/admin-roles' },
    { id: 'invitations', label: th ? 'คำเชิญ' : 'Invitations', href: '/admin-invitations' },
    { id: 'audit', label: th ? 'บันทึกการใช้งาน' : 'Audit logs', href: '/audit' },
    { id: 'security', label: th ? 'ความปลอดภัย' : 'Security', href: '/security' },
    { id: 'anti-bot', label: th ? 'ป้องกันบอต' : 'Bot protection', href: '/anti-bot' },
  ];
}

function groupPermissions(permissions: readonly Permission[]) {
  const groups = new Map<string, Permission[]>();
  for (const permission of permissions) groups.set(permission.module, [...(groups.get(permission.module) ?? []), permission]);
  return [...groups.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([module, items]) => [module, items.sort((left, right) => left.code.localeCompare(right.code))] as const);
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
    && (value.description === undefined || value.description === null || typeof value.description === 'string')
    && typeof value.level === 'number'
    && typeof value.adminUserCount === 'number'
    && typeof value.permissionCount === 'number'
    && typeof value.hasWildcard === 'boolean'
    && Array.isArray(value.permissions)
    && value.permissions.every(isPermission);
}

function isCurrentAdminResponse(value: unknown): value is CurrentAdminResponse {
  return isRecord(value)
    && (value.permissions === undefined
      || (Array.isArray(value.permissions) && value.permissions.every((permission) => typeof permission === 'string')));
}

function isAccessResponse(value: unknown): value is AccessResponse {
  return isRecord(value)
    && Array.isArray(value.roles)
    && value.roles.every(isRole)
    && Array.isArray(value.permissions)
    && value.permissions.every(isPermission);
}
