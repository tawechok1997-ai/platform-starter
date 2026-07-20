import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join, relative, sep } from 'node:path';

const ROOT = process.cwd();
const STRICT = process.argv.includes('--strict');
const JSON_OUTPUT = process.argv.includes('--json');
const SOURCE_ROOTS = [join(ROOT, 'apps'), join(ROOT, 'packages')];
const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx', '.mts', '.cts', '.js', '.jsx', '.mjs', '.cjs']);
const IGNORED_DIRECTORIES = new Set(['node_modules', '.next', 'dist', 'coverage', 'generated']);

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

function normalizeRoute(path) {
  return `/${path}`
    .replaceAll(/\/+/g, '/')
    .replaceAll(/:[A-Za-z0-9_]+/g, ':param')
    .replaceAll(/\{[A-Za-z0-9_]+\}/g, ':param')
    .replace(/\/$/, '') || '/';
}

function extractControllerPrefix(source) {
  const match = source.match(/@Controller\(\s*(['"`])([^'"`]*)\1\s*\)/);
  return match?.[2] ?? null;
}

function extractRoutes(source, file) {
  const prefix = extractControllerPrefix(source);
  if (prefix === null) return [];
  const routes = [];
  const pattern = /@(Get|Post|Put|Patch|Delete|Options|Head|All)\s*\(\s*(?:(['"`])([^'"`]*)\2)?\s*\)/g;
  for (const match of source.matchAll(pattern)) {
    const method = match[1].toUpperCase();
    const localPath = match[3] ?? '';
    routes.push({ method, path: normalizeRoute(`${prefix}/${localPath}`), file });
  }
  return routes;
}

function extractNamedDeclarations(source, file) {
  const declarations = [];
  const pattern = /(?:export\s+)?(?:default\s+)?(?:abstract\s+)?(class|interface|type|enum|function)\s+([A-Za-z_$][\w$]*)/g;
  for (const match of source.matchAll(pattern)) {
    declarations.push({ kind: match[1], name: match[2], file });
  }
  return declarations;
}

function groupDuplicates(items, keyOf) {
  const groups = new Map();
  for (const item of items) {
    const key = keyOf(item);
    const existing = groups.get(key) ?? [];
    existing.push(item);
    groups.set(key, existing);
  }
  return [...groups.entries()]
    .filter(([, entries]) => entries.length > 1)
    .map(([key, entries]) => ({ key, entries }));
}

const files = (await Promise.all(SOURCE_ROOTS.map(walk))).flat();
const routes = [];
const declarations = [];

for (const absolutePath of files) {
  const file = normalizePath(absolutePath);
  const source = await readFile(absolutePath, 'utf8');
  routes.push(...extractRoutes(source, file));
  declarations.push(...extractNamedDeclarations(source, file));
}

const duplicateRoutes = groupDuplicates(routes, (route) => `${route.method} ${route.path}`);
const duplicateDeclarations = groupDuplicates(
  declarations.filter((item) => !item.file.endsWith('.spec.ts') && !item.file.endsWith('.test.ts')),
  (item) => `${item.kind}:${item.name}`,
);

const result = {
  scannedFiles: files.length,
  detectedRoutes: routes.length,
  detectedDeclarations: declarations.length,
  duplicateRoutes,
  duplicateDeclarations,
};

if (JSON_OUTPUT) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`Duplicate structure audit: ${files.length} source files`);
  console.log(`  duplicate normalized routes: ${duplicateRoutes.length}`);
  console.log(`  duplicate named declarations: ${duplicateDeclarations.length}`);

  for (const group of duplicateRoutes) {
    console.log(`\n[route] ${group.key}`);
    for (const entry of group.entries) console.log(`  - ${entry.file}`);
  }

  for (const group of duplicateDeclarations) {
    console.log(`\n[declaration] ${group.key}`);
    for (const entry of group.entries) console.log(`  - ${entry.file}`);
  }
}

if (STRICT && (duplicateRoutes.length > 0 || duplicateDeclarations.length > 0)) {
  process.exitCode = 1;
}
