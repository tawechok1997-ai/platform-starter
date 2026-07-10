import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const ROOT = join(process.cwd(), 'apps', 'api', 'src');
const PUBLIC_ADMIN_CONTROLLERS = new Set([
  'modules/admin-auth/admin-auth.controller.ts',
  'modules/admin-access/admin-invitation.controller.ts',
]);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile() && entry.name.endsWith('.controller.ts')) files.push(path);
  }
  return files;
}

function normalize(path) {
  return relative(ROOT, path).split(sep).join('/');
}

function isAdminController(source) {
  return /@Controller\(\s*['"`]admin(?:\/|['"`])/.test(source);
}

function hasAdminGuard(source) {
  return /@UseGuards\([^)]*AdminAuthGuard/.test(source);
}

function hasPermissionMetadata(source) {
  return /@RequirePermission\(/.test(source);
}

const files = await walk(ROOT);
const results = [];

for (const file of files) {
  const source = await readFile(file, 'utf8');
  if (!isAdminController(source)) continue;

  const path = normalize(file);
  const intentionallyPublic = PUBLIC_ADMIN_CONTROLLERS.has(path);
  const guarded = hasAdminGuard(source);
  const permissioned = hasPermissionMetadata(source);

  results.push({ path, intentionallyPublic, guarded, permissioned });
}

const unguarded = results.filter((item) => !item.intentionallyPublic && !item.guarded);
const authOnly = results.filter((item) => !item.intentionallyPublic && item.guarded && !item.permissioned);
const publicControllers = results.filter((item) => item.intentionallyPublic);
const protectedControllers = results.filter((item) => item.guarded && item.permissioned);

console.log(`Admin controller audit: ${results.length} total`);
console.log(`  protected with permission metadata: ${protectedControllers.length}`);
console.log(`  auth-only, manual review required: ${authOnly.length}`);
console.log(`  intentionally public: ${publicControllers.length}`);
console.log(`  unguarded and not allowlisted: ${unguarded.length}`);

if (authOnly.length > 0) {
  console.warn('\nAuth-only admin controllers requiring manual permission review:');
  for (const item of authOnly) console.warn(`  - ${item.path}`);
}

if (unguarded.length > 0) {
  console.error('\nUnsafe admin controllers:');
  for (const item of unguarded) console.error(`  - ${item.path}`);
  process.exitCode = 1;
}
