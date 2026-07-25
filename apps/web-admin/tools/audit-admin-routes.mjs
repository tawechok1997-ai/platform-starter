import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const appRoot = path.resolve(process.cwd(), 'app');
const outputPath = path.resolve(process.cwd(), '../../docs/admin-route-registry.generated.json');

const ROUTE_FILES = new Set(['page.tsx', 'page.ts', 'page.jsx', 'page.js']);
const SYSTEM_SEGMENTS = new Set(['_components', '_lib', '_utils', '_hooks', '_styles']);

function normalizeSegment(segment) {
  if (segment.startsWith('(') && segment.endsWith(')')) return null;
  if (SYSTEM_SEGMENTS.has(segment)) return null;
  if (segment.startsWith('@')) return null;
  if (segment === 'page.tsx' || segment === 'page.ts' || segment === 'page.jsx' || segment === 'page.js') return null;
  if (segment.startsWith('[[...') && segment.endsWith(']]')) return `:${segment.slice(5, -2)}*?`;
  if (segment.startsWith('[...') && segment.endsWith(']')) return `:${segment.slice(4, -1)}*`;
  if (segment.startsWith('[') && segment.endsWith(']')) return `:${segment.slice(1, -1)}`;
  return segment;
}

function classifyRoute(route) {
  if (route === '/login' || route.includes('password') || route.includes('2fa') || route.includes('invite')) return 'auth';
  if (route.includes(':')) return 'dynamic-detail';
  if (route === '/not-found' || route.includes('error')) return 'system-state';
  return 'workspace';
}

function inferWorkspace(route) {
  const mappings = [
    ['command-center', ['/dashboard', '/operations', '/activity']],
    ['finance', ['/finance', '/topups', '/withdrawals', '/wallet', '/reconciliation', '/reports']],
    ['members', ['/members', '/member', '/bank-accounts', '/kyc', '/support']],
    ['risk-compliance', ['/risk', '/blacklist', '/watchlist', '/aml']],
    ['provider-operations', ['/providers', '/provider', '/webhook', '/game-settings', '/setup-wizard', '/presets']],
    ['games', ['/games', '/game-sessions', '/game-transfers']],
    ['growth-promotions', ['/growth', '/promotions', '/promotion', '/bonus']],
    ['affiliate-commission', ['/affiliate', '/commission']],
    ['content', ['/content', '/cms', '/assets']],
    ['access-security', ['/admins', '/admin-accounts', '/roles', '/invitations', '/audit', '/security', '/anti-bot']],
    ['settings', ['/settings']],
    ['authentication', ['/login', '/password', '/2fa', '/invite']],
  ];

  const match = mappings.find(([, prefixes]) => prefixes.some((prefix) => route === prefix || route.startsWith(`${prefix}/`)));
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
      return {
        route,
        source: path.relative(process.cwd(), file).replaceAll(path.sep, '/'),
        routeType: classifyRoute(route),
        workspace: inferWorkspace(route),
        requiresMobilePattern: true,
        requiresThai: true,
        requiresEnglish: true,
        requiredStates: ['loading', 'empty', 'error', 'permission-denied'],
      };
    })
    .sort((a, b) => a.route.localeCompare(b.route));

  const duplicates = routes.filter((route, index) => routes.findIndex((candidate) => candidate.route === route.route) !== index);
  const unassigned = routes.filter((route) => route.workspace === 'unassigned');

  const registry = {
    generatedAt: new Date().toISOString(),
    appRoot: 'apps/web-admin/app',
    totalRoutes: routes.length,
    unassignedCount: unassigned.length,
    routes,
  };

  await fs.writeFile(outputPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');

  console.log(`Admin route registry generated: ${routes.length} routes`);
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
