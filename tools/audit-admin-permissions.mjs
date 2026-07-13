import { readdir, readFile } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const ROOT = join(process.cwd(), 'apps', 'api', 'src');
const PUBLIC_ADMIN_CONTROLLERS = new Set([
  'modules/admin-auth/admin-auth.controller.ts',
  'modules/admin-access/admin-invitation.controller.ts',
]);
const MUTATION_DECORATOR = /@(Post|Put|Patch|Delete)\s*\(/g;

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

function classHasPermission(source) {
  const classIndex = source.search(/export\s+class\s+/);
  if (classIndex < 0) return false;
  const controllerIndex = source.lastIndexOf('@Controller', classIndex);
  if (controllerIndex < 0) return false;
  return /@RequirePermission\(/.test(source.slice(controllerIndex, classIndex));
}

function lineNumber(source, index) {
  return source.slice(0, index).split('\n').length;
}

function mutationHandlersMissingPermission(source) {
  if (classHasPermission(source)) return [];

  const missing = [];
  MUTATION_DECORATOR.lastIndex = 0;
  let match;
  while ((match = MUTATION_DECORATOR.exec(source))) {
    const decoratorIndex = match.index;
    const previousBoundary = Math.max(
      source.lastIndexOf('\n  @Get(', decoratorIndex),
      source.lastIndexOf('\n  @Post(', decoratorIndex - 1),
      source.lastIndexOf('\n  @Put(', decoratorIndex - 1),
      source.lastIndexOf('\n  @Patch(', decoratorIndex - 1),
      source.lastIndexOf('\n  @Delete(', decoratorIndex - 1),
      source.lastIndexOf('\n  async ', decoratorIndex),
      source.lastIndexOf('\n  public ', decoratorIndex),
    );
    const decoratorBlock = source.slice(Math.max(0, previousBoundary), decoratorIndex);
    if (!/@RequirePermission\(/.test(decoratorBlock)) {
      missing.push({ method: match[1].toUpperCase(), line: lineNumber(source, decoratorIndex) });
    }
  }
  return missing;
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
  const missingMutationPermissions = intentionallyPublic ? [] : mutationHandlersMissingPermission(source);

  results.push({ path, intentionallyPublic, guarded, permissioned, missingMutationPermissions });
}

const unguarded = results.filter((item) => !item.intentionallyPublic && !item.guarded);
const authOnly = results.filter((item) => !item.intentionallyPublic && item.guarded && !item.permissioned);
const publicControllers = results.filter((item) => item.intentionallyPublic);
const protectedControllers = results.filter((item) => item.guarded && item.permissioned);
const unsafeMutations = results.flatMap((item) => item.missingMutationPermissions.map((handler) => ({ path: item.path, ...handler })));

console.log(`Admin controller audit: ${results.length} total`);
console.log(`  protected with permission metadata: ${protectedControllers.length}`);
console.log(`  auth-only, manual review required: ${authOnly.length}`);
console.log(`  intentionally public: ${publicControllers.length}`);
console.log(`  unguarded and not allowlisted: ${unguarded.length}`);
console.log(`  mutation handlers missing permission metadata: ${unsafeMutations.length}`);

if (authOnly.length > 0) {
  console.warn('\nAuth-only admin controllers requiring manual permission review:');
  for (const item of authOnly) console.warn(`  - ${item.path}`);
}

if (unguarded.length > 0) {
  console.error('\nUnsafe admin controllers:');
  for (const item of unguarded) console.error(`  - ${item.path}`);
}

if (unsafeMutations.length > 0) {
  console.error('\nAdmin mutation handlers missing @RequirePermission metadata:');
  for (const item of unsafeMutations) console.error(`  - ${item.path}:${item.line} (${item.method})`);
}

if (unguarded.length || unsafeMutations.length) process.exitCode = 1;
