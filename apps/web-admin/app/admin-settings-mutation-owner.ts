export type AdminSettingsMutationOwner = '/settings' | '/system-settings';
export type AdminSettingsMutationImpact = 'normal' | 'operational' | 'sensitive';

export type AdminSettingsMutationContext = {
  owner: AdminSettingsMutationOwner;
  sourceRoute: string;
  domain: string;
  impact: AdminSettingsMutationImpact;
};

type MutationRule = {
  prefix: string;
  owner: AdminSettingsMutationOwner;
  domain: string;
  impact: AdminSettingsMutationImpact;
};

const MUTATION_RULES: readonly MutationRule[] = [
  rule('/admin/settings/scripts', '/settings', 'site.scripts', 'sensitive'),
  rule('/admin/settings/legal', '/settings', 'site.legal', 'sensitive'),
  rule('/admin/settings/branding', '/settings', 'site.branding', 'sensitive'),
  rule('/admin/settings/maintenance', '/settings', 'site.maintenance', 'sensitive'),
  rule('/admin/settings/features', '/settings', 'site.features', 'sensitive'),
  rule('/admin/settings/activities', '/settings', 'site.activities', 'sensitive'),
  rule('/admin/settings/', '/settings', 'site.settings', 'normal'),
  rule('/admin/site-settings', '/settings', 'site.settings', 'normal'),
  rule('/admin/maintenance', '/settings', 'site.maintenance', 'sensitive'),
  rule('/admin/feature-flags', '/settings', 'site.features', 'sensitive'),
  rule('/admin/provider-credentials', '/system-settings', 'provider.credentials', 'sensitive'),
  rule('/admin/provider-presets', '/system-settings', 'provider.presets', 'sensitive'),
  rule('/admin/provider-adapters', '/system-settings', 'provider.adapters', 'operational'),
  rule('/admin/game-providers', '/system-settings', 'provider.configuration', 'sensitive'),
  rule('/admin/providers', '/system-settings', 'provider.configuration', 'sensitive'),
  rule('/admin/game-api-settings', '/system-settings', 'provider.legacyApi', 'sensitive'),
  rule('/admin/home-games', '/system-settings', 'games.homeSelection', 'operational'),
  rule('/admin/games/home', '/system-settings', 'games.homeSelection', 'operational'),
].sort((left, right) => right.prefix.length - left.prefix.length);

export function resolveAdminSettingsMutationContext(path: string, sourceRoute = ''): AdminSettingsMutationContext | null {
  const normalizedPath = normalizePath(path);
  const matched = MUTATION_RULES.find((current) => normalizedPath === current.prefix || normalizedPath.startsWith(`${current.prefix}/`) || current.prefix.endsWith('/') && normalizedPath.startsWith(current.prefix));
  if (!matched) return null;
  return Object.freeze({
    owner: matched.owner,
    sourceRoute: normalizeSourceRoute(sourceRoute),
    domain: matched.domain,
    impact: matched.impact,
  });
}

export function applyAdminSettingsMutationHeaders(headers: Headers, path: string, sourceRoute = '') {
  const context = resolveAdminSettingsMutationContext(path, sourceRoute);
  if (!context) return null;
  if (!headers.has('X-Admin-Settings-Owner')) headers.set('X-Admin-Settings-Owner', context.owner);
  if (!headers.has('X-Admin-Settings-Source-Route')) headers.set('X-Admin-Settings-Source-Route', context.sourceRoute);
  if (!headers.has('X-Admin-Settings-Domain')) headers.set('X-Admin-Settings-Domain', context.domain);
  if (!headers.has('X-Admin-Settings-Impact')) headers.set('X-Admin-Settings-Impact', context.impact);
  return context;
}

export function validateAdminSettingsMutationRules() {
  const errors: string[] = [];
  const prefixes = new Set<string>();
  for (const current of MUTATION_RULES) {
    if (prefixes.has(current.prefix)) errors.push(`duplicate mutation prefix: ${current.prefix}`);
    prefixes.add(current.prefix);
    if (current.owner !== '/settings' && current.owner !== '/system-settings') errors.push(`invalid mutation owner: ${current.prefix}`);
    if (!current.domain.trim()) errors.push(`missing mutation domain: ${current.prefix}`);
  }
  return Object.freeze(errors);
}

function rule(prefix: string, owner: AdminSettingsMutationOwner, domain: string, impact: AdminSettingsMutationImpact): MutationRule {
  return Object.freeze({ prefix: normalizePath(prefix), owner, domain, impact });
}

function normalizePath(value: string) {
  const [path] = value.trim().split(/[?#]/, 1);
  if (!path) return '/';
  return `/${path.replace(/^\/+|\/+$/g, '')}${value.trim().endsWith('/') ? '/' : ''}`;
}

function normalizeSourceRoute(value: string) {
  const [path] = value.trim().split(/[?#]/, 1);
  if (!path) return '/unknown';
  return `/${path.replace(/^\/+|\/+$/g, '')}`;
}
