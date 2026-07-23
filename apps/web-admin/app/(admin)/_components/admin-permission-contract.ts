export const ADMIN_PERMISSIONS = {
  wildcard: '*',
  adminCreate: 'admin.create',
  adminAccessView: 'admin.access.view',
  adminAccessManage: 'admin.access.manage',
  gameProvidersView: 'game.providers.view',
  gameProvidersManage: 'game.providers.manage',
  reportsView: 'reports.view',
  reportsExport: 'reports.export',
  riskView: 'risk.view',
  topupsView: 'topups.view',
  depositView: 'deposit.view',
  withdrawView: 'withdraw.view',
} as const;

export const ADMIN_ACTION_PERMISSIONS = {
  auditExport: [ADMIN_PERMISSIONS.adminAccessManage],
  adminInvitationManage: [ADMIN_PERMISSIONS.adminCreate],
  webhookReplay: [ADMIN_PERMISSIONS.gameProvidersManage],
  dashboardTopupQueue: [ADMIN_PERMISSIONS.topupsView, ADMIN_PERMISSIONS.depositView],
  dashboardWithdrawalQueue: [ADMIN_PERMISSIONS.withdrawView],
  dashboardRiskQueue: [ADMIN_PERMISSIONS.riskView],
} as const satisfies Record<string, readonly string[]>;

export type AdminPermissionCode = (typeof ADMIN_PERMISSIONS)[keyof typeof ADMIN_PERMISSIONS];

export function hasAnyAdminPermission(permissions: readonly string[], required: readonly string[]) {
  if (permissions.includes(ADMIN_PERMISSIONS.wildcard)) return true;
  if (required.length === 0) return true;
  return required.some((permission) => permissions.includes(permission));
}

export function hasAllAdminPermissions(permissions: readonly string[], required: readonly string[]) {
  if (permissions.includes(ADMIN_PERMISSIONS.wildcard)) return true;
  return required.every((permission) => permissions.includes(permission));
}
