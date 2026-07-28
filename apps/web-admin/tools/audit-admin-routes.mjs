import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { isSafeSelfServicePath, requiredPermissionsForPath } from '../app/(admin)/admin-nav.ts';
import {
  ADMIN_ROUTE_DENY_SENTINEL,
  buildRouteTestCoverage,
  inferDesktopPattern,
  inferMobilePattern,
  inferPrimaryTask,
  legacyBehaviorFor,
  localizationNamespaceFor,
  normalizeDataSources,
  parentRouteFor,
  requiredStatesForRoute,
  validateRouteContract,
} from '../src/features/admin-modernization/route-registry-contract.ts';
import { ADMIN_WORKSPACES } from '../src/features/admin-modernization/workspaces.ts';

const appRoot = path.resolve(process.cwd(), 'app');
const srcRoot = path.resolve(process.cwd(), 'src');
const repoRoot = path.resolve(process.cwd(), '../..');
const outputPath = path.resolve(repoRoot, 'docs/admin-route-registry.generated.json');

const ROUTE_FILES = new Set(['page.tsx', 'page.ts', 'page.jsx', 'page.js']);
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const SYSTEM_SEGMENTS = new Set(['_components', '_lib', '_utils', '_hooks', '_styles']);
const AUTH_ROUTES = new Set(['/', '/login', '/two-factor', '/accept-invitation']);
const UTILITY_ROUTES = new Set([
  '/adapter-test',
  '/settings/branding/history',
  '/settings/branding/preview',
  '/webhook-test',
]);
const EDITOR_ROUTES = new Set([
  '/anti-bot',
  '/game-api-settings',
  '/profile/edit',
  '/provider-credentials',
  '/provider-presets',
  '/provider-setup-wizard',
  '/security/2fa',
  '/settings/branding',
  '/settings/contact',
  '/settings/features',
  '/settings/icons',
  '/settings/legal',
  '/settings/maintenance',
  '/settings/scripts',
  '/settings/seo',
  '/settings/theme',
  '/settings/website',
  '/simple-game-settings',
]);

const WORKSPACE_PREFIXES = [
  ['authentication', ['/', '/login', '/two-factor', '/accept-invitation']],
  ...ADMIN_WORKSPACES.map((workspace) => [workspace.id, workspace.legacyPrefixes]),
];

function normalizeFilePath(value) {
  return value.split(path.sep).join('/');
}

function normalizeSegment(segment) {
  if (segment.startsWith('(') && segment.endsWith(')')) return null;
  if (SYSTEM_SEGMENTS.has(segment)) return null;
  if (segment.startsWith('@')) return null;
  if (ROUTE_FILES.has(segment)) return null;
  if (segment.startsWith('[[...') && segment.endsWith(']]')) return `:${segment.slice(5, -2)}*?`;
  if (segment.startsWith('[...') && segment.endsWith(']')) return `:${segment.slice(4, -1)}*`;
  if (segment.startsWith('[') && segment.endsWith(']')) return `:${segment.slice(1, -1)}`;
  return segment;
}

function routeMatchesPrefix(route, prefix) {
  if (prefix === '/') return route === '/';
  return route === prefix || route.startsWith(`${prefix}/`);
}

function inferWorkspace(route) {
  const match = WORKSPACE_PREFIXES.find(([, prefixes]) => prefixes.some((prefix) => routeMatchesPrefix(route, prefix)));
  return match?.[0] ?? 'unassigned';
}

function workspaceFor(id) {
  return ADMIN_WORKSPACES.find((workspace) => workspace.id === id) ?? null;
}

function classifyRoute(route, workspace) {
  if (workspace === 'authentication' || AUTH_ROUTES.has(route)) return 'auth';
  if (route.includes(':')) return 'dynamic-detail';
  if (route === '/not-found' || route.includes('/error') || route.endsWith('-error')) return 'system-state';
  if (UTILITY_ROUTES.has(route)) return 'utility';
  if (EDITOR_ROUTES.has(route)) return 'editor';
  return 'workspace';
}

