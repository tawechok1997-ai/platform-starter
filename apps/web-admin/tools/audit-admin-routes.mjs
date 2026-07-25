import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const appRoot = path.resolve(process.cwd(), 'app');
const outputPath = path.resolve(process.cwd(), '../../docs/admin-route-registry.generated.json');

const ROUTE_FILES = new Set(['page.tsx', 'page.ts', 'page.jsx', 'page.js']);
const SYSTEM_SEGMENTS = new Set(['_components', '_lib', '_utils', '_hooks', '_styles']);

const WORKSPACE_PREFIXES = [
  ['authentication', ['/', '/login', '/two-factor', '/accept-invitation']],
  ['command-center', ['/dashboard', '/operations', '/activity-center', '/activity']],
  ['finance', [
    '/finance', '/topups', '/withdrawals', '/bulk-queue-operations', '/wallets', '/wallet-ledgers',
    '/wallet-statement', '/wallet-analytics', '/reconciliation-center', '/reports', '/exports',
    '/ledgers', '/money-ops',
  ]],
  ['members', ['/members', '/member-detail', '/member-insights', '/bank-accounts', '/kyc', '/kyc-center', '/support-center']],
  ['risk-compliance', ['/risk-alerts', '/risk-operations', '/provider-risk', '/audit-risk', '/investigation', '/blacklist', '/watchlist', '/aml']],
  ['provider-operations', [
    '/provider-health', '/simple-game-settings', '/provider-setup-wizard', '/provider-presets',
    '/game-providers', '/provider-credentials', '/provider-adapters', '/provider-wallet-snapshots',
    '/webhook-logs', '/webhook-settlement', '/webhook-test', '/adapter-test', '/game-api-settings',
  ]],
  ['games', ['/games', '/game-sessions', '/game-transfers']],
  ['growth-promotions', ['/growth-center', '/promotion-operations', '/promotion-center', '/promotion-claims', '/bonus-ledgers']],
  ['affiliate-commission', ['/affiliate-center', '/commission-ledgers']],
  ['content', ['/content-center']],
  ['access-security', [
    '/access', '/admin-accounts', '/admin-roles', '/admin-invitations', '/audit', '/audit-logs',
    '/security', '/anti-bot', '/profile',
  ]],
  ['settings', ['/settings']],
];

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

function classifyRoute(route, workspace) {
  if (workspace === 'authentication') return 'auth';
  if (route.includes(':')) return 'dynamic-detail';
  if (route === '/not-found' || route.includes('error')) return 'system-state';
  return 'workspace';
}

function inferWorkspace(route) {
  const match = WORKSPACE_PREFIXES.find(([, prefixes]) => prefixes.some((prefix) => routeMatchesPrefix(route, prefix)));
  return match?.[0] ?? 'unassigned';
}

async function walk(directory, files = []) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(absolute, files);
    } else if (entry.isFile() && ROUTE_FILES.has(entry.name)) {
      files.push(absolute);
    }
  }
  return files;
}

function routeFromPage(pageFile) {
  const relative = path.relative(appRoot, pageFile);
  const parts = relative.split(path.sep).map(normalizeSegment).filter(Boolean);
  return `/${parts.join('/')}`.replace(/\/$/, '') || '/';
}

async function main() {
  const pageFiles = await walk(appRoot);
  const routes = pageFiles
    .map((file) => {
      const route = routeFromPage(file);
      const workspace = inferWorkspace(route);
      return {
        route,
        source: path.relative(process.cwd(), file).replaceAll(path.sep, '/'),
        routeType: classifyRoute(route, workspace),
        workspace,
        requiresMobilePattern: true,
        requiresThai: true,
        requiresEnglish: true,
        requiredStates: ['loading', 'empty', 'error', 'permission-denied'],
      };
    })
    .sort((a, b) => a.route.localeCompare(b.route));

  const duplicates = routes.filter((route, index) => routes.findIndex((candidate) => candidate.route === route.route) !== index);
  const unassigned = routes.filter((route) => route.workspace === 'unassigned');
  const workspaceCounts = Object.fromEntries([...new Set(routes.map((route) => route.workspace))]
    .sort()
    .map((workspace) => [workspace, routes.filter((route) => route.workspace === workspace).length]));

  const registry = {
    generatedAt: new Date().toISOString(),
    appRoot: 'apps/web-admin/app',
    totalRoutes: routes.length,
    unassignedCount: unassigned.length,
    workspaceCounts,
    routes,
  };

  await fs.writeFile(outputPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');

  console.log(`Admin route registry generated: ${routes.length} routes`);
  console.log(`Workspace owners: ${Object.entries(workspaceCounts).map(([name, count]) => `${name}=${count}`).join(', ')}`);
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
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
