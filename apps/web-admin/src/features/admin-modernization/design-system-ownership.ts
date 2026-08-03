export type AdminDesignSystemCapability =
  | 'shell'
  | 'appearance'
  | 'page'
  | 'card'
  | 'feedback'
  | 'button'
  | 'modal'
  | 'drawer'
  | 'table'
  | 'pagination'
  | 'form-field'
  | 'save-bar'
  | 'diff'
  | 'workspace-tabs';

export type AdminDesignSystemOwner = {
  capability: AdminDesignSystemCapability;
  modulePath: string;
  exportName: string;
  legacyAliases: readonly string[];
};

export const ADMIN_DESIGN_SYSTEM_OWNERS = [
  owner('shell', 'apps/web-admin/app/layout.tsx', 'AdminRootLayout'),
  owner('appearance', 'apps/web-admin/app/admin-appearance-runtime.tsx', 'AdminAppearanceRuntime'),
  owner('page', 'apps/web-admin/app/(admin)/_components/admin-ui.tsx', 'AdminPage', ['page-shell', 'workspace-page']),
  owner('card', 'apps/web-admin/app/(admin)/_components/admin-ui.tsx', 'AdminCard', ['panel', 'surface-card']),
  owner('feedback', 'apps/web-admin/app/(admin)/_components/admin-ui.tsx', 'AdminNotice', ['alert-box', 'inline-feedback']),
  owner('button', 'apps/web-admin/app/(admin)/_components/admin-ui.tsx', 'AdminButton', ['action-button']),
  owner('modal', 'apps/web-admin/app/(admin)/_components/admin-ui.tsx', 'AdminConfirmDialog', ['confirm-modal']),
  owner('drawer', 'apps/web-admin/app/(admin)/_components/admin-ui.tsx', 'AdminDrawer', ['detail-drawer', 'side-panel']),
  owner('table', 'apps/web-admin/src/features/admin-modernization/data-table.tsx', 'AdminDataTable', ['responsive-table', 'mobile-data-list']),
  owner('pagination', 'apps/web-admin/src/features/admin-modernization/pagination.ts', 'getPaginationTokens', ['local-pagination']),
  owner('form-field', 'apps/web-admin/src/features/admin-modernization/admin-form-controls.tsx', 'AdminFormField', ['field-wrapper']),
  owner('save-bar', 'apps/web-admin/src/features/admin-modernization/admin-form-controls.tsx', 'AdminSaveBar', ['sticky-actions']),
  owner('diff', 'apps/web-admin/src/features/admin-modernization/admin-form-controls.tsx', 'AdminDiffList', ['before-after']),
  owner('workspace-tabs', 'apps/web-admin/src/features/admin-modernization/workspace-tabs.tsx', 'AdminWorkspaceTabs', ['local-tabs']),
] as const satisfies readonly AdminDesignSystemOwner[];

export const ADMIN_P7_MIGRATED_ROUTES = [
  '/dashboard',
  '/settings',
  '/system-settings',
  '/activity-center',
  '/admin-accounts',
  '/admin-roles',
  '/admin-invitations',
] as const;

export function validateAdminDesignSystemOwners(owners: readonly AdminDesignSystemOwner[] = ADMIN_DESIGN_SYSTEM_OWNERS) {
  const errors: string[] = [];
  const capabilities = new Set<string>();
  const exports = new Set<string>();
  const aliases = new Map<string, string>();

  for (const current of owners) {
    if (capabilities.has(current.capability)) errors.push(`duplicate capability owner: ${current.capability}`);
    capabilities.add(current.capability);
    const exportKey = `${current.modulePath}#${current.exportName}`;
    if (exports.has(exportKey)) errors.push(`duplicate owner export: ${exportKey}`);
    exports.add(exportKey);
    if (hasVersionedOwnerName(current.modulePath) || hasVersionedOwnerName(current.exportName)) errors.push(`versioned owner name: ${exportKey}`);
    for (const alias of current.legacyAliases) {
      const previous = aliases.get(alias);
      if (previous && previous !== current.capability) errors.push(`legacy alias collision: ${alias}`);
      aliases.set(alias, current.capability);
    }
  }
  return Object.freeze(errors);
}

export function resolveAdminDesignSystemOwner(capability: AdminDesignSystemCapability) {
  return ADMIN_DESIGN_SYSTEM_OWNERS.find((ownerDefinition) => ownerDefinition.capability === capability) ?? null;
}

export function hasVersionedOwnerName(value: string) {
  return /(?:^|[-_.\/])(final(?:-v?\d+)?|new-new|v\d+)(?:[-_.\/]|$)/i.test(value);
}

function owner(
  capability: AdminDesignSystemCapability,
  modulePath: string,
  exportName: string,
  legacyAliases: readonly string[] = [],
): AdminDesignSystemOwner {
  return Object.freeze({ capability, modulePath, exportName, legacyAliases: Object.freeze([...legacyAliases]) });
}
