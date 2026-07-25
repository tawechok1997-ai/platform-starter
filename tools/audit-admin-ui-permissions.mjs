import { readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';
import { tsImport } from 'tsx/esm/api';

const { navGroups, requiredPermissionsForPath } = await tsImport('../apps/web-admin/app/(admin)/admin-nav.ts', import.meta.url);
const ADMIN_ROOT = join(process.cwd(), 'apps', 'web-admin', 'app', '(admin)');
const ROUTE_ALLOWLIST = new Set(['/dashboard', '/operations', '/profile', '/security']);

function normalize(path) { return path.split(sep).join('/'); }

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile() && entry.name === 'page.tsx') files.push(path);
  }
  return files;
}

function routeFromPage(file) {
  const rel = normalize(relative(ADMIN_ROOT, file)).replace(/\/page\.tsx$/, '');
  if (!rel) return '/';
  return `/${rel.replace(/\[([^/]+)\]/g, ':$1')}`;
}

function isAllowlisted(route) {
  return ROUTE_ALLOWLIST.has(route)
    || [...ROUTE_ALLOWLIST].some((href) => route.startsWith(`${href}/`));
}

const pages = (await walk(ADMIN_ROOT)).map(routeFromPage).filter((route) => route !== '/').sort();
const unprotected = pages.filter((route) => !isAllowlisted(route) && requiredPermissionsForPath(route).length === 0);
const navItemsWithoutPermission = navGroups
  .flatMap((group) => group.items)
  .filter((item) => !isAllowlisted(item.href) && (!item.permissions || item.permissions.length === 0));
const duplicateHrefs = navGroups
  .flatMap((group) => group.items.map((item) => item.href))
  .filter((href, index, items) => items.indexOf(href) !== index);

console.log(`Admin UI permission audit: ${pages.length} admin page routes`);
console.log(`  protected/allowlisted routes: ${pages.length - unprotected.length}`);
console.log(`  unprotected routes: ${unprotected.length}`);
console.log(`  navigation items without permission metadata outside allowlist: ${navItemsWithoutPermission.length}`);
console.log(`  duplicate navigation hrefs: ${duplicateHrefs.length}`);

if (unprotected.length) {
  console.error('\nAdmin page routes missing route permission coverage:');
  for (const route of unprotected) console.error(`  - ${route}`);
}
if (navItemsWithoutPermission.length) {
  console.error('\nAdmin navigation items missing permission metadata:');
  for (const item of navItemsWithoutPermission) console.error(`  - ${item.href} (${item.title})`);
}
if (duplicateHrefs.length) {
  console.error('\nDuplicate Admin navigation hrefs:');
  for (const href of [...new Set(duplicateHrefs)]) console.error(`  - ${href}`);
}

if (unprotected.length || navItemsWithoutPermission.length || duplicateHrefs.length) process.exitCode = 1;
