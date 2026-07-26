import assert from 'node:assert/strict';
import { promises as fs, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { getWorkspaceByPathname } from './workspaces';

const ROUTE_FILES = new Set(['page.tsx', 'page.ts', 'page.jsx', 'page.js']);
const SYSTEM_SEGMENTS = new Set(['_components', '_lib', '_utils', '_hooks', '_styles']);
const AUTHENTICATION_ROUTES = new Set(['/', '/login', '/two-factor', '/accept-invitation']);
const auditSource = readFileSync(new URL('../../../tools/audit-admin-routes.mjs', import.meta.url), 'utf8');

function normalizeSegment(segment: string) {
  if (segment.startsWith('(') && segment.endsWith(')')) return null;
  if (SYSTEM_SEGMENTS.has(segment) || segment.startsWith('@') || ROUTE_FILES.has(segment)) return null;
  if (segment.startsWith('[[...') && segment.endsWith(']]')) return `:${segment.slice(5, -2)}*?`;
  if (segment.startsWith('[...') && segment.endsWith(']')) return `:${segment.slice(4, -1)}*`;
  if (segment.startsWith('[') && segment.endsWith(']')) return `:${segment.slice(1, -1)}`;
  return segment;
}

async function walk(directory: string, files: string[] = []) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(absolute, files);
    else if (entry.isFile() && ROUTE_FILES.has(entry.name)) files.push(absolute);
  }
  return files;
}

function routeFromPage(appRoot: string, pageFile: string) {
  const relative = path.relative(appRoot, pageFile);
  const segments = relative.split(path.sep).map(normalizeSegment).filter((segment): segment is string => Boolean(segment));
  return `/${segments.join('/')}`.replace(/\/$/, '') || '/';
}

test('route inventory imports the canonical workspace registry', () => {
  assert.equal(auditSource.includes("import { ADMIN_WORKSPACES } from '../src/features/admin-modernization/workspaces.ts'"), true);
  assert.equal(auditSource.includes('...ADMIN_WORKSPACES.map((workspace)'), true);
  assert.equal(auditSource.includes("['members', ['/members'"), false);
});

test('every Admin route belongs to a workspace or the authentication surface', async () => {
  const appRoot = path.resolve(process.cwd(), 'app');
  const routes = (await walk(appRoot)).map((file) => routeFromPage(appRoot, file)).sort();
  const duplicates = routes.filter((route, index) => routes.indexOf(route) !== index);
  const unowned = routes.filter((route) => !AUTHENTICATION_ROUTES.has(route) && !getWorkspaceByPathname(route));

  assert.ok(routes.length >= 80, `expected the complete Admin surface, found only ${routes.length} routes`);
  assert.deepEqual(duplicates, [], `duplicate routes: ${duplicates.join(', ')}`);
  assert.deepEqual(unowned, [], `routes without a workspace owner: ${unowned.join(', ')}`);
});
