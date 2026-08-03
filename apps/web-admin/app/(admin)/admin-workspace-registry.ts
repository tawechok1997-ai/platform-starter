export type AdminWorkspaceId =
  | 'finance'
  | 'payments'
  | 'growth'
  | 'manager'
  | 'system';

export type AdminDashboardKey = AdminWorkspaceId;

export type AdminWorkspaceDefinition = {
  id: AdminWorkspaceId;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  dashboardKey: AdminDashboardKey;
  landingHref: '/dashboard';
  navGroupIds: readonly string[];
  priority: number;
};

export type AdminWorkspaceAssignment = {
  workspaceId: AdminWorkspaceId;
  primary?: boolean;
  enabled?: boolean;
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
  },
] as const satisfies readonly AdminWorkspaceDefinition[];

const workspaceById = new Map<AdminWorkspaceId, AdminWorkspaceDefinition>(
  ADMIN_WORKSPACE_REGISTRY.map((workspace) => [workspace.id, workspace]),
);

export function getAdminWorkspaceDefinition(workspaceId: AdminWorkspaceId) {
  return workspaceById.get(workspaceId) ?? null;
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
): AdminDashboardKey | null {
  return resolvePrimaryAdminWorkspace(assignments)?.dashboardKey ?? null;
}

export function workspaceAllowsNavGroup(
  workspaceId: AdminWorkspaceId,
  navGroupId: string,
) {
  return getAdminWorkspaceDefinition(workspaceId)?.navGroupIds.includes(navGroupId) ?? false;
}

export function resolveVisibleNavGroupIds(
  assignments: readonly AdminWorkspaceAssignment[],
) {
  const visibleGroupIds = new Set<string>();

  for (const workspace of resolveAssignedAdminWorkspaces(assignments)) {
    for (const groupId of workspace.navGroupIds) visibleGroupIds.add(groupId);
  }

  return visibleGroupIds;
}
