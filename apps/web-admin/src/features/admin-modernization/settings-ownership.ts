export type AdminSettingsOwner = '/settings' | '/system-settings';
export type AdminSettingsMigrationStatus = 'keep' | 'merge' | 'redirect' | 'deprecated' | 'remove';
export type AdminSettingsImpact = 'normal' | 'operational' | 'sensitive';

export type AdminSettingsRouteDefinition = {
  route: string;
  owner: AdminSettingsOwner;
  status: AdminSettingsMigrationStatus;
  dataKeys: readonly string[];
  permissionBase: string;
  impact: AdminSettingsImpact;
  replacementRoute?: string;
};

export const ADMIN_SETTINGS_ROUTE_REGISTRY = [
  route('/settings', '/settings', 'keep', ['settings.workspace'], 'settings.website', 'normal'),
  route('/settings/website', '/settings', 'merge', ['site.name', 'site.domain', 'site.locale', 'site.status'], 'settings.website', 'normal'),
  route('/settings/contact', '/settings', 'merge', ['site.contact', 'site.social'], 'settings.contact', 'normal'),
  route('/settings/seo', '/settings', 'merge', ['site.seo', 'site.robots', 'site.socialPreview'], 'settings.seo', 'normal'),
  route('/settings/legal', '/settings', 'merge', ['site.legal'], 'settings.legal', 'sensitive'),
  route('/settings/branding', '/settings', 'merge', ['site.branding'], 'settings.branding', 'sensitive'),
  route('/settings/branding/history', '/settings', 'redirect', [], 'settings.branding', 'normal', '/settings?section=experience&panel=branding-history'),
  route('/settings/branding/preview', '/settings', 'redirect', [], 'settings.branding', 'normal', '/settings?section=experience&panel=branding-preview'),
  route('/settings/icons', '/settings', 'merge', ['site.icons'], 'settings.branding', 'normal'),
  route('/settings/theme', '/settings', 'merge', ['site.theme', 'site.layout'], 'settings.theme', 'normal'),
  route('/settings/features', '/settings', 'merge', ['site.features'], 'settings.features', 'sensitive'),
  route('/settings/activities', '/settings', 'merge', ['site.activities', 'site.rewards'], 'settings.features', 'sensitive'),
  route('/settings/maintenance', '/settings', 'merge', ['site.maintenance'], 'settings.maintenance', 'sensitive'),
  route('/settings/scripts', '/settings', 'merge', ['site.scripts', 'site.tracking'], 'settings.scripts', 'sensitive'),

  route('/system-settings', '/system-settings', 'keep', ['system.workspace'], 'provider.view', 'operational'),
  route('/simple-game-settings', '/system-settings', 'merge', ['provider.configuration'], 'provider.update', 'sensitive'),
  route('/provider-setup-wizard', '/system-settings', 'merge', ['provider.configuration'], 'provider.update', 'sensitive'),
  route('/provider-presets', '/system-settings', 'merge', ['provider.presets'], 'provider.update', 'sensitive'),
  route('/provider-credentials', '/system-settings', 'merge', ['provider.credentials'], 'provider.update', 'sensitive'),
  route('/game-api-settings', '/system-settings', 'deprecated', ['provider.legacyApi'], 'provider.update', 'sensitive', '/system-settings?section=providers&panel=legacy-api'),
  route('/game-control/home-games', '/system-settings', 'merge', ['games.homeSelection'], 'settings.features', 'operational'),
] as const satisfies readonly AdminSettingsRouteDefinition[];

export type AdminSensitiveChangeInput = {
  route: string;
  permission: string;
  confirmed: boolean;
  reason: string;
  auditAction: string;
};

export function resolveAdminSettingsRoute(routePath: string) {
  return ADMIN_SETTINGS_ROUTE_REGISTRY.find((definition) => definition.route === normalizeRoute(routePath)) ?? null;
}

export function resolveAdminSettingsOwner(routePath: string): AdminSettingsOwner | null {
  return resolveAdminSettingsRoute(routePath)?.owner ?? null;
}

export function buildAdminSettingsRedirect(routePath: string, search = '', hash = '') {
  const definition = resolveAdminSettingsRoute(routePath);
  if (!definition?.replacementRoute) return null;
  const [replacementPath, replacementQuery = ''] = definition.replacementRoute.split('?');
  const params = new URLSearchParams(replacementQuery);
  const incoming = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  for (const [key, value] of incoming) if (!params.has(key)) params.append(key, value);
  const query = params.toString();
  const normalizedHash = hash ? (hash.startsWith('#') ? hash : `#${hash}`) : '';
  return `${replacementPath}${query ? `?${query}` : ''}${normalizedHash}`;
}

export function validateAdminSettingsOwnership(registry: readonly AdminSettingsRouteDefinition[] = ADMIN_SETTINGS_ROUTE_REGISTRY) {
  const errors: string[] = [];
  const routes = new Set<string>();
  const writeOwners = new Map<string, string>();
  for (const definition of registry) {
    if (routes.has(definition.route)) errors.push(`duplicate route: ${definition.route}`);
    routes.add(definition.route);
    if (definition.owner !== '/settings' && definition.owner !== '/system-settings') errors.push(`invalid owner: ${definition.route}`);
    if ((definition.status === 'redirect' || definition.status === 'deprecated') && !definition.replacementRoute) errors.push(`missing replacement: ${definition.route}`);
    for (const dataKey of definition.dataKeys) {
      const previous = writeOwners.get(dataKey);
      if (previous && previous !== definition.owner) errors.push(`duplicate writer for ${dataKey}: ${previous} and ${definition.owner}`);
      writeOwners.set(dataKey, definition.owner);
    }
  }
  return Object.freeze(errors);
}

export function validateSensitiveAdminSettingsChange(input: AdminSensitiveChangeInput) {
  const definition = resolveAdminSettingsRoute(input.route);
  if (!definition) return Object.freeze(['Unknown settings route']);
  if (definition.impact !== 'sensitive') return Object.freeze([]);
  const errors: string[] = [];
  const requiredPermission = `${definition.permissionBase}.update`;
  if (input.permission !== requiredPermission && input.permission !== '*') errors.push(`Missing permission: ${requiredPermission}`);
  if (!input.confirmed) errors.push('Confirmation is required');
  if (input.reason.trim().length < 8) errors.push('Reason must contain at least 8 characters');
  if (!input.auditAction.trim()) errors.push('Audit action is required');
  return Object.freeze(errors);
}

function route(
  routePath: string,
  owner: AdminSettingsOwner,
  status: AdminSettingsMigrationStatus,
  dataKeys: readonly string[],
  permissionBase: string,
  impact: AdminSettingsImpact,
  replacementRoute?: string,
): AdminSettingsRouteDefinition {
  return Object.freeze({ route: normalizeRoute(routePath), owner, status, dataKeys: Object.freeze([...dataKeys]), permissionBase, impact, replacementRoute });
}

function normalizeRoute(routePath: string) {
  const [pathname] = routePath.trim().split(/[?#]/, 1);
  if (!pathname || pathname === '/') return '/';
  return `/${pathname.replace(/^\/+|\/+$/g, '')}`;
}
