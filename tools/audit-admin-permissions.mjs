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

function lineNumber(source, index) {
  return source.slice(0, index).split('\n').length;
}

function matchingBrace(source, openIndex) {
  let depth = 0;
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index];
    if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return source.length - 1;
}

function adminControllerClassBlocks(source) {
  const blocks = [];
  const controllerPattern = /@Controller\(\s*['"`]admin(?:\/[^'"`]*)?['"`]\s*\)/g;
  let match;
  while ((match = controllerPattern.exec(source))) {
    const classIndex = source.indexOf('export class ', match.index);
    if (classIndex < 0) continue;
    const openBrace = source.indexOf('{', classIndex);
    if (openBrace < 0) continue;
    const closeBrace = matchingBrace(source, openBrace);
    const decoratorStart = source.lastIndexOf('\n@', match.index);
    const start = decoratorStart >= 0 ? decoratorStart + 1 : match.index;
    blocks.push({ source: source.slice(start, closeBrace + 1), offset: start });
    controllerPattern.lastIndex = closeBrace + 1;
  }
  return blocks;
}

function classHasPermission(classSource) {
  const classIndex = classSource.search(/export\s+class\s+/);
  if (classIndex < 0) return false;
  return /@RequirePermission\(/.test(classSource.slice(0, classIndex));
}

function mutationHandlersMissingPermission(source) {
  const missing = [];

  for (const block of adminControllerClassBlocks(source)) {
    if (classHasPermission(block.source)) continue;

    const lines = block.source.split('\n');
    for (let index = 0; index < lines.length; index += 1) {
      const mutation = lines[index].match(/@(Post|Put|Patch|Delete)\s*\(/);
      if (!mutation) continue;

      let start = index;
      while (start > 0 && /^\s*@/.test(lines[start - 1])) start -= 1;
      const decoratorBlock = lines.slice(start, index + 1).join('\n');
      if (!/@RequirePermission\(/.test(decoratorBlock)) {
        const localOffset = lines.slice(0, index).join('\n').length + (index > 0 ? 1 : 0);
        missing.push({
          method: mutation[1].toUpperCase(),
          line: lineNumber(source, block.offset + localOffset),
        });
      }
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
