import type { AdminWorkspace } from './workspaces';

export type AdminRouteType =
  | 'auth'
  | 'workspace'
  | 'dynamic-detail'
  | 'editor'
  | 'utility'
  | 'system-state';

export type AdminDesktopPattern =
  | 'centered-form'
  | 'dashboard'
  | 'table'
  | 'editor'
  | 'detail'
  | 'workspace'
  | 'system-state';

export type AdminMobilePattern =
  | AdminWorkspace['mobilePattern']
  | 'full-width-form'
  | 'stacked-detail'
  | 'full-screen-sheet'
  | 'system-state';

export type RouteTestCoverage = {
  unit: readonly string[];
  interaction: readonly string[];
  smoke: readonly string[];
  visual: readonly string[];
  permission: readonly string[];
};

export type AdminRouteContract = {
  route: string;
  source: string;
  routeType: AdminRouteType;
  workspace: string;
  parentRoute: string | null;
  permissions: readonly string[];
  permissionSource: 'public-auth' | 'safe-self-service' | 'admin-nav';
  primaryTask: string;
  dataSources: readonly string[];
  desktopPattern: AdminDesktopPattern;
  mobilePattern: AdminMobilePattern;
  localizationNamespace: string;
  requiredLocales: readonly ['th', 'en'];
  requiredStates: readonly string[];
  testCoverage: RouteTestCoverage;
  legacyBehavior: 'public-entry' | 'canonical' | 'compatibility' | 'compatibility-detail';
  status: 'verified' | 'implementing';
  findings: readonly string[];
};

export const ADMIN_ROUTE_DENY_SENTINEL = '__admin.route.unregistered__';

const PRIMARY_TASK_OVERRIDES: Readonly<Record<string, string>> = {
  '/': 'Enter the Admin application',
  '/login': 'Authenticate an Admin account',
  '/two-factor': 'Complete two-factor authentication',
  '/accept-invitation': 'Accept an Admin invitation',
  '/dashboard': 'Review system health and urgent work',
  '/operations': 'Process the cross-domain review queue',
  '/settings': 'Find and open a configuration area',
  '/settings/branding': 'Manage brand identity and visual assets',
  '/settings/branding/history': 'Review branding change history',
  '/settings/branding/preview': 'Preview branding across supported surfaces',
  '/settings/contact': 'Manage public contact channels',
  '/settings/features': 'Control Member-facing feature availability',
  '/settings/icons': 'Manage navigation and category icons',
  '/settings/legal': 'Manage legal documents and effective versions',
  '/settings/maintenance': 'Configure maintenance mode and service impact',
  '/settings/scripts': 'Manage tracking and custom script configuration',
  '/settings/seo': 'Manage search and social metadata',
  '/settings/theme': 'Manage shared theme and motion preferences',
  '/settings/website': 'Manage website identity and defaults',
};

function humanizeRouteSegment(route: string) {
  const segment = route.split('/').filter(Boolean).at(-1) ?? 'admin';
  if (segment.startsWith(':')) return 'record';
  return segment.replaceAll('-', ' ');
}

export function inferPrimaryTask(route: string, routeType: AdminRouteType) {
  const overridden = PRIMARY_TASK_OVERRIDES[route];
  if (overridden) return overridden;
  const subject = humanizeRouteSegment(route);
  if (routeType === 'dynamic-detail') return `Review ${subject} details and related history`;
  if (routeType === 'editor') return `Review and update ${subject} configuration`;
  if (routeType === 'utility') return `Use the ${subject} utility`;
  if (routeType === 'system-state') return `Recover from the ${subject} state`;
  return `Review and manage ${subject}`;
}

export function parentRouteFor(route: string, workspaceRoute: string | null) {
  if (route === '/' || route === workspaceRoute) return null;
  const withoutDynamic = route.replace(/\/:\w+(?:\*\??)?$/, '');
  if (withoutDynamic !== route) return withoutDynamic || workspaceRoute;
  const segments = route.split('/').filter(Boolean);
  if (segments.length > 1) return `/${segments.slice(0, -1).join('/')}`;
  return workspaceRoute;
}

export function requiredStatesForRoute(routeType: AdminRouteType) {
  if (routeType === 'auth') return ['loading', 'error', 'locked', 'expired'];
  if (routeType === 'dynamic-detail') {
    return ['loading', 'error', 'permission-denied', 'not-found', 'deleted', 'stale'];
  }
  if (routeType === 'system-state') return ['loading', 'error', 'retry'];
  if (routeType === 'editor') return ['loading', 'error', 'permission-denied', 'stale', 'unsaved'];
  return ['loading', 'empty', 'error', 'permission-denied', 'stale'];
}

