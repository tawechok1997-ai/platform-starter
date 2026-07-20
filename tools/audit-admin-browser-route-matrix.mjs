import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const root = process.cwd();
const appRoot = join(root, 'apps/web-admin/app');
const matrixPath = join(root, 'tests/e2e-smoke/admin-critical-routes.json');

function fail(message) {
  console.error(`Admin browser route matrix audit failed: ${message}`);
  process.exitCode = 1;
}

function walk(directory, files = []) {
  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) walk(path, files);
    else if (entry === 'page.tsx' || entry === 'page.jsx' || entry === 'page.js') files.push(path);
  }
  return files;
}

function routeFromPage(file) {
  const segments = relative(appRoot, file).split(sep).slice(0, -1)
    .filter((segment) => !(segment.startsWith('(') && segment.endsWith(')')))
    .filter((segment) => !segment.startsWith('@'));
  if (segments.some((segment) => segment.startsWith('['))) return null;
  return `/${segments.join('/')}`.replace(/\/$/, '') || '/';
}

if (!existsSync(matrixPath)) {
  fail('missing tests/e2e-smoke/admin-critical-routes.json');
  process.exit();
}

const matrix = JSON.parse(readFileSync(matrixPath, 'utf8'));
const routes = [matrix.loginRoute, ...(matrix.protectedRoutes ?? [])];
const viewports = matrix.viewports ?? [];
const availableRoutes = new Set(walk(appRoot).map(routeFromPage).filter(Boolean));

if (!matrix.loginRoute?.startsWith('/')) fail('loginRoute must start with /');
if (!Array.isArray(matrix.protectedRoutes) || matrix.protectedRoutes.length === 0) fail('protectedRoutes must not be empty');
if (!Array.isArray(viewports) || viewports.length < 3) fail('at least three viewports are required');

const duplicateRoutes = routes.filter((route, index) => routes.indexOf(route) !== index);
if (duplicateRoutes.length) fail(`duplicate routes: ${[...new Set(duplicateRoutes)].join(', ')}`);

for (const route of routes) {
  if (typeof route !== 'string' || !route.startsWith('/')) fail(`invalid route: ${String(route)}`);
  else if (!availableRoutes.has(route)) fail(`route has no static page: ${route}`);
}

const viewportNames = new Set();
for (const viewport of viewports) {
  if (!viewport?.name || !Number.isInteger(viewport.width) || !Number.isInteger(viewport.height)) {
    fail(`invalid viewport: ${JSON.stringify(viewport)}`);
    continue;
  }
  if (viewport.width < 280 || viewport.height < 500) fail(`viewport is unrealistically small: ${viewport.name}`);
  if (viewportNames.has(viewport.name)) fail(`duplicate viewport name: ${viewport.name}`);
  viewportNames.add(viewport.name);
}

if (!process.exitCode) {
  console.log(`Admin browser route matrix is valid: ${routes.length} routes, ${viewports.length} viewports.`);
}
