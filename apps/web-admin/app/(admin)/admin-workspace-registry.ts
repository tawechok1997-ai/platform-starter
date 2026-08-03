export type AdminWorkspaceId =
  | 'finance'
  | 'payments'
  | 'growth'
  | 'manager'
  | 'system';

export type AdminWorkspaceSelection = AdminWorkspaceId | 'all';
export type AdminDashboardKey = AdminWorkspaceId | 'all';

export type AdminWorkspaceDefinition = {
  id: AdminWorkspaceId;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  dashboardKey: AdminWorkspaceId;
  landingHref: '/dashboard';
  navGroupIds: readonly string[];
  priority: number;
  roleAliases: readonly string[];
  permissionPrefixes: readonly string[];
};

export type AdminWorkspaceAssignment = {
  workspaceId: AdminWorkspaceId;
  primary?: boolean;
  enabled?: boolean;
};

type WorkspaceAwareRole = {
  name?: string;
  code?: string;
  templateCode?: string;
  workspaceId?: string;
  primary?: boolean;
  enabled?: boolean;
};

export type AdminWorkspaceIdentity = {
  workspaces?: readonly unknown[];
  workspaceAssignments?: readonly unknown[];
  primaryWorkspaceId?: string;
  roles?: readonly (string | WorkspaceAwareRole)[];
  position?: string;
  department?: string;
  permissions?: readonly string[];
};

/**
 * P3 navigation owner.
 *
 * P2 maps role templates and multi-role assignments into
 * AdminWorkspaceAssignment records. P3 deliberately does not import the P2
 * database model so both phases can progress independently without creating a
 * second role authority.
 */
export const ADMIN_WORKSPACE_REGISTRY = [
  {
    id: 'finance',
    title: 'การเงิน',
    titleEn: 'Finance',
    description: 'รายงานการเงิน กระเป๋าเงิน และการกระทบยอด',
    descriptionEn: 'Finance reporting, wallets, and reconciliation',
    dashboardKey: 'finance',
    landingHref: '/dashboard',
    navGroupIds: ['overview', 'finance', 'members', 'risk'],
    priority: 50,
    roleAliases: ['finance', 'financial', 'accounting', 'accountant', 'treasury', 'reporting', 'การเงิน', 'บัญชี'],
    permissionPrefixes: ['reports.', 'wallet.', 'commission.', 'bonus.ledger.'],
  },
  {
    id: 'payments',
    title: 'ฝากถอน',
    titleEn: 'Deposits & withdrawals',
    description: 'ตรวจรายการฝาก ถอน และคิวปฏิบัติการ',
    descriptionEn: 'Review deposits, withdrawals, and operation queues',
    dashboardKey: 'payments',
    landingHref: '/dashboard',
    navGroupIds: ['overview', 'finance', 'members', 'risk'],
    priority: 60,
    roleAliases: ['payment', 'payments', 'cashier', 'deposit', 'withdraw', 'topup', 'ฝากถอน', 'ฝาก', 'ถอน'],
    permissionPrefixes: ['topups.', 'deposit.', 'withdraw.'],
  },
  {
    id: 'growth',
    title: 'การตลาด',
    titleEn: 'Marketing',
    description: 'โปรโมชัน พันธมิตร และเนื้อหา',
    descriptionEn: 'Promotions, partners, and content',
    dashboardKey: 'growth',
    landingHref: '/dashboard',
    navGroupIds: ['overview', 'growth', 'content', 'members'],
    priority: 40,
    roleAliases: ['growth', 'marketing', 'promotion', 'affiliate', 'content', 'การตลาด', 'โปรโมชัน', 'พันธมิตร'],
    permissionPrefixes: ['promotion.', 'promotions.', 'affiliate.', 'settings.features.'],
  },
  {
    id: 'manager',
    title: 'หัวหน้า',
    titleEn: 'Manager',
    description: 'ภาพรวมทีม งานค้าง ความเสี่ยง และการกำกับดูแล',
    descriptionEn: 'Team overview, pending work, risk, and governance',
    dashboardKey: 'manager',
    landingHref: '/dashboard',
    navGroupIds: [
      'overview',
      'finance',
      'members',
      'risk',
      'providers',
      'games',
      'growth',
      'content',
      'administration',
    ],
    priority: 100,
    roleAliases: ['manager', 'head', 'supervisor', 'lead', 'owner', 'หัวหน้า', 'ผู้จัดการ'],
    permissionPrefixes: ['team.', 'approval.', 'risk.'],
  },
  {
    id: 'system',
    title: 'คนดูแลระบบ',
    titleEn: 'System administrator',
    description: 'ระบบ การเชื่อมต่อ ความปลอดภัย และการตั้งค่า',
    descriptionEn: 'System, integrations, security, and configuration',
    dashboardKey: 'system',
    landingHref: '/dashboard',
    navGroupIds: ['overview', 'providers', 'games', 'content', 'administration'],
    priority: 90,
    roleAliases: ['system', 'system_admin', 'super_admin', 'administrator', 'admin', 'devops', 'คนดูแลระบบ', 'ผู้ดูแลระบบ'],
    permissionPrefixes: ['admin.', 'security.', 'settings.', 'provider.', 'game.providers.'],
  },
] as const satisfies readonly AdminWorkspaceDefinition[];