async function walk(directory, files = []) {
  let entries;
  try {
    entries = await fs.readdir(directory, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(absolute, files);
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

function routeFromPage(pageFile) {
  const relative = path.relative(appRoot, pageFile);
  const parts = relative.split(path.sep).map(normalizeSegment).filter(Boolean);
  return `/${parts.join('/')}`.replace(/\/$/, '') || '/';
}

async function resolveImportPath(fromFile, request) {
  if (!request.startsWith('.')) return null;
  const base = path.resolve(path.dirname(fromFile), request);
  const candidates = [
    base,
    ...SOURCE_EXTENSIONS.map((extension) => `${base}${extension}`),
    ...SOURCE_EXTENSIONS.map((extension) => path.join(base, `index${extension}`)),
  ];
  for (const candidate of candidates) {
    const normalized = normalizeFilePath(candidate);
    if (!normalized.startsWith(normalizeFilePath(path.resolve(process.cwd())))) continue;
    try {
      const source = await fs.readFile(candidate, 'utf8');
      return { path: candidate, source };
    } catch {
      // Try the next supported extension.
    }
  }
  return null;
}

async function collectSourceGraph(entryFile, visited = new Set(), depth = 0) {
  if (visited.has(entryFile) || depth > 5) return { source: '', files: [] };
  visited.add(entryFile);
  let source;
  try {
    source = await fs.readFile(entryFile, 'utf8');
  } catch {
    return { source: '', files: [] };
  }

  const chunks = [source];
  const files = [entryFile];
  const imports = [...source.matchAll(/from\s+['"](\.[^'"]+)['"]/g)].map((match) => match[1]);
  for (const request of imports) {
    const imported = await resolveImportPath(entryFile, request);
    if (!imported) continue;
    const child = await collectSourceGraph(imported.path, visited, depth + 1);
    chunks.push(child.source);
    files.push(...child.files);
  }
  return { source: chunks.join('\n'), files: [...new Set(files)] };
}

function localTestsFor(sourceFiles, testFiles) {
  const sourceDirectories = new Set(sourceFiles.map((file) => path.dirname(file)));
  const sourceBases = new Set(sourceFiles.map((file) => path.basename(file).replace(/\.(?:tsx?|jsx?)$/, '')));
  return testFiles
    .filter((file) => {
      if (sourceDirectories.has(path.dirname(file))) return true;
      const testBase = path.basename(file).replace(/\.spec\.(?:tsx?|jsx?)$/, '');
      return sourceBases.has(testBase);
    })
    .map((file) => normalizeFilePath(path.relative(repoRoot, file)))
    .sort();
}

function apiEndpointsFrom(source) {
  return [...new Set(
    [...source.matchAll(/['"`]((?:\/api)?\/admin\/[A-Za-z0-9_?&=:\-/${}.]+)['"`]/g)].map((match) => match[1]),
  )].sort();
}

function permissionMetadata(route, routeType) {
  if (routeType === 'auth') return { permissions: ['public'], permissionSource: 'public-auth' };
  if (isSafeSelfServicePath(route)) {
    return { permissions: ['authenticated-admin:self-service'], permissionSource: 'safe-self-service' };
  }
  return { permissions: [...requiredPermissionsForPath(route)], permissionSource: 'admin-nav' };
}

async function main() {
  const allAppFiles = await walk(appRoot);
  const allSrcFiles = await walk(srcRoot);
  const pageFiles = allAppFiles.filter((file) => ROUTE_FILES.has(path.basename(file)));
  const testFiles = [...allAppFiles, ...allSrcFiles].filter((file) => /\.spec\.(?:tsx?|jsx?)$/.test(file));

  const routes = [];
  for (const file of pageFiles) {
    const route = routeFromPage(file);
    const workspaceId = inferWorkspace(route);
    const workspace = workspaceFor(workspaceId);
    const routeType = classifyRoute(route, workspaceId);
    const graph = await collectSourceGraph(file);
    const permissions = permissionMetadata(route, routeType);
    const apiEndpoints = apiEndpointsFrom(graph.source);
    const desktopPattern = inferDesktopPattern(routeType, graph.source);
    const localTests = localTestsFor(graph.files, testFiles);
    const baseContract = {
      route,
      source: normalizeFilePath(path.relative(process.cwd(), file)),
      routeType,
      workspace: workspaceId,
      parentRoute: parentRouteFor(route, workspace?.route ?? null),
      permissions: permissions.permissions,
      permissionSource: permissions.permissionSource,
      primaryTask: inferPrimaryTask(route, routeType),
      dataSources: normalizeDataSources(apiEndpoints, routeType),
      desktopPattern,
      mobilePattern: inferMobilePattern(routeType, workspace?.mobilePattern ?? null, desktopPattern),
      localizationNamespace: localizationNamespaceFor(route, workspace?.labelKey ?? null),
      requiredLocales: ['th', 'en'],
      requiredStates: requiredStatesForRoute(routeType),
      testCoverage: buildRouteTestCoverage(routeType, permissions.permissions, localTests),
      legacyBehavior: legacyBehaviorFor(route, workspace?.route ?? null, routeType),
    };
    const findings = validateRouteContract(baseContract);
    routes.push({
      ...baseContract,
      status: findings.length === 0 ? 'verified' : 'implementing',
      findings,
    });
  }

  routes.sort((a, b) => a.route.localeCompare(b.route));
  const duplicates = routes.filter((route, index) => routes.findIndex((candidate) => candidate.route === route.route) !== index);
  const unassigned = routes.filter((route) => route.workspace === 'unassigned');
  const contractFindings = routes.flatMap((route) => route.findings.map((finding) => ({ route: route.route, finding })));
  const permissionGaps = routes.filter((route) => route.permissions.includes(ADMIN_ROUTE_DENY_SENTINEL));
  const workspaceCounts = Object.fromEntries([...new Set(routes.map((route) => route.workspace))]
    .sort()
    .map((workspace) => [workspace, routes.filter((route) => route.workspace === workspace).length]));
  const routeTypeCounts = Object.fromEntries([...new Set(routes.map((route) => route.routeType))]
    .sort()
    .map((routeType) => [routeType, routes.filter((route) => route.routeType === routeType).length]));
  const statusCounts = Object.fromEntries(['verified', 'implementing']
    .map((status) => [status, routes.filter((route) => route.status === status).length]));

  const registry = {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    appRoot: 'apps/web-admin/app',
    totalRoutes: routes.length,
    unassignedCount: unassigned.length,
    contractFindingCount: contractFindings.length,
    permissionGapCount: permissionGaps.length,
    workspaceCounts,
    routeTypeCounts,
    statusCounts,
    requiredFields: [
      'route',
      'routeType',
      'workspace',
      'parentRoute',
      'permissions',
      'primaryTask',
      'dataSources',
      'desktopPattern',
      'mobilePattern',
      'localizationNamespace',
      'requiredStates',
      'testCoverage',
      'legacyBehavior',
      'status',
    ],
    contractFindings,
    routes,
  };

  await fs.writeFile(outputPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');

  console.log(`Admin route registry v2 generated: ${routes.length} routes`);
  console.log(`Workspace owners: ${Object.entries(workspaceCounts).map(([name, count]) => `${name}=${count}`).join(', ')}`);
  console.log(`Route types: ${Object.entries(routeTypeCounts).map(([name, count]) => `${name}=${count}`).join(', ')}`);
  console.log(`Verified routes: ${statusCounts.verified}; implementing routes: ${statusCounts.implementing}`);
  console.log(`Output: ${path.relative(process.cwd(), outputPath)}`);

  if (duplicates.length > 0) {
    console.error(`Duplicate routes detected: ${duplicates.map((item) => item.route).join(', ')}`);
    process.exitCode = 1;
  }
  if (unassigned.length > 0) {
    console.error('Routes without a workspace owner:');
    for (const route of unassigned) console.error(`- ${route.route} (${route.source})`);
    process.exitCode = 1;
  }
  if (contractFindings.length > 0) {
    console.error('Routes with incomplete registry contracts:');
    for (const item of contractFindings) console.error(`- ${item.route}: ${item.finding}`);
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
