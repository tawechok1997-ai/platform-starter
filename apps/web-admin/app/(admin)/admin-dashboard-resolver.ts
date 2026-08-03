import {
  getAdminWorkspaceDefinition,
  localizeAdminWorkspace,
  resolveAdminDashboardKey,
  resolveAssignedAdminWorkspaces,
  resolvePrimaryAdminWorkspace,
  type AdminWorkspaceAssignment,
  type AdminWorkspaceId,
  type AdminWorkspaceSelection,
} from './admin-workspace-registry';

export type AdminDashboardQuickLink = {
  href: string;
  label: string;
  labelEn: string;
};

export type AdminDashboardModel = {
  key: AdminWorkspaceId | 'all';
  title: string;
  description: string;
  eyebrow: string;
  quickLinks: readonly { href: string; label: string }[];
  workspaceIds: readonly AdminWorkspaceId[];
};

const DASHBOARD_QUICK_LINKS: Record<AdminWorkspaceId, readonly AdminDashboardQuickLink[]> = {
  finance: [
    { href: '/reports', label: 'รายงานการเงิน', labelEn: 'Finance reports' },
    { href: '/wallet-analytics', label: 'วิเคราะห์กระเป๋าเงิน', labelEn: 'Wallet analytics' },
    { href: '/reconciliation-center', label: 'กระทบยอด', labelEn: 'Reconciliation' },
  ],
  payments: [
    { href: '/operations', label: 'คิวตรวจสอบ', labelEn: 'Review queue' },
    { href: '/topups', label: 'รายการฝาก', labelEn: 'Deposits' },
    { href: '/withdrawals', label: 'รายการถอน', labelEn: 'Withdrawals' },
  ],
  growth: [
    { href: '/growth-center', label: 'ภาพรวมการเติบโต', labelEn: 'Growth overview' },
    { href: '/promotion-operations', label: 'งานโปรโมชัน', labelEn: 'Promotion operations' },
    { href: '/affiliate-center', label: 'Affiliate', labelEn: 'Affiliate' },
  ],
  manager: [
    { href: '/operations', label: 'งานที่ต้องตรวจ', labelEn: 'Items to review' },
    { href: '/risk-alerts', label: 'ความเสี่ยง', labelEn: 'Risk alerts' },
    { href: '/admin-accounts', label: 'ทีมผู้ดูแล', labelEn: 'Admin team' },
  ],
  system: [
    { href: '/provider-health', label: 'สถานะค่ายเกม', labelEn: 'Provider health' },
    { href: '/security', label: 'ความปลอดภัย', labelEn: 'Security' },
    { href: '/settings', label: 'การตั้งค่า', labelEn: 'Settings' },
  ],
};

export function resolveAdminDashboardModel(
  assignments: readonly AdminWorkspaceAssignment[],
  selection: AdminWorkspaceSelection,
  locale: 'th' | 'en',
): AdminDashboardModel {
  const assigned = resolveAssignedAdminWorkspaces(assignments);
  const dashboardKey = resolveAdminDashboardKey(assignments, selection)
    ?? resolvePrimaryAdminWorkspace(assignments)?.id
    ?? 'system';

  if (dashboardKey === 'all') {
    const primary = resolvePrimaryAdminWorkspace(assignments)
      ?? getAdminWorkspaceDefinition('system');
    const localizedPrimary = primary ? localizeAdminWorkspace(primary, locale) : null;
    const quickLinks = uniqueQuickLinks(
      assigned.flatMap((workspace) => DASHBOARD_QUICK_LINKS[workspace.id]),
    ).slice(0, 6);

    return {
      key: 'all',
      title: locale === 'en' ? 'All workspaces' : 'ทุกพื้นที่ทำงาน',
      description: locale === 'en'
        ? `Combined view across ${assigned.length} assigned workspaces. Primary: ${localizedPrimary?.title ?? 'System administrator'}.`
        : `มุมมองรวมจาก ${assigned.length} พื้นที่ทำงาน ตำแหน่งหลัก: ${localizedPrimary?.title ?? 'คนดูแลระบบ'}`,
      eyebrow: locale === 'en' ? 'MULTI-ROLE DASHBOARD' : 'แดชบอร์ดหลายตำแหน่ง',
      quickLinks: localizeQuickLinks(quickLinks, locale),
      workspaceIds: assigned.map((workspace) => workspace.id),
    };
  }

  const workspace = getAdminWorkspaceDefinition(dashboardKey)
    ?? getAdminWorkspaceDefinition('system');
  if (!workspace) {
    return {
      key: 'system',
      title: locale === 'en' ? 'System administrator' : 'คนดูแลระบบ',
      description: locale === 'en' ? 'System operations workspace' : 'พื้นที่ทำงานดูแลระบบ',
      eyebrow: locale === 'en' ? 'ROLE-AWARE DASHBOARD' : 'แดชบอร์ดตามตำแหน่ง',
      quickLinks: [],
      workspaceIds: ['system'],
    };
  }

  const localized = localizeAdminWorkspace(workspace, locale);
  return {
    key: workspace.id,
    title: localized.title,
    description: localized.description,
    eyebrow: locale === 'en' ? 'ROLE-AWARE DASHBOARD' : 'แดชบอร์ดตามตำแหน่ง',
    quickLinks: localizeQuickLinks(DASHBOARD_QUICK_LINKS[workspace.id], locale),
    workspaceIds: [workspace.id],
  };
}

function localizeQuickLinks(
  links: readonly AdminDashboardQuickLink[],
  locale: 'th' | 'en',
) {
  return links.map((link) => ({
    href: link.href,
    label: locale === 'en' ? link.labelEn : link.label,
  }));
}

function uniqueQuickLinks(links: readonly AdminDashboardQuickLink[]) {
  const seen = new Set<string>();
  return links.filter((link) => {
    if (seen.has(link.href)) return false;
    seen.add(link.href);
    return true;
  });
}