const workspaceById = new Map<AdminWorkspaceId, AdminWorkspaceDefinition>(
  ADMIN_WORKSPACE_REGISTRY.map((workspace) => [workspace.id, workspace]),
);

export function isAdminWorkspaceId(value: unknown): value is AdminWorkspaceId {
  return typeof value === 'string' && workspaceById.has(value as AdminWorkspaceId);
}

export function getAdminWorkspaceDefinition(workspaceId: AdminWorkspaceId) {
  return workspaceById.get(workspaceId) ?? null;
}

export function localizeAdminWorkspace(
  workspace: AdminWorkspaceDefinition,
  locale: 'th' | 'en',
) {
  return {
    ...workspace,
    title: locale === 'en' ? workspace.titleEn : workspace.title,
    description: locale === 'en' ? workspace.descriptionEn : workspace.description,
  };
}

export function normalizeAdminWorkspaceAssignments(
  values: readonly unknown[] | undefined,
): AdminWorkspaceAssignment[] {
  if (!values) return [];
  const normalized: AdminWorkspaceAssignment[] = [];

  for (const value of values) {
    if (typeof value === 'string' && isAdminWorkspaceId(value)) {
      normalized.push({ workspaceId: value });
      continue;
    }
    if (!value || typeof value !== 'object') continue;
    const candidate = value as Record<string, unknown>;
    const workspaceId = candidate.workspaceId ?? candidate.id;
    if (!isAdminWorkspaceId(workspaceId)) continue;
    normalized.push({
      workspaceId,
      primary: candidate.primary === true,
      enabled: candidate.enabled !== false,
    });
  }

  return deduplicateAssignments(normalized);
}

export function inferAdminWorkspaceAssignments(
  identity: AdminWorkspaceIdentity | null | undefined,
): AdminWorkspaceAssignment[] {
  if (!identity) return [{ workspaceId: 'system', primary: true }];

  const explicit = normalizeAdminWorkspaceAssignments(
    identity.workspaceAssignments ?? identity.workspaces,
  );
  const inferred: AdminWorkspaceAssignment[] = [...explicit];
  const primaryWorkspaceId = isAdminWorkspaceId(identity.primaryWorkspaceId)
    ? identity.primaryWorkspaceId
    : null;

  for (const role of identity.roles ?? []) {
    if (typeof role === 'string') {
      const workspaceId = resolveWorkspaceIdFromToken(role);
      if (workspaceId) inferred.push({ workspaceId });
      continue;
    }

    if (isAdminWorkspaceId(role.workspaceId)) {
      inferred.push({
        workspaceId: role.workspaceId,
        primary: role.primary === true,
        enabled: role.enabled !== false,
      });
      continue;
    }

    const roleToken = role.templateCode || role.code || role.name;
    const workspaceId = resolveWorkspaceIdFromToken(roleToken);
    if (workspaceId) {
      inferred.push({
        workspaceId,
        primary: role.primary === true,
        enabled: role.enabled !== false,
      });
    }
  }

  for (const token of [identity.position, identity.department]) {
    const workspaceId = resolveWorkspaceIdFromToken(token);
    if (workspaceId) inferred.push({ workspaceId });
  }

  const permissions = identity.permissions ?? [];
  if (permissions.includes('*')) {
    inferred.push({ workspaceId: 'manager' }, { workspaceId: 'system' });
  } else {
    for (const workspace of ADMIN_WORKSPACE_REGISTRY) {
      if (permissions.some((permission) => workspace.permissionPrefixes.some((prefix) => permission.startsWith(prefix)))) {
        inferred.push({ workspaceId: workspace.id });
      }
    }
  }

  const deduplicated = deduplicateAssignments(inferred);
  if (deduplicated.length === 0) deduplicated.push({ workspaceId: 'system' });

  const requestedPrimary = primaryWorkspaceId
    ?? deduplicated.find((assignment) => assignment.primary)?.workspaceId
    ?? null;

  return deduplicated.map((assignment, index) => ({
    ...assignment,
    primary: requestedPrimary
      ? assignment.workspaceId === requestedPrimary
      : index === 0,
  }));
}

