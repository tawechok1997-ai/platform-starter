import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';

const ROOT = process.cwd();
const API_SOURCE = join(ROOT, 'apps', 'api', 'src');
const ALLOWED_FILE = 'apps/api/src/common/security/jwt-auth.module.ts';
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts']);
const IGNORED_DIRECTORIES = new Set(['node_modules', 'dist', 'coverage', 'generated']);

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function walk(directory) {
  if (!await exists(directory)) return [];
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (entry.isFile() && SOURCE_EXTENSIONS.has(extname(entry.name))) files.push(path);
  }
  return files;
}

function normalizePath(path) {
  return relative(ROOT, path).split(sep).join('/');
}

const violations = [];
for (const path of await walk(API_SOURCE)) {
  const file = normalizePath(path);
  if (file === ALLOWED_FILE) continue;
  const source = await readFile(path, 'utf8');
  if (/JwtModule\.register(?:Async)?\s*\(/.test(source)) violations.push(file);
}

if (violations.length === 0) {
  console.log(`JWT registration boundary is valid: ${ALLOWED_FILE}`);
} else {
  console.error('JWT registration must be owned by the shared security module:');
  for (const file of violations) console.error(`  - ${file}`);
  process.exitCode = 1;
}