export function inferDesktopPattern(routeType: AdminRouteType, source: string): AdminDesktopPattern {
  if (routeType === 'auth') return 'centered-form';
  if (routeType === 'dynamic-detail') return 'detail';
  if (routeType === 'editor') return 'editor';
  if (routeType === 'system-state') return 'system-state';
  if (/<table\b|AdminTable|DataTable|LedgerTable/.test(source)) return 'table';
  if (/Chart|Kpi|Dashboard|Metric|SummaryCard/.test(source)) return 'dashboard';
  if (/<form\b|onSubmit\s*=/.test(source)) return 'editor';
  return 'workspace';
}

export function inferMobilePattern(
  routeType: AdminRouteType,
  workspacePattern: AdminWorkspace['mobilePattern'] | null,
  desktopPattern: AdminDesktopPattern,
): AdminMobilePattern {
  if (routeType === 'auth') return 'full-width-form';
  if (routeType === 'dynamic-detail') return 'stacked-detail';
  if (routeType === 'system-state') return 'system-state';
  if (routeType === 'editor' || desktopPattern === 'editor') return 'full-screen-sheet';
  return workspacePattern ?? 'stack';
}

export function localizationNamespaceFor(route: string, workspaceLabelKey: string | null) {
  if (route === '/' || route === '/login' || route === '/two-factor' || route === '/accept-invitation') {
    return 'admin.authentication';
  }
  if (workspaceLabelKey) return workspaceLabelKey.replace(/\.label$/, '');
  return `admin.routes.${humanizeRouteSegment(route).replaceAll(' ', '-')}`;
}

export function normalizeDataSources(apiEndpoints: readonly string[], routeType: AdminRouteType) {
  const unique = [...new Set(apiEndpoints)].sort();
  if (unique.length > 0) return unique;
  if (routeType === 'auth') return ['/admin/auth/*'];
  if (routeType === 'utility') return ['client-utility'];
  return ['client-state-or-navigation'];
}

export function legacyBehaviorFor(route: string, workspaceRoute: string | null, routeType: AdminRouteType) {
  if (routeType === 'auth') return 'public-entry' as const;
  if (route === workspaceRoute) return 'canonical' as const;
  if (routeType === 'dynamic-detail') return 'compatibility-detail' as const;
  return 'compatibility' as const;
}

export function buildRouteTestCoverage(
  routeType: AdminRouteType,
  permissions: readonly string[],
  localTests: readonly string[],
): RouteTestCoverage {
  const unit = localTests.length > 0
    ? [...localTests]
    : ['Admin Verification & Bundle / route contract coverage'];
  return {
    unit,
    interaction: routeType === 'auth' || routeType === 'editor'
      ? ['Admin Verification & Bundle', 'Admin Browser Regression Matrix']
      : ['Admin Browser Regression Matrix'],
    smoke: ['Admin Browser Regression Matrix', 'Full-System Automated Tests'],
    visual: ['R-013 Visual Regression'],
    permission: permissions.length > 0
      ? ['requiredPermissionsForPath', 'Admin Functional Capability Audit']
      : ['public-or-safe-self-service policy'],
  };
}

export function validateRouteContract(contract: Omit<AdminRouteContract, 'status' | 'findings'>) {
  const findings: string[] = [];
  if (!contract.workspace || contract.workspace === 'unassigned') findings.push('missing-workspace-owner');
  if (!contract.primaryTask.trim()) findings.push('missing-primary-task');
  if (contract.dataSources.length === 0) findings.push('missing-data-source');
  if (!contract.localizationNamespace.trim()) findings.push('missing-localization-namespace');
  if (contract.permissions.includes(ADMIN_ROUTE_DENY_SENTINEL)) findings.push('unregistered-route-permission');
  if (contract.routeType === 'dynamic-detail') {
    for (const state of ['not-found', 'deleted', 'stale']) {
      if (!contract.requiredStates.includes(state)) findings.push(`missing-dynamic-state:${state}`);
    }
  }
  for (const [category, evidence] of Object.entries(contract.testCoverage)) {
    if (evidence.length === 0) findings.push(`missing-test-coverage:${category}`);
  }
  return findings;
}