export function resolveAssignedAdminWorkspaces(
  assignments: readonly AdminWorkspaceAssignment[],
) {
  const enabledIds = new Set<AdminWorkspaceId>();

  for (const assignment of assignments) {
    if (assignment.enabled === false) continue;
    enabledIds.add(assignment.workspaceId);
  }

  return ADMIN_WORKSPACE_REGISTRY
    .filter((workspace) => enabledIds.has(workspace.id))
    .sort((left, right) => right.priority - left.priority);
}

export function resolvePrimaryAdminWorkspace(
  assignments: readonly AdminWorkspaceAssignment[],
) {
  const explicitPrimary = assignments.find(
    (assignment) => assignment.enabled !== false && assignment.primary,
  );

  if (explicitPrimary) {
    return getAdminWorkspaceDefinition(explicitPrimary.workspaceId);
  }

  return resolveAssignedAdminWorkspaces(assignments)[0] ?? null;
}

export function resolveAdminDashboardKey(
  assignments: readonly AdminWorkspaceAssignment[],
  selection?: AdminWorkspaceSelection,
): AdminDashboardKey | null {
  if (selection === 'all') return 'all';
  if (selection && assignments.some((assignment) => assignment.enabled !== false && assignment.workspaceId === selection)) {
    return selection;
  }
  return resolvePrimaryAdminWorkspace(assignments)?.dashboardKey ?? null;
}

export function resolveAdminWorkspaceSelection(
  assignments: readonly AdminWorkspaceAssignment[],
  requested: unknown,
): AdminWorkspaceSelection {
  if (requested === 'all' && resolveAssignedAdminWorkspaces(assignments).length > 1) return 'all';
  if (isAdminWorkspaceId(requested)
    && assignments.some((assignment) => assignment.enabled !== false && assignment.workspaceId === requested)) {
    return requested;
  }
  return resolvePrimaryAdminWorkspace(assignments)?.id ?? 'system';
}

export function workspaceAllowsNavGroup(
  workspaceId: AdminWorkspaceId,
  navGroupId: string,
) {
  return getAdminWorkspaceDefinition(workspaceId)?.navGroupIds.includes(navGroupId) ?? false;
}

export function resolveVisibleNavGroupIds(
  assignments: readonly AdminWorkspaceAssignment[],
  selection: AdminWorkspaceSelection = 'all',
) {
  const visibleGroupIds = new Set<string>();
  const workspaces = selection === 'all'
    ? resolveAssignedAdminWorkspaces(assignments)
    : resolveAssignedAdminWorkspaces(assignments).filter((workspace) => workspace.id === selection);

  for (const workspace of workspaces) {
    for (const groupId of workspace.navGroupIds) visibleGroupIds.add(groupId);
  }

  return visibleGroupIds;
}

export function resolveWorkspaceIdFromToken(token: unknown): AdminWorkspaceId | null {
  if (typeof token !== 'string') return null;
  const normalized = token.trim().toLocaleLowerCase('th').replace(/[\s-]+/g, '_');
  if (!normalized) return null;

  for (const workspace of ADMIN_WORKSPACE_REGISTRY) {
    if (workspace.roleAliases.some((alias) => {
      const normalizedAlias = alias.toLocaleLowerCase('th').replace(/[\s-]+/g, '_');
      return normalized === normalizedAlias || normalized.includes(normalizedAlias);
    })) return workspace.id;
  }

  return null;
}

function deduplicateAssignments(
  assignments: readonly AdminWorkspaceAssignment[],
) {
  const byWorkspace = new Map<AdminWorkspaceId, AdminWorkspaceAssignment>();

  for (const assignment of assignments) {
    if (!isAdminWorkspaceId(assignment.workspaceId)) continue;
    const current = byWorkspace.get(assignment.workspaceId);
    byWorkspace.set(assignment.workspaceId, {
      workspaceId: assignment.workspaceId,
      primary: Boolean(current?.primary || assignment.primary),
      enabled: current?.enabled === false && assignment.enabled !== true
        ? false
        : assignment.enabled !== false,
    });
  }

  return [...byWorkspace.values()].filter((assignment) => assignment.enabled !== false);
}
