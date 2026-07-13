import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const ADMIN_ROOT = join(process.cwd(), 'apps', 'web-admin', 'app', '(admin)');
const NAV_FILE = join(ADMIN_ROOT, 'admin-nav.ts');
const ROUTE_ALLOWLIST = new Set(['/dashboard', '/operations', '/security']);
const navSource = await readFile(NAV_FILE, 'utf8');

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
  return `/${rel.replace(/\[[^/]+\]/g, ':id')}`;
}
function extractProtectedHrefs(source) {
  const protectedHrefs = [];
  const itemPattern = /\{\s*title:\s*['"][^'"]+['"],\s*href:\s*['"]([^'"]+)['"]\s*,\s*permissions:\s*\[([^\]]+)\]/g;
  let match;
  while ((match = itemPattern.exec(source))) protectedHrefs.push(match[1]);
  return protectedHrefs.sort((a, b) => b.length - a.length);
}
function isProtected(route, protectedHrefs) {
  if (ROUTE_ALLOWLIST.has(route) || [...ROUTE_ALLOWLIST].some((href) => route.startsWith(`${href}/`))) return true;
  return protectedHrefs.some((href) => route === href || route.startsWith(`${href}/`) || route.replace(/\/:[^/]+/g, '').startsWith(`${href}/`));
}

const protectedHrefs = extractProtectedHrefs(navSource);
const pages = (await walk(ADMIN_ROOT)).map(routeFromPage).filter((route) => route !== '/');
const unprotected = pages.filter((route) => !isProtected(route, protectedHrefs));

const navItemsWithoutPermission = [...navSource.matchAll(/\{\s*title:\s*['"]([^'"]+)['"],\s*href:\s*['"]([^'"]+)['"](?!\s*,\s*permissions)/g)]
  .map((m) => ({ title: m[1], href: m[2] }))
  .filter((item) => !ROUTE_ALLOWLIST.has(item.href));

console.log(`Admin UI permission audit: ${pages.length} admin page routes`);
console.log(`  protected/allowlisted routes: ${pages.length - unprotected.length}`);
console.log(`  unprotected routes: ${unprotected.length}`);
console.log(`  sidebar items without permission metadata outside allowlist: ${navItemsWithoutPermission.length}`);

if (unprotected.length) {
  console.error('\nAdmin page routes missing route permission coverage:');
  for (const route of unprotected) console.error(`  - ${route}`);
}
if (navItemsWithoutPermission.length) {
  console.error('\nAdmin sidebar items missing permission metadata:');
  for (const item of navItemsWithoutPermission) console.error(`  - ${item.href} (${item.title})`);
}
if (unprotected.length || navItemsWithoutPermission.length) process.exitCode = 1;
